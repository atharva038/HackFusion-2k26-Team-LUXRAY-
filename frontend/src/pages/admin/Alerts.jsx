import React, { useEffect, useState } from 'react';
import { BellRing, Check, MessageSquare, Loader2, Search, Filter } from 'lucide-react';
import { fetchRefillAlerts, updateRefillAlert } from '../../services/api';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const load = () => {
        setLoading(true);
        fetchRefillAlerts().then(setAlerts).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleAction = async (id, status) => {
        try {
            await updateRefillAlert(id, status);
            load();
        } catch (err) { console.error(err); }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'notified': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
            case 'completed': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
            default: return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
        }
    };

    const filteredAlerts = alerts.filter((alert) => {
        const matchesSearch =
            (alert.user?.name && alert.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (alert.medicine?.name && alert.medicine.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = filterStatus === 'all' || alert.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
                    <BellRing className="w-6 h-6 text-primary" /> Refill Alerts
                </h1>
                <p className="text-text-muted text-sm mt-1">AI-generated predictions for customer prescription refills.</p>
            </div>

            {/* Custom Control Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Customer or Medicine..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-card border border-black/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                    />
                </div>
                <div className="relative min-w-[180px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-text-muted" />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 w-full bg-card border border-black/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-text"
                    >
                        <option value="all">All Alerts</option>
                        <option value="active">Active</option>
                        <option value="notified">Notified</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Medicine</th>
                                <th className="px-6 py-4 font-semibold">Est. Depletion</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                                <tr key={alert._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-medium text-text">{alert.user?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-text-muted">{alert.medicine?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-medium">
                                        {alert.estimatedDepletionDate ? new Date(alert.estimatedDepletionDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(alert.status)}`}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {alert.status === 'active' && (
                                                <button onClick={() => handleAction(alert._id, 'notified')} className="p-1.5 rounded-md hover:bg-primary/10 text-text-muted hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold" title="Notify">
                                                    <MessageSquare className="w-4 h-4" /> Notify
                                                </button>
                                            )}
                                            {(alert.status === 'active' || alert.status === 'notified') && (
                                                <button onClick={() => handleAction(alert._id, 'completed')} className="p-1.5 rounded-md hover:bg-green-500/10 text-text-muted hover:text-green-600 transition-colors" title="Complete">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-text-muted text-sm">
                                        No alerts found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Alerts;
