import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

const STATUS_STYLES = {
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    approved: 'bg-green-500/15 text-green-700 dark:text-green-400',
    rejected: 'bg-red-500/15 text-red-700 dark:text-red-400',
    dispatched: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    awaiting_prescription: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
};

const StatusBadge = ({ value }) => {
    const style = STATUS_STYLES[value?.toLowerCase()] || 'bg-black/10 dark:bg-white/10 text-text-muted';
    const label = value?.replace(/_/g, ' ') || '—';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${style}`}>
            {label}
        </span>
    );
};

const isStatusCol = (col) => col === 'status';
const isIdCol = (col) => col === 'orderId' || col === 'id';

/**
 * DataTable — desktop-optimised premium table
 * Props: { columns, columnLabels, items }
 */
const DataTable = ({ columns, columnLabels, items }) => {
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const toggleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    const sorted = sortCol
        ? [...items].sort((a, b) => {
            const av = String(a[sortCol] || '');
            const bv = String(b[sortCol] || '');
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        })
        : items;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full overflow-x-auto rounded-2xl border border-black/8 dark:border-white/8 shadow-sm"
        >
            <table className="w-full text-sm border-collapse">
                {/* Header */}
                <thead>
                    <tr className="bg-primary/8 dark:bg-primary/12">
                        {columns.map((col) => (
                            <th
                                key={col}
                                onClick={() => col !== '#' && toggleSort(col)}
                                className={`
                  px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide
                  whitespace-nowrap select-none
                  ${col !== '#' ? 'cursor-pointer hover:text-primary transition-colors' : ''}
                `}
                            >
                                <span className="inline-flex items-center gap-1">
                                    {columnLabels?.[col] || col}
                                    {col !== '#' && sortCol === col && (
                                        sortDir === 'asc'
                                            ? <ChevronUp className="w-3 h-3 text-primary" />
                                            : <ChevronDown className="w-3 h-3 text-primary" />
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    {sorted.map((row, rowIdx) => (
                        <motion.tr
                            key={rowIdx}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: rowIdx * 0.04, duration: 0.25 }}
                            className={`
                border-t border-black/5 dark:border-white/5
                hover:bg-primary/5 transition-colors duration-150
                ${rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.025] dark:bg-white/[0.025]'}
              `}
                        >
                            {columns.map((col) => (
                                <td key={col} className="px-4 py-3 text-text leading-snug">
                                    {isStatusCol(col) ? (
                                        <StatusBadge value={row[col]} />
                                    ) : isIdCol(col) ? (
                                        <span className="font-mono text-xs text-text-muted">{row[col] || '—'}</span>
                                    ) : (
                                        <span>{row[col] || '—'}</span>
                                    )}
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>

            {/* Footer count */}
            <div className="px-4 py-2 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] text-text-muted">
                {sorted.length} result{sorted.length !== 1 ? 's' : ''}
            </div>
        </motion.div>
    );
};

export default DataTable;
