import React, { useState } from 'react';
import { BellRing, Check, MessageSquare } from 'lucide-react';

const Alerts = () => {
    const [alerts] = useState([
        { id: 'ALT-901', customer: 'Emma Thompson', medicine: 'Amoxicillin 250mg', depletionInfo: 'Depleted in 2 days', status: 'Pending Action' },
        { id: 'ALT-902', customer: 'Michael Chen', medicine: 'Lisinopril 10mg', depletionInfo: 'Depleted yesterday', status: 'Notified' },
        { id: 'ALT-903', customer: 'David Wilson', medicine: 'Atorvastatin 20mg', depletionInfo: 'Depleted in 5 days', status: 'Pending Action' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
                        <BellRing className="w-6 h-6 text-primary" /> Refill Alerts
                    </h1>
                    <p className="text-text-muted text-sm mt-1">AI-generated predictions for customer prescription refills.</p>
                </div>
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Medicine</th>
                                <th className="px-6 py-4 font-semibold">Estimated Depletion</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {alerts.map((alert) => (
                                <tr key={alert.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-medium text-text">{alert.customer}</td>
                                    <td className="px-6 py-4 text-text-muted">{alert.medicine}</td>
                                    <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-medium">{alert.depletionInfo}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${alert.status === 'Notified' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                            }`}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1.5 rounded-md hover:bg-primary/10 text-text-muted hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold" title="Notify Customer">
                                                <MessageSquare className="w-4 h-4" /> Notify
                                            </button>
                                            <button className="p-1.5 rounded-md hover:bg-green-500/10 text-text-muted hover:text-green-600 transition-colors" title="Mark Resolved">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Alerts;
