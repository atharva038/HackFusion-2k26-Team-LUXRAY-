import React from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, Clock, XCircle, Truck, FileText } from 'lucide-react';

const STATUS_CONFIG = {
    approved: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        cls: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25',
    },
    pending: {
        icon: <Clock className="w-4 h-4" />,
        cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
    },
    rejected: {
        icon: <XCircle className="w-4 h-4" />,
        cls: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
    },
    dispatched: {
        icon: <Truck className="w-4 h-4" />,
        cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25',
    },
    awaiting_prescription: {
        icon: <FileText className="w-4 h-4" />,
        cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25',
    },
};

/**
 * OrderSummaryCard — rich card for single-order summaries.
 * Props: { orderId, status, items, total, customer }
 */
const OrderSummaryCard = ({ orderId, status, items, total, customer }) => {
    const norm = status?.toLowerCase()?.replace(/ /g, '_') || 'pending';
    const cfg = STATUS_CONFIG[norm] || STATUS_CONFIG.pending;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 180, delay: 0.1 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-black/8 dark:border-white/8 shadow-sm bg-card"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary/8 border-b border-black/8 dark:border-white/8">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Package className="w-4 h-4" />
                    Order Summary
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${cfg.cls}`}>
                    {cfg.icon}
                    {norm.replace(/_/g, ' ')}
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-3">
                {customer && (
                    <Row label="Customer" value={customer} />
                )}
                {orderId && (
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-[12px] font-medium text-text-muted shrink-0">Order ID</span>
                        <span className="font-mono text-[11px] text-text-muted text-right break-all">{orderId}</span>
                    </div>
                )}
                {items && (
                    <Row label="Items" value={items} />
                )}
                {total && (
                    <Row label="Total" value={total} bold />
                )}
            </div>
        </motion.div>
    );
};

const Row = ({ label, value, bold }) => (
    <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] font-medium text-text-muted shrink-0 min-w-[64px]">{label}</span>
        <span className={`text-[13px] text-text text-right ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
);

export default OrderSummaryCard;
