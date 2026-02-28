/**
 * parseStructuredOutput.js
 *
 * Detects known list/summary patterns in AI response text and converts
 * them into structured data objects for rich UI rendering.
 *
 * Returns null if no pattern is found (-> plain text rendering).
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_NORM = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    dispatched: 'dispatched',
    awaiting_prescription: 'awaiting_prescription',
    'awaiting prescription': 'awaiting_prescription',
};

const normalizeStatus = (s = '') => STATUS_NORM[s.toLowerCase().trim()] || s.toLowerCase().trim();

/**
 * Split text into non-empty lines, trimming whitespace.
 */
const lines = (text) => text.split('\n').map(l => l.trim()).filter(Boolean);

/**
 * Extract numbered lines only (lines starting with "1.", "2.", etc.)
 */
const numberedLines = (text) => lines(text).filter(l => /^\d+\./.test(l));

// ─── Detectors ──────────────────────────────────────────────────────────────

/**
 * Detect order list pattern.
 * Matches lines like:
 *   "1. OrderId: 69a0564c1ba942de03a0847f | Customer: Michael | Items: Paracetamol x4 | Status: pending | Date: 2/26/2026"
 */
function detectOrderList(text) {
    const nLines = numberedLines(text);
    const orderLines = nLines.filter(l =>
        /orderid:/i.test(l) && /customer:/i.test(l)
    );

    if (orderLines.length < 1) return null;

    const items = orderLines.map((line, index) => {
        const get = (key) => {
            const m = line.match(new RegExp(`${key}:\\s*([^|\\n]+)`, 'i'));
            return m ? m[1].trim() : '';
        };
        return {
            '#': index + 1,
            orderId: get('orderid'),
            customer: get('customer'),
            items: get('items'),
            status: normalizeStatus(get('status')),
            date: get('date'),
        };
    });

    return {
        type: 'order_list',
        title: 'Orders',
        columns: ['#', 'orderId', 'customer', 'items', 'status', 'date'],
        columnLabels: { '#': '#', orderId: 'Order ID', customer: 'Customer', items: 'Items', status: 'Status', date: 'Date' },
        items,
    };
}

/**
 * Detect medicine / inventory list pattern.
 * Matches lines like:
 *   "1. Paracetamol 500mg | Stock: 20 | Price: €2.50"
 *   "1. Name: Amlodipine | Dosage: 5mg | Stock: 15"
 */
function detectMedicineList(text) {
    const nLines = numberedLines(text);
    const medLines = nLines.filter(l =>
        /stock:|dosage:|mg\b|price:|tablet|capsule/i.test(l)
    );

    if (medLines.length < 2) return null;

    const items = medLines.map((line, index) => {
        // Try structured "Key: value" format first
        const get = (key) => {
            const m = line.match(new RegExp(`${key}:\\s*([^|\\n,]+)`, 'i'));
            return m ? m[1].trim() : '';
        };

        // Fallback: split by "|" and take first segment as name
        const parts = line.replace(/^\d+\.\s*/, '').split('|').map(s => s.trim());
        const nameRaw = get('name') || parts[0] || '';

        return {
            '#': index + 1,
            name: nameRaw,
            dosage: get('dosage') || '',
            stock: get('stock') || get('qty') || get('quantity') || '',
            price: get('price') || '',
            prescriptionRequired: /prescription required|rx required/i.test(line) ? 'Yes' : '',
        };
    });

    // Remove empty-value columns
    const usedCols = ['#', 'name', 'dosage', 'stock', 'price', 'prescriptionRequired'].filter(
        col => col === '#' || col === 'name' || items.some(item => item[col])
    );

    return {
        type: 'medicine_list',
        title: 'Medicines',
        columns: usedCols,
        columnLabels: {
            '#': '#', name: 'Medicine', dosage: 'Dosage',
            stock: 'Stock', price: 'Price', prescriptionRequired: 'Rx Required',
        },
        items,
    };
}

/**
 * Detect a single-order summary block.
 * Matches patterns like:
 *   "Order ID: ... / Items: ... / Status: ... / Total: ..."
 */
