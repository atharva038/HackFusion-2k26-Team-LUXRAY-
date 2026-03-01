import xlsx from 'xlsx';
import { openai } from '../../config/openai.js';
import Medicine from '../../models/medicine.model.js';
import Order from '../../models/order.model.js';
import logger from '../../utils/logger.js';

/**
 * Parses an uploaded Excel buffer, uses AI to map the columns to the expected schema,
 * and appends the new medicines to the database.
 * @param {Buffer} fileBuffer - The buffer of the uploaded Excel file.
 * @returns {Promise<Object>} Object containing success status, message, and number of imported items.
 */
export const processExcelImport = async (fileBuffer) => {
  try {
    // 1. Read the Excel file from buffer
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to strict JSON array of objects
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawData || rawData.length === 0) {
      throw new Error("The uploaded Excel file is empty.");
    }

    // Extract headers from the first row object keys
    const headers = Object.keys(rawData[0]);

    // 2. Use AI to map the arbitrary Excel headers to our required Medicine schema keys
    // Required SCHEMA keys: name, pzn, price, description, unitType, stock, prescriptionRequired, lowStockThreshold
    
    const mappingPrompt = `
      You are a strict data-mapping assistant for a Pharmacy backend.
      Below is a list of column headers extracted from an uploaded Excel file.
      I need to map these headers correctly to my exact database schema fields.
      
      My Database Schema expects exactly these fields:
      - "name" (String, the name of the medicine)
      - "pzn" (String, unique product identifier / Pharma-Zentral-Nummer)
      - "price" (Number, the cost/price)
      - "description" (String, description of the medicine)
      - "unitType" (String, one of: "tablet", "strip", "bottle", "injection", "tube", "box", "capsule")
      - "stock" (Number, quantity currently in stock)
      - "prescriptionRequired" (Boolean, whether a prescription is needed)
      - "lowStockThreshold" (Number, alert threshold, default 10)

      Excel Headers provided:
      ${JSON.stringify(headers)}

      Return ONLY a valid JSON object where the keys are the exact Database Schema fields mentioned above, 
      and the values are the matching exact string names from the provided Excel Headers.
      If an exact Database field cannot be confidently mapped from the given Excel headers, set its value to null.
      Do not include any other text, markdown formatting (like \`\`\`json), or explanations. Just the JSON object.
    `;

    const aiResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini", // Fallback if env variable not set
        messages: [{ role: "system", content: mappingPrompt }],
        temperature: 0.1,
    });
    
    // Clean potential markdown from response
    let rawJsonContent = aiResponse.choices[0].message.content.trim();
    if (rawJsonContent.startsWith('```json')) {
        rawJsonContent = rawJsonContent.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (rawJsonContent.startsWith('```')) {
         rawJsonContent = rawJsonContent.replace(/```\n?/, '').replace(/```\n?$/, '');
    }

    const columnMapping = JSON.parse(rawJsonContent);
    logger.info(`[ExcelAgentService] Mapped columns: ${JSON.stringify(columnMapping)}`);

    // 3. Transform raw data to valid Schema objects
    const medicinesToInsert = [];
    
    for (const row of rawData) {
        // Skip completely empty rows
        if(Object.values(row).every(v => v === "" || v === null || v === undefined)) continue;

        let name = columnMapping.name ? row[columnMapping.name] : null;
        let pzn = columnMapping.pzn ? row[columnMapping.pzn] : null;
        
        let priceRaw = columnMapping.price ? row[columnMapping.price] : 0;
        let stockRaw = columnMapping.stock ? row[columnMapping.stock] : 0;
        
        let price = parseFloat(priceRaw);
        if(isNaN(price)) price = 0;
        
        let stock = parseInt(stockRaw, 10);
        if(isNaN(stock)) stock = 0;

        let description = columnMapping.description ? row[columnMapping.description] : "";
        let unitTypeRaw = columnMapping.unitType ? String(row[columnMapping.unitType]).toLowerCase().trim() : "tablet";
        
        // Ensure unitType is valid
        const validUnits = ["tablet", "strip", "bottle", "injection", "tube", "box", "capsule"];
        let unitType = validUnits.includes(unitTypeRaw) ? unitTypeRaw : "tablet";

        let prescReqRaw = columnMapping.prescriptionRequired ? row[columnMapping.prescriptionRequired] : false;
        let prescriptionRequired = false;
        if(typeof prescReqRaw === 'string') {
            const lower = prescReqRaw.toLowerCase();
            prescriptionRequired = (lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y');
        } else if (typeof prescReqRaw === 'boolean') {
             prescriptionRequired = prescReqRaw;
        }

        let lowStockRaw = columnMapping.lowStockThreshold ? row[columnMapping.lowStockThreshold] : 10;
        let lowStockThreshold = parseInt(lowStockRaw, 10);
        if(isNaN(lowStockThreshold)) lowStockThreshold = 10;
        
        // Basic validation: name and pzn must exist. If pzn is missing, try to generate a random one for import purposes
        if(!name) {
            logger.warn(`[ExcelAgentService] Skipping row due to missing name: ${JSON.stringify(row)}`);
            continue;
        }
        
        if(!pzn) {
           pzn = `IMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }

        medicinesToInsert.push({
            name: String(name).trim(),
            pzn: String(pzn).trim(),
            price,
            description: String(description).trim(),
            unitType,
            stock,
            prescriptionRequired,
            lowStockThreshold
        });
    }

    if (medicinesToInsert.length === 0) {
        throw new Error("No valid medicine records could be extracted from the provided file based on mapping.");
    }

    // 4. Bulk insert into DB (Ignore duplicates or update them based on PZN)
    // We'll use bulkWrite to strictly APPEND and skip duplicates based on PZN to avoid schema errors.
    const bulkOps = medicinesToInsert.map(med => ({
        updateOne: {
            filter: { pzn: med.pzn },
            update: { $set: med },
            upsert: true // Creates new doc if pzn not found, otherwise updates. (Append semantics)
        }
    }));

    const result = await Medicine.bulkWrite(bulkOps, { ordered: false });
    
    logger.info(`[ExcelAgentService] Import complete. Inserted/Updated ${result.upsertedCount + result.modifiedCount} records.`);

    return { 
        success: true, 
        message: `Successfully processed Excel. Appended/Updated ${result.upsertedCount + result.modifiedCount} medicines.`,
        mappedItems: medicinesToInsert.length,
        opsResult: result
    };

  } catch (error) {
    logger.error(`[ExcelAgentService] Error processing Excel file: ${error.message}`);
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
};


/**
 * Generates an Excel buffer for the Medicine Collection
 * @returns {Promise<Buffer>}
 */
export const generateMedicinesExcel = async () => {
    try {
        const medicines = await Medicine.find({}).lean();
        
        // Format for excel
        const data = medicines.map(med => ({
            "Medicine Name": med.name,
            "PZN/Identifier": med.pzn,
            "Price": med.price,
            "Stock": med.stock,
            "Unit Type": med.unitType,
            "Prescription Required": med.prescriptionRequired ? "Yes" : "No",
            "Low Stock Threshold": med.lowStockThreshold,
            "Description": med.description,
            "Added Date": med.createdAt ? med.createdAt.toISOString().split('T')[0] : ''
        }));

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Inventory");

        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return excelBuffer;
    } catch (error) {
        logger.error(`[ExcelAgentService] Error generating Medicine Excel: ${error.message}`);
        throw error;
    }
};

/**
 * Generates an Excel buffer for the Order Collection
 * @returns {Promise<Buffer>}
 */
export const generateOrdersExcel = async () => {
    try {
        const orders = await Order.find({}).populate('user', 'name email').lean();
        
        // Format for excel
        const data = orders.map(order => ({
            "Order ID": order._id.toString(),
            "Customer Name": order.user ? order.user.name : "Unknown",
            "Customer Email": order.user ? order.user.email : "Unknown",
            "Status": order.status,
            "Payment Status": order.paymentStatus,
            "Total Amount": order.totalAmount || 0,
            "Total Items": order.totalItems || order.items?.length || 0,
            "Order Date": order.createdAt ? order.createdAt.toISOString().split('T')[0] : '',
            "Prescription Included": order.prescription ? "Yes" : "No",
            "Age": order.age || "",
            "Gender": order.gender || "",
            "Rejection Reason": order.rejectionReason || "N/A"
        }));

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Orders");

        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return excelBuffer;
    } catch (error) {
        logger.error(`[ExcelAgentService] Error generating Order Excel: ${error.message}`);
        throw error;
    }
};
