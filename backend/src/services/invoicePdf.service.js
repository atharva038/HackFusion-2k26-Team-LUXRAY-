import PDFDocument from "pdfkit";

/**
 * Generate an invoice PDF as a Buffer.
 *
 * @param {object} params
 * @param {string} params.invoiceId       e.g. "INV-722332524"
 * @param {string} params.orderId         MongoDB order ID
 * @param {string} params.customerName    User's name
 * @param {string} params.customerEmail   User's email
 * @param {string} params.medicines       Comma-separated list of medicine names
 * @param {number} params.totalItems      Quantity
 * @param {number} params.totalAmount     Amount in ₹
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdf({
    invoiceId,
    orderId,
    customerName,
    customerEmail,
    medicines,
    totalItems,
    totalAmount,
}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const primaryColor = "#2563EB";   // blue
        const darkText = "#1E293B";
        const mutedText = "#64748B";
        const borderColor = "#E2E8F0";
        const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        // ── Header bar ──────────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);

        doc.fillColor("#FFFFFF")
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("MediAI Pharmacy", 50, 22);

        doc.fontSize(10)
            .font("Helvetica")
            .text("Your Trusted AI-Powered Pharmacy", 50, 50);

        // Invoice tag (top-right)
        doc.fontSize(13)
            .font("Helvetica-Bold")
            .text("INVOICE", doc.page.width - 120, 28, { align: "right", width: 70 });

        // ── Invoice & Customer info block ─────────────────────────────
        doc.fillColor(darkText).fontSize(11).font("Helvetica-Bold").text("Invoice Details", 50, 105);
        doc.moveTo(50, 120).lineTo(doc.page.width - 50, 120).lineWidth(1).strokeColor(borderColor).stroke();

        // Left column — invoice meta
        const col1x = 50, col2x = 320;
        let y = 130;

        const meta = [
            ["Invoice ID", invoiceId],
            ["Order ID", orderId],
            ["Date & Time", now],
            ["Status", "✅ Payment Confirmed"],
        ];

        meta.forEach(([label, value]) => {
            doc.fontSize(9).font("Helvetica-Bold").fillColor(mutedText).text(label, col1x, y);
            doc.fontSize(9).font("Helvetica").fillColor(darkText).text(value, col1x + 90, y);
            y += 18;
        });

        // Right column — customer
        let cy = 130;
        doc.fontSize(11).font("Helvetica-Bold").fillColor(darkText).text("Billed To", col2x, 105);
        doc.moveTo(col2x, 120).lineTo(doc.page.width - 50, 120).lineWidth(1).strokeColor(borderColor).stroke();

        doc.fontSize(9).font("Helvetica-Bold").fillColor(mutedText).text("Name", col2x, cy);
        doc.fontSize(9).font("Helvetica").fillColor(darkText).text(customerName || "—", col2x + 70, cy);
        cy += 18;

        doc.fontSize(9).font("Helvetica-Bold").fillColor(mutedText).text("Email", col2x, cy);
        doc.fontSize(9).font("Helvetica").fillColor(darkText).text(customerEmail || "—", col2x + 70, cy);

        // ── Items table header ────────────────────────────────────────
        const tableTop = 235;
        doc.rect(50, tableTop, doc.page.width - 100, 24).fill(primaryColor);
        doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
        doc.text("ITEM / MEDICINE", 60, tableTop + 7);
        doc.text("QTY", 360, tableTop + 7, { width: 50, align: "center" });
        doc.text("AMOUNT", 420, tableTop + 7, { width: 80, align: "right" });

        // ── Items table rows ──────────────────────────────────────────
        const medicineList = medicines.split(",").map(m => m.trim());
        let rowY = tableTop + 28;

        medicineList.forEach((med, i) => {
            const rowBg = i % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
            doc.rect(50, rowY - 4, doc.page.width - 100, 20).fill(rowBg);

            doc.fillColor(darkText).fontSize(9).font("Helvetica");
            doc.text(med, 60, rowY);
            doc.text(i === 0 ? String(totalItems) : "—", 360, rowY, { width: 50, align: "center" });
            doc.text(i === 0 ? `\u20B9${totalAmount}` : "—", 420, rowY, { width: 80, align: "right" });

            rowY += 22;
        });

        // ── Totals block ──────────────────────────────────────────────
        const totalsY = rowY + 12;
        doc.moveTo(50, totalsY - 6).lineTo(doc.page.width - 50, totalsY - 6).lineWidth(0.5).strokeColor(borderColor).stroke();

        doc.rect(340, totalsY, doc.page.width - 390, 28).fill(primaryColor);
        doc.fillColor("#FFFFFF").fontSize(12).font("Helvetica-Bold");
        doc.text("TOTAL PAID", 350, totalsY + 7, { width: 80 });
        doc.text(`\u20B9${totalAmount}`, 420, totalsY + 7, { width: 80, align: "right" });

        // ── Footer ────────────────────────────────────────────────────
        const footerY = doc.page.height - 70;
        doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).lineWidth(0.5).strokeColor(borderColor).stroke();
        doc.fillColor(mutedText).fontSize(8).font("Helvetica")
            .text(
                "This is a system-generated invoice. No signature required.\nMediAI Pharmacy — Powered by Agentic AI | HackFusion 2k26",
                50, footerY + 10,
                { align: "center", width: doc.page.width - 100 }
            );

        doc.end();
    });
}
