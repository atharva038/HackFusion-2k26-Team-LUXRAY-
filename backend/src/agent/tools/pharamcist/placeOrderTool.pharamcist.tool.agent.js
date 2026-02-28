import { tool } from "@openai/agents";
import Medicine from "../../../models/medicine.model.js";
import User from "../../../models/user.model.js";
import Order from "../../../models/order.model.js";
import { z } from "zod";

export const placeOrderTool = tool({
  name: "place_order",
  description:
    "Place a new medicine order on behalf of a customer. " +
    "Looks up each medicine by name or PZN, verifies stock, calculates totals, " +
    "and creates the order in the database with status 'approved'. " +
    "Use this when the pharmacist wants to create an order directly for a patient.",

  parameters: z.object({
    customerIdentifier: z
      .string()
      .describe(
        "The customer's name, email, or MongoDB user ID. Used to find the customer account."
      ),
    items: z
      .array(
        z.object({
          medicineName: z
            .string()
            .nullable()
            .default(null)
            .describe("Medicine name (partial match ok). Pass null if using pzn."),
          pzn: z
            .string()
            .nullable()
            .default(null)
            .describe("PZN code of the medicine. Pass null if using medicineName."),
          quantity: z.number().int().positive().describe("Number of units to order"),
          dosage: z
            .string()
            .nullable()
            .default(null)
            .describe("Optional dosage instructions, e.g. '1 tablet twice daily'"),
        })
      )
      .min(1)
      .describe("List of medicines to order"),
    prescription: z
      .boolean()
      .default(false)
      .describe("Whether a prescription is required/attached for this order"),
    pharmacistId: z
      .string()
      .nullable()
      .default(null)
      .describe("MongoDB ID of the pharmacist approving this order (approvedBy field)"),
  }),

  execute: async ({ customerIdentifier, items, prescription, pharmacistId }) => {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // ── 1. Find customer ────────────────────────────────────────────────
    let customer;
    const mongoose = (await import("mongoose")).default;
    if (mongoose.Types.ObjectId.isValid(customerIdentifier)) {
      customer = await User.findById(customerIdentifier).lean();
    }
    if (!customer) {
      customer = await User.findOne({ email: customerIdentifier.toLowerCase().trim() }).lean();
    }
    if (!customer) {
      customer = await User.findOne({
        name: { $regex: new RegExp(escapeRegex(customerIdentifier.trim()), "i") },
      }).lean();
    }
    if (!customer) {
      return `Customer not found for identifier "${customerIdentifier}". Provide the correct name, email, or user ID.`;
    }

    // ── 2. Resolve each item ────────────────────────────────────────────
    const resolvedItems = [];
    const errors = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item.medicineName && !item.pzn) {
        errors.push(`One item is missing both medicineName and pzn. Skipping.`);
        continue;
      }

      let medicine;
      if (item.pzn) {
        const cleanPzn = item.pzn.trim().replace(/^pzn[-\s]*/i, "");
        medicine = await Medicine.findOne({ pzn: cleanPzn });
      } else {
        medicine = await Medicine.findOne({
          name: { $regex: new RegExp(escapeRegex(item.medicineName.trim()), "i") },
        });
      }

      if (!medicine) {
        errors.push(`Medicine not found: "${item.medicineName || item.pzn}". Skipping.`);
        continue;
      }

      if ((medicine.stock || 0) < item.quantity) {
        errors.push(
          `Insufficient stock for "${medicine.name}": ` +
            `requested ${item.quantity}, available ${medicine.stock}. Skipping.`
        );
        continue;
      }

      resolvedItems.push({
        medicine: medicine._id,
        quantity: item.quantity,
        dosage: item.dosage || "",
        _name: medicine.name,
        _price: medicine.price,
      });

      totalAmount += medicine.price * item.quantity;
    }

    if (resolvedItems.length === 0) {
      return (
        `Could not place order — no valid items resolved.\n` +
        (errors.length ? `Issues:\n${errors.map((e) => `• ${e}`).join("\n")}` : "")
      );
    }

    // ── 3. Deduct stock ─────────────────────────────────────────────────
    for (const ri of resolvedItems) {
      await Medicine.findByIdAndUpdate(ri.medicine, { $inc: { stock: -ri.quantity } });
    }

    // ── 4. Create order ─────────────────────────────────────────────────
    const orderItems = resolvedItems.map(({ medicine, quantity, dosage }) => ({
      medicine,
      quantity,
      dosage,
    }));

    const order = await Order.create({
      user: customer._id,
      age: customer.age,
      gender: customer.gender || "male",
      prescription,
      prescriptionProof: "",
      items: orderItems,
      status: "approved",
      totalItems: resolvedItems.reduce((s, r) => s + r.quantity, 0),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      approvedBy: pharmacistId || undefined,
    });

    // ── 5. Build summary ────────────────────────────────────────────────
    const itemSummary = resolvedItems
      .map((r) => `  • ${r._name} × ${r.quantity} @ ₹${r._price} = ₹${(r._price * r.quantity).toFixed(2)}`)
      .join("\n");

    let response =
      `✅ Order placed successfully!\n` +
      `Order ID: ${order._id}\n` +
      `Customer: ${customer.name} (${customer.email})\n` +
      `Status: approved\n` +
      `Items:\n${itemSummary}\n` +
      `Total Amount: ₹${totalAmount.toFixed(2)}\n` +
      `Total Units: ${order.totalItems}`;

    if (errors.length) {
      response += `\n\n⚠️ Some items were skipped:\n${errors.map((e) => `• ${e}`).join("\n")}`;
    }

    return response;
  },
});
