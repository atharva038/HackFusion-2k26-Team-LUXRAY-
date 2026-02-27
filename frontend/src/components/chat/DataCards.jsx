import React from 'react';
import { motion } from 'framer-motion';

const STATUS_STYLES = {
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    approved: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
    rejected: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
    dispatched: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
    awaiting_prescription: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

const StatusBadge = ({ value }) => {
    const style = STATUS_STYLES[value?.toLowerCase()] || 'bg-black/10 dark:bg-white/10 text-text-muted border-black/10';
    const label = value?.replace(/_/g, ' ') || '—';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${style}`}>
            {label}
        </span>
    );
};

const HIDDEN_COLS = new Set(['#']);
const isStatusCol = (col) => col === 'status';
const isIdCol = (col) => col === 'orderId' || col === 'id';

/**
 * DataCards — mobile-optimised stacked card list
 * Props: { columns, columnLabels, items }
 */
const DataCards = ({ columns, columnLabels, items }) => {
    const visibleCols = columns.filter(c => !HIDDEN_COLS.has(c));

    return (
        <div className="flex flex-col gap-3 w-full">
            {items.map((item, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.06, duration: 0.3, ease: 'easeOut' }}
                    className="bg-card border border-black/8 dark:border-white/8 rounded-2xl px-4 py-4 shadow-sm"
                >
                    {/* Card number pill */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-semibold text-text-muted bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                            #{item['#'] || idx + 1}
                        </span>
                        {/* Status badge in top-right if present */}
                        {item.status && (
                            <StatusBadge value={item.status} />
                        )}
                    </div>

                    {/* Field rows */}
                    <div className="space-y-2">
                        {visibleCols.map((col) => {
                            if (col === 'status') return null; // Already shown as badge
                            const val = item[col];
                            if (!val) return null;
                            return (
                                <div key={col} className="flex items-start justify-between gap-3">
                                    <span className="text-[12px] font-medium text-text-muted shrink-0 min-w-[72px]">
                                        {columnLabels?.[col] || col}
                                    </span>
                                    {isIdCol(col) ? (
                                        <span className="font-mono text-[11px] text-text-muted break-all text-right">{val}</span>
                                    ) : (
                                        <span className="text-[13px] text-text text-right">{val}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default DataCards;
