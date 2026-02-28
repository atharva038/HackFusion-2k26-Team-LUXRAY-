import Order from "../models/order.model.js";
import { generateInvoicePdf } from "../services/invoicePdf.service.js";

/**
 * GET /api/invoice/:invoiceId
 *
 * Fetches the order by invoiceId, generates a professional PDF on-the-fly
 * using the same service as the email attachment, and streams it as a download.
 *
 * Auth: requires a valid JWT (protect middleware).
 * The invoice must belong to the requesting user (or the user must be admin/pharmacist).
 */
export const downloadInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        if (!invoiceId) {
            return res.status(400).json({ error: "Invoice ID is required." });
        }

        // Find the order and populate medicine details (needed for per-item prices)
        const order = await Order.findOne({ invoiceId })
            .populate("items.medicine", "name price unitType")
            .populate("user", "name email");

        if (!order) {
            return res.status(404).json({ error: "Invoice not found." });
        }

        // Only the order owner, admins, or pharmacists may download
        const requesterId = req.user?.id || req.user?._id;
        const ownerId = order.user?._id?.toString();
        const role = req.user?.role;

        if (role !== "admin" && role !== "pharmacist" && requesterId !== ownerId) {
            return res.status(403).json({ error: "You do not have permission to download this invoice." });
        }

        // Build structured items array (same shape as payment controller)
        const invoiceItems = (order.items || []).map(item => ({
            name:       item.medicine?.name  || "Medicine",
            dosage:     item.dosage           || "—",
            quantity:   item.quantity         || 1,
            unitPrice:  item.medicine?.price  || 0,
            totalPrice: (item.medicine?.price || 0) * (item.quantity || 1),
        }));

        const pdfBuffer = await generateInvoicePdf({
            invoiceId: order.invoiceId,
            orderId:   order._id.toString(),
            customerName:  order.user?.name  || "Customer",
            customerEmail: order.user?.email || "",
            items:       invoiceItems,
            totalAmount: order.totalAmount || 0,
            totalItems:  order.totalItems  || invoiceItems.reduce((s, i) => s + i.quantity, 0),
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoiceId}.pdf"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (err) {
        console.error("[Invoice Download] Error:", err.message);
        res.status(500).json({ error: "Failed to generate invoice." });
    }
};
