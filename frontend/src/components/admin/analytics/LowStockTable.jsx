import React from 'react';
import { AlertTriangle } from 'lucide-react';

const LowStockTable = ({ data = [] }) => {
    return (
        <div className="bg-glass border border-black/5 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between pb-6">
                <div>
                    <h2 className="font-semibold text-text flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Low Stock Alerts
                    </h2>
                    <p className="text-xs text-text-muted mt-1">Items requiring immediate restock.</p>
                </div>
                {data.length > 0 && (
                    <button className="text-sm text-primary hover:underline font-medium">Reorder All</button>
                )}
            </div>

            <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Medicine</th>
                            <th className="px-6 py-4 font-semibold">Current Stock</th>
                            <th className="px-6 py-4 font-semibold">Min Threshold</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/10">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-text">{item.name}</div>
                                    <div className="text-xs text-text-muted font-mono mt-0.5">{item.displayId || item.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold ${item.status === 'Critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {item.stock}
                                    </span> units
                                </td>
                                <td className="px-6 py-4 text-text-muted">{item.minRequired} units</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'Critical'
                                        ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && (
                <div className="p-8 text-center text-text-muted text-sm flex-grow flex items-center justify-center bg-transparent">
                    All inventory levels are healthy.
                </div>
            )}
        </div>
    );
};

export default LowStockTable;
