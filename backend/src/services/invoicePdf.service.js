import PDFDocument from "pdfkit";

/**
 * Helper: render text at an absolute (x, y) position without triggering
 * PDFKit's automatic page-break logic when going "backward" in y.
 * Always resets doc.y to `y` before rendering, then to `y + advance` after.
 */
function cellText(doc, text, x, y, width, opts = {}) {
    doc.y = y;
    doc.text(text, x, y, { width, lineBreak: false, ...opts });
}

/**
 * Render a full table row (multiple cells side-by-side) at a fixed y.
 * Prevents multi-page blowout caused by PDFKit's backward-y detection.
 *
 * @param {PDFDocument} doc
 * @param {number}      rowY    Top of the row
 * @param {number}      rowH    Row height (pixels)
 * @param {Array}       cells   [{x, width, text, opts}]
 */
function drawRowCells(doc, rowY, rowH, cells) {
    for (const { x, width, text, opts = {} } of cells) {
        doc.y = rowY;
        doc.text(text, x, rowY + opts._yPad || rowY, {
            width,
            lineBreak: false,
            ...opts,
        });
    }
    doc.y = rowY + rowH;
}

/**
 * Generate a professional invoice PDF as a Buffer.
 *
 * @param {object}   params
 * @param {string}   params.invoiceId      e.g. "INV-722332524"
 * @param {string}   params.orderId        MongoDB order ID
 * @param {string}   params.customerName   User's name
 * @param {string}   params.customerEmail  User's email
 * @param {Array}    params.items          [{name, dosage, quantity, unitPrice, totalPrice}]
 * @param {number}   params.totalAmount    Grand total in Rs.
 * @param {string}   [params.medicines]    Fallback: comma-separated names (legacy)
 * @param {number}   [params.totalItems]   Fallback: total qty (legacy)
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdf({
    invoiceId,
    orderId,
    customerName,
    customerEmail,
    items,
    totalAmount,
    // Legacy fallback params (when items array is not provided)
    medicines,
    totalItems,
}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const W  = doc.page.width;   // 595.28
        const H  = doc.page.height;  // 841.89
        const L  = 50;
        const R  = W - 50;
        const CW = R - L;            // 495.28

        const now = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });

        // ── Normalise items ──────────────────────────────────────────────────
        // Accept either a structured array or fall back to legacy comma string
        let rowItems = [];
        if (Array.isArray(items) && items.length > 0) {
            rowItems = items.map(it => ({
                name:       it.name      || "Medicine",
                dosage:     it.dosage    || "—",
                quantity:   it.quantity  || 1,
                unitPrice:  it.unitPrice || 0,
                totalPrice: it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1),
            }));
        } else if (medicines) {
            rowItems = medicines.split(",").map(m => ({
                name: m.trim(), dosage: "—", quantity: "—", unitPrice: "—", totalPrice: "—",
            }));
        }

        const grandTotal = Number(totalAmount) || rowItems.reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);

        // ── Company Header ───────────────────────────────────────────────────
        doc.font("Helvetica-Bold").fontSize(20).fillColor("#000000")
            .text("MEDIAI PHARMACY", L, 50);
        doc.font("Helvetica").fontSize(8.5).fillColor("#777777")
            .text("Your Trusted AI-Powered Pharmacy", L, 74);
        doc.font("Helvetica-Bold").fontSize(18).fillColor("#000000")
            .text("TAX INVOICE", L, 50, { align: "right", width: CW });

        // Thick separator
        doc.rect(L, 92, CW, 1.5).fill("#000000");

        // ── Invoice Meta & Billed To ─────────────────────────────────────────
        const midX = L + Math.floor(CW / 2) + 10;
        let y = 108;

        const metaRows = [
            ["INVOICE NO.",    invoiceId],
            ["DATE & TIME",    now],
            ["ORDER ID",       orderId],
            ["PAYMENT STATUS", "Confirmed"],
        ];

        metaRows.forEach(([label, value], i) => {
            const ry = y + i * 17;
            doc.y = ry;
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#888888").text(label, L, ry);
            doc.y = ry;
            doc.font("Helvetica").fontSize(8.5).fillColor("#000000")
                .text(value || "—", L + 100, ry, { width: midX - L - 105, lineBreak: false });
        });

        // Billed To (right column)
        doc.y = y;
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#000000").text("BILLED TO", midX, y);

        const billRows = [["NAME", customerName || "—"], ["EMAIL", customerEmail || "—"]];
        billRows.forEach(([label, value], i) => {
            const ry = y + 17 + i * 17;
            doc.y = ry;
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#888888").text(label, midX, ry);
            doc.y = ry;
            doc.font("Helvetica").fontSize(8.5).fillColor("#000000")
                .text(value, midX + 48, ry, { width: R - midX - 48, lineBreak: false });
        });

        // ── Divider ──────────────────────────────────────────────────────────
        const divY = 185;
        doc.moveTo(L, divY).lineTo(R, divY).lineWidth(0.5).strokeColor("#BBBBBB").stroke();

        // ── Section label ────────────────────────────────────────────────────
        y = divY + 14;
        doc.y = y;
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#000000").text("ORDER ITEMS", L, y);
        y += 14;

        // ── Table column config ──────────────────────────────────────────────
        //  Description | Dosage | Qty | Unit Price | Total
        //  195          80       40    90            90       = 495
        const c1 = L,       c1w = 195;
        const c2 = L + 195, c2w = 80;
        const c3 = L + 275, c3w = 40;
        const c4 = L + 315, c4w = 90;
        const c5 = L + 405, c5w = 90;

        // ── Table header ─────────────────────────────────────────────────────
        const hh = 22;
        doc.rect(c1, y, CW, hh).fillAndStroke("#EEEEEE", "#AAAAAA");
        // Vertical dividers
        for (const cx of [c2, c3, c4, c5]) {
            doc.moveTo(cx, y).lineTo(cx, y + hh).lineWidth(0.5).strokeColor("#AAAAAA").stroke();
        }
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#333333");
        const hy = y + 6;
        cellText(doc, "MEDICINE / DESCRIPTION", c1 + 6, hy, c1w - 8);
        cellText(doc, "DOSAGE",      c2 + 4, hy, c2w - 6);
        cellText(doc, "QTY",         c3,     hy, c3w, { align: "center" });
        cellText(doc, "UNIT PRICE",  c4,     hy, c4w - 6, { align: "right" });
        cellText(doc, "TOTAL",       c5,     hy, c5w - 6, { align: "right" });
        doc.y = y + hh;
        y += hh;

        // ── Medicine rows ────────────────────────────────────────────────────
        const rh = 20;
        rowItems.forEach((item) => {
            // Row outer border
            doc.rect(c1, y, CW, rh).lineWidth(0.5).strokeColor("#CCCCCC").stroke();
            for (const cx of [c2, c3, c4, c5]) {
                doc.moveTo(cx, y).lineTo(cx, y + rh).lineWidth(0.5).strokeColor("#CCCCCC").stroke();
            }

            doc.font("Helvetica").fontSize(8.5).fillColor("#222222");
            const ry = y + 5;
            const fmtPrice = (v) => typeof v === "number" ? `Rs. ${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : String(v);

            cellText(doc, String(item.name),                        c1 + 6, ry, c1w - 12, { ellipsis: true });
            cellText(doc, String(item.dosage),                      c2 + 4, ry, c2w - 8);
            cellText(doc, String(item.quantity),                    c3,     ry, c3w,      { align: "center" });
            cellText(doc, fmtPrice(item.unitPrice),                 c4,     ry, c4w - 6,  { align: "right" });
            cellText(doc, fmtPrice(item.totalPrice),                c5,     ry, c5w - 6,  { align: "right" });

            doc.y = y + rh;
            y += rh;
        });

        // ── Summary row ──────────────────────────────────────────────────────
        const srh = 18;
        doc.rect(c1, y, CW, srh).lineWidth(0.5).strokeColor("#CCCCCC").stroke();
        doc.y = y + 5;
        doc.font("Helvetica").fontSize(7.5).fillColor("#666666")
            .text(`${rowItems.length} item(s) — Total Qty: ${typeof totalItems === "number" ? totalItems : rowItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)}`, c1 + 6, y + 5, { width: CW - 12, lineBreak: false });
        doc.y = y + srh;
        y += srh;

        // ── Total row ────────────────────────────────────────────────────────
        const th = 26;
        doc.rect(c1, y, CW, th).fillAndStroke("#EEEEEE", "#AAAAAA");
        doc.moveTo(c5, y).lineTo(c5, y + th).lineWidth(0.5).strokeColor("#AAAAAA").stroke();

        doc.font("Helvetica-Bold").fontSize(10).fillColor("#000000");
        const ty = y + 8;
        cellText(doc, "TOTAL AMOUNT PAID", c1 + 6, ty, c1w + c2w + c3w + c4w - 12);
        cellText(doc, `Rs. ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, c5, ty, c5w - 6, { align: "right" });
        doc.y = y + th;
        y += th + 18;

        // ── Payment note ─────────────────────────────────────────────────────
        doc.rect(c1, y, CW, 26).fillAndStroke("#F9F9F9", "#DDDDDD");
        doc.y = y + 9;
        doc.font("Helvetica").fontSize(8).fillColor("#666666")
            .text("Payment received via Razorpay. This invoice serves as official proof of purchase.", c1 + 10, y + 9, { width: CW - 20, align: "center", lineBreak: false });
        doc.y = y + 26;

        // ── Footer ──────────────────────────────────────────────────────────
        // Positioned safely within the page content area (margin bottom = 50 → max y = 791)
        const footerLine = 755;
        doc.rect(L, footerLine, CW, 0.5).fill("#BBBBBB");

        doc.y = footerLine + 8;
        doc.font("Helvetica").fontSize(7.5).fillColor("#999999")
            .text("This is a computer-generated invoice and does not require a signature.",
                L, footerLine + 8,
                { align: "center", width: CW, lineBreak: false });

        doc.y = footerLine + 20;
        doc.font("Helvetica").fontSize(7.5).fillColor("#999999")
            .text("MediAI Pharmacy — Powered by Agentic AI  |  HackFusion 2k26",
                L, footerLine + 20,
                { align: "center", width: CW, lineBreak: false });

        doc.end();
    });
}