function detectOrderSummary(text) {
    const hasOrderId = /order id[:\s]/i.test(text) || /orderid[:\s]/i.test(text);
    const hasStatus = /status[:\s]/i.test(text);
    const hasItems = /items?[:\s]/i.test(text);

    // Must be a summary block, not a list (no multiple numbered lines with orderId)
    const nOrderLines = numberedLines(text).filter(l => /orderid:/i.test(l));
    if (!hasOrderId || !hasStatus || !hasItems || nOrderLines.length > 1) return null;

    const get = (key) => {
        const m = text.match(new RegExp(`${key}[:\\s]+([^\\n|,]+)`, 'i'));
        return m ? m[1].trim() : '';
    };

    const orderId = get('order id') || get('orderid');
    const status = normalizeStatus(get('status'));
    const items = get('items');
    const total = get('total') || get('amount');
    const customer = get('customer');

    // Extracted razorpay fields if provided by agent 
    const razorpayOrderId = get('razorpay id') || get('razorpayorderid') || get('payment id');

    if (!orderId) return null;

    return {
        type: 'order_summary',
        title: 'Order Summary',
        orderId,
        status,
        items,
        total,
        customer,
        razorpayOrderId,
        amount: total ? parseFloat(total.replace(/[^0-9.]/g, '')) : 0
    };
}

/**
 * Detect refill alert list.
 * Matches lines containing refill/reminder + medicine name.
 */
function detectRefillList(text) {
    const nLines = numberedLines(text);
    const refillLines = nLines.filter(l =>
        /refill|reminder|due|schedule/i.test(l)
    );

    if (refillLines.length < 2) return null;

    const items = refillLines.map((line, index) => {
        const get = (key) => {
            const m = line.match(new RegExp(`${key}:\\s*([^|\\n]+)`, 'i'));
            return m ? m[1].trim() : '';
        };
        const clean = line.replace(/^\d+\.\s*/, '');
        return {
            '#': index + 1,
            medicine: get('medicine') || get('name') || clean.split('|')[0].trim(),
            due: get('due') || get('date') || get('next') || '',
            status: get('status') || '',
        };
    });

    return {
        type: 'refill_list',
        title: 'Refill Alerts',
        columns: ['#', 'medicine', 'due', 'status'],
        columnLabels: { '#': '#', medicine: 'Medicine', due: 'Due Date', status: 'Status' },
        items,
    };
}

/**
 * Detect an invoice summary block.
 * Matches patterns from the webhook injection like:
 *   "Invoice ID: ... / Amount Paid: ... / Order ID: ..."
 */
function detectInvoiceSummary(text) {
    const hasInvoiceId = /invoice id[:\s]/i.test(text);
    const hasAmountPaid = /amount paid[:\s]/i.test(text);
    const hasOrderId = /order id[:\s]/i.test(text) || /orderid[:\s]/i.test(text);

    if (!hasInvoiceId || !hasAmountPaid || !hasOrderId) return null;

    const get = (key) => {
        const m = text.match(new RegExp(`${key}[:\\s]+([^\\n|,]+)`, 'i'));
        return m ? m[1].trim() : '';
    };

    const invoiceId = get('invoice id');
    const orderId = get('order id') || get('orderid');
    const amountPaid = get('amount paid');
    const items = get('items');

    return {
        type: 'invoice_summary',
        title: 'Invoice',
        invoiceId,
        orderId,
        amountPaid,
        items
    };
}

// ─── Main exported parser ────────────────────────────────────────────────────

/**
 * parseStructuredOutput(text: string) → structured | null
 *
 * Try detectors in priority order.
 * Returns the first match, or null if nothing detected.
 */
export function parseStructuredOutput(text) {
    if (!text || typeof text !== 'string') return null;

    return (
        detectInvoiceSummary(text) ||
        detectOrderList(text) ||
        detectOrderSummary(text) ||
        detectMedicineList(text) ||
        detectRefillList(text) ||
        null
    );
}
