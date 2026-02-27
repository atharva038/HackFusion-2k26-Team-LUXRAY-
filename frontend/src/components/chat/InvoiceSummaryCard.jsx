import React from 'react';
import { motion } from 'framer-motion';
import { ReceiptCent, CheckCircle2, Download } from 'lucide-react';

import { downloadInvoicePdf } from '../../utils/generateInvoice';

/**
 * InvoiceSummaryCard
 * Displays a clean invoice view after payment succeeds
 */
const InvoiceSummaryCard = ({ invoiceId, orderId, amountPaid, items }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-black/8 dark:border-white/8 shadow-sm bg-card"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-green-500/10 border-b border-black/8 dark:border-white/8">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
                    <ReceiptCent className="w-4 h-4" />
                    Invoice Generated
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/25">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Paid
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-3">
                {invoiceId && (
                    <div className="flex items-start justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-2 mb-2">
                        <span className="text-[12px] font-medium text-text-muted shrink-0">Invoice No.</span>
                        <span className="font-mono text-[12px] font-semibold text-text text-right truncate pl-4">{invoiceId}</span>
                    </div>
                )}
                {orderId && (
                    <Row label="Order ID" value={<span className="font-mono">{orderId}</span>} />
                )}
                {items && (
                    <Row label="Items" value={items} />
                )}
                {amountPaid && (
                    <Row label="Amount Paid" value={amountPaid} bold />
                )}

                <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5">
                    <button
                        className="w-full py-2.5 flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-medium text-[13px] transition-colors"
                        onClick={() => downloadInvoicePdf({ invoiceId, orderId, amountPaid, items })}
                    >
                        <Download className="w-4 h-4" />
                        Download Receipt
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const Row = ({ label, value, bold }) => (
    <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] font-medium text-text-muted shrink-0 min-w-[64px]">{label}</span>
        <span className={`text-[13px] text-text text-right ${bold ? 'font-semibold text-[14px]' : ''}`}>{value}</span>
    </div>
);

export default InvoiceSummaryCard;
