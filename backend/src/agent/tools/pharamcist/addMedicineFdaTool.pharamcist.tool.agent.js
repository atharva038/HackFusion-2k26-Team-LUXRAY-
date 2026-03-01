import { tool, run, Agent } from "@openai/agents";
import { z } from "zod";
import Medicine from "../../../models/medicine.model.js";

/**
 * A sub-agent that analyzes FDA label warnings to determine if a prescription is required.
 */
const rxAnalyzerAgent = new Agent({
  name: "rx_analyzer",
  instructions:
    "You are a clinical pharmacist AI. When given a medicine name and its FDA label text (warnings, indications, usage), " +
    "determine if this medicine typically requires a doctor's prescription (Rx) to be dispensed safely, or if it is an over-the-counter (OTC) medication. " +
    "Look out for words like 'controlled', 'prescription only', 'Rx only', 'antibiotic', 'antidepressant', 'severe side effects' which strongly suggest a prescription is required. " +
    "If the label text is empty, use your general pharmacological knowledge for the given medicine name. " +
    "Respond ONLY with a valid JSON object in this exact shape, no markdown:\n" +
    '{"prescriptionRequired": true, "reason": "Short reason"}\n' +
    'or {"prescriptionRequired": false, "reason": "Short reason"}',
});

export const addMedicineFDATool = tool({
  name: "add_medicine_fda",
  description:
    "Add a new medicine to the inventory by automatically fetching its description, indications, and safety data from the OpenFDA API. " +
    "The AI will automatically determine whether the medication requires a prescription based on its pharmacological profile. " +
    "Use this when PZN is NOT provided or when FDA data is needed for description/Rx status. " +
    "Call this when the user asks to add a medicine without providing full manual details.",
  parameters: z.object({
    name: z.string().describe("The name of the medicine to add (e.g. 'Aspirin', 'Amoxicillin')"),
    price: z.number().min(0).describe("The cost/price of the medicine in ₹"),
    quantity: z.number().int().min(0).describe("The initial stock quantity to add"),
    pzn: z.string().optional().default("").describe("PZN code. Pass empty string '' if unknown — one will be auto-generated."),
    unitType: z
      .enum(["tablet", "strip", "bottle", "injection", "tube", "box", "capsule"])
      .default("tablet")
      .describe("The physical shape or packaging unit"),
  }),
  execute: async ({ name, price, quantity, pzn, unitType }) => {
    try {
      // 1. Check for duplicate BEFORE hitting the FDA API
      const existing = await Medicine.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (existing) {
        return `❌ Medicine "${name}" already exists in the database (PZN: ${existing.pzn}). Use add_stock to restock it instead.`;
      }

      // 2. Fetch data from OpenFDA API
      let fdaText = "";
      let description = "Description not available from FDA.";

      // Try brand name first, then generic name (first word)
      const searchTerms = [name.trim(), name.trim().split(" ")[0]].filter(Boolean);

      for (const term of searchTerms) {
        // OpenFDA correct query syntax: search field:value (no quotes needed for single words)
        const encodedTerm = encodeURIComponent(term);
        const fdaUrl = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:"${encodedTerm}"+openfda.generic_name:"${encodedTerm}")&limit=1`;

        try {
          const fdaResponse = await fetch(fdaUrl);
          if (!fdaResponse.ok) continue;

          const fdaData = await fdaResponse.json();
          const labelResult = fdaData?.results?.[0];

          if (labelResult) {
            // Build a rich description from available fields
            const indications = labelResult.indications_and_usage?.join(" ") ?? "";
            const desc = labelResult.description?.join(" ") ?? "";
            const purpose = labelResult.purpose?.join(" ") ?? "";

            description = (purpose || indications || desc || "No detailed description found in FDA label.").slice(0, 500);

            // Compile warning/safety text for Rx analysis
            const warningFields = [
              "warnings",
              "warnings_and_cautions",
              "contraindications",
              "stop_use",
              "do_not_use",
            ];

            fdaText = warningFields
              .flatMap((field) =>
                Array.isArray(labelResult[field])
                  ? labelResult[field]
                  : labelResult[field]
                  ? [labelResult[field]]
                  : []
              )
              .join(" ");

            fdaText += " " + description;
            break; // Found a result — stop searching
          }
        } catch (fetchErr) {
          // Silently ignore and try next search term
          console.warn(`FDA fetch failed for term "${term}":`, fetchErr.message);
        }
      }

      // 3. Use sub-agent AI to determine Rx requirement
      const prompt = `Medicine Name: "${name}"\n\nFDA Profile/Label Data:\n---\n${fdaText.slice(0, 3000)}\n---\n\nDetermine if this medicine requires a prescription.`;
      const result = await run(rxAnalyzerAgent, prompt);
      const raw = result.finalOutput ?? '{"prescriptionRequired":true,"reason":"Fallback strict mode — could not parse FDA data"}';

      let prescriptionRequired = true; // Default to safe/strict
      let rxReason = "Fallback strict mode";

      try {
        const parsed = JSON.parse(raw);
        prescriptionRequired = !!parsed.prescriptionRequired;
        rxReason = parsed.reason ?? rxReason;
      } catch (parseErr) {
        console.warn("FDA Rx Analyzer returned non-JSON, defaulting prescriptionRequired=true:", raw);
      }

      // 4. Generate PZN if not provided
      const finalPzn = pzn?.trim() || `FDA-${Date.now().toString().slice(-8)}`;

      // 5. Ensure generated PZN is also unique
      const pznConflict = await Medicine.findOne({ pzn: finalPzn });
      if (pznConflict) {
        // Very unlikely but handle it
        return `❌ PZN conflict: "${finalPzn}" is already in use. Please retry.`;
      }

      // 6. Save to database
      const newMed = new Medicine({
        name: name.trim(),
        pzn: finalPzn,
        price,
        stock: quantity,
        unitType,
        description,
        prescriptionRequired,
        lowStockThreshold: 10,
      });

      await newMed.save();

      return (
        `✅ Successfully added "${name}" using FDA data!\n\n` +
        `Description: ${description.slice(0, 120)}...\n` +
        `Rx Required: ${prescriptionRequired ? "Yes" : "No"} (${rxReason})\n` +
        `Stock: ${quantity} ${unitType}(s)\n` +
        `Price: ₹${price}\n` +
        `PZN: ${finalPzn}\n` +
        `ID: ${newMed._id}`
      );
    } catch (error) {
      console.error("addMedicineFDATool error:", error);
      return `❌ Failed to add medicine via FDA: ${error.message}`;
    }
  },
});