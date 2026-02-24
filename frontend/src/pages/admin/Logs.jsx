import React, { useState } from 'react';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const Logs = () => {
    const [logs] = useState([
        { id: 'LOG-10024', medicine: 'Metformin 500mg', type: 'Deduction', quantity: -60, orderRef: 'ORD-1025', date: '2026-02-24 10:30 AM' },
        { id: 'LOG-10023', medicine: 'Lisinopril 10mg', type: 'Deduction', quantity: -30, orderRef: 'ORD-1024', date: '2026-02-24 08:15 AM' },
        { id: 'LOG-10022', medicine: 'Amoxicillin 250mg', type: 'Restock', quantity: +500, orderRef: 'RESTOCK-911', date: '2026-02-24 08:00 AM' },
        { id: 'LOG-10021', medicine: 'Atorvastatin 20mg', type: 'Deduction', quantity: -90, orderRef: 'ORD-1022', date: '2026-02-23 02:20 PM' },
        { id: 'LOG-10020', medicine: 'Ibuprofen 400mg', type: 'Adjustment', quantity: -5, orderRef: 'AUDIT-002', date: '2026-02-23 09:00 AM' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
                        <History className="w-6 h-6 text-primary" /> Inventory Logs
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Comprehensive audit trail of all inventory changes.</p>
                </div>
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Log ID</th>
                                <th className="px-6 py-4 font-semibold">Medicine</th>
                                <th className="px-6 py-4 font-semibold">Change Type</th>
                                <th className="px-6 py-4 font-semibold">Quantity Delta</th>
                                <th className="px-6 py-4 font-semibold">Reference</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-medium text-text-muted">{log.id}</td>
                                    <td className="px-6 py-4 font-medium text-text">{log.medicine}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${log.type === 'Restock' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                                                log.type === 'Adjustment' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' :
                                                    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                                            }`}>
                                            {log.type === 'Restock' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-mono font-medium ${log.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-text-muted">{log.orderRef}</td>
                                    <td className="px-6 py-4 text-text-muted text-[13px]">{log.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Logs;
