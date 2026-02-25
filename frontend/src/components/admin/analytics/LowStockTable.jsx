import React from 'react';
import { AlertTriangle } from 'lucide-react';

const mockLowStock = [
    { id: 'MED-089', name: 'Amoxicillin 500mg', stock: 30, minRequired: 40, status: 'Critical' },
    { id: 'MED-142', name: 'Ceterizine 10mg', stock: 15, minRequired: 30, status: 'Critical' },
    { id: 'MED-004', name: 'Atorvastatin 20mg', stock: 45, minRequired: 50, status: 'Warning' },
    { id: 'MED-211', name: 'Lisinopril 10mg', stock: 22, minRequired: 25, status: 'Warning' },
];

const LowStockTable = () => {
    return (
        <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-text flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Low Stock Alerts
                    </h2>
                    <p className="text-xs text-text-muted mt-1">Items requiring immediate restock.</p>
                </div>
                <button className="text-sm text-primary hover:underline font-medium">Reorder All</button>
            </div>

            <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                            <th className="px-6 py-3 font-semibold">Medicine</th>
                            <th className="px-6 py-3 font-semibold">Current Stock</th>
                            <th className="px-6 py-3 font-semibold">Min Threshold</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {mockLowStock.map((item) => (
                            <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-text">{item.name}</div>
                                    <div className="text-xs text-text-muted font-mono mt-0.5">{item.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-red-600 dark:text-red-400">{item.stock}</span> units
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
            {mockLowStock.length === 0 && (
                <div className="p-8 text-center text-text-muted text-sm flex-grow flex items-center justify-center">
                    All inventory levels are healthy.
                </div>
            )}
        </div>
    );
};

export default LowStockTable;
