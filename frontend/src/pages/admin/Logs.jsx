import React, { useEffect, useState } from 'react';
import { History, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { fetchInventoryLogs } from '../../services/api';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventoryLogs().then(setLogs).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
                    <History className="w-6 h-6 text-primary" /> Inventory Logs
                </h1>
                <p className="text-text-muted text-sm mt-1">Comprehensive audit trail of all inventory changes.</p>
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Log ID</th>
                                <th className="px-6 py-4 font-semibold">Medicine</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Quantity</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-mono text-xs text-text-muted">{log._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-6 py-4 font-medium text-text">{log.medicine?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${log.changeType === 'restock'
                                                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                                            }`}>
                                            {log.changeType === 'restock' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {log.changeType}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-mono font-medium ${log.changeType === 'restock' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {log.changeType === 'restock' ? `+${log.quantity}` : `-${log.quantity}`}
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-[13px]">{new Date(log.createdAt).toLocaleString()}</td>
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
