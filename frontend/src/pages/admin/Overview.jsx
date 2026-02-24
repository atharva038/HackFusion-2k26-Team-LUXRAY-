import React, { useEffect, useState } from 'react';
import { Users, FileSignature, AlertTriangle, PackageSearch, Loader2 } from 'lucide-react';
import { fetchDashboardStats } from '../../services/api';

const SummaryCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div className={`p-3 rounded-lg flex-shrink-0 ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-text-muted text-sm font-medium">{title}</h3>
            <p className="text-text text-2xl font-bold mt-1">{value}</p>
        </div>
    </div>
);

const Overview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    if (!stats) return <p className="text-text-muted">Failed to load dashboard.</p>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
            case 'pending':
            case 'awaiting_prescription': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
            case 'dispatched': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
            default: return 'bg-black/5 text-text-muted border-black/10';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Dashboard Overview</h1>
                <p className="text-text-muted text-sm mt-1">Monitor daily operations and active alerts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title="Total Orders Today" value={stats.ordersToday} icon={Users} colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
                <SummaryCard title="Pending Approvals" value={stats.pendingApprovals} icon={FileSignature} colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
                <SummaryCard title="Low Stock Items" value={stats.lowStockCount} icon={AlertTriangle} colorClass="bg-red-500/10 text-red-600 dark:text-red-400" />
                <SummaryCard title="Active Refill Alerts" value={stats.activeAlerts} icon={PackageSearch} colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400" />
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5">
                    <h2 className="font-semibold text-text">Recent Orders</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-3 font-semibold">Order ID</th>
                                <th className="px-6 py-3 font-semibold">Customer</th>
                                <th className="px-6 py-3 font-semibold">Items</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {stats.recentOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-mono text-text text-xs">{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-text-muted">{order.user?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-text-muted">{order.items.map(i => i.medicine?.name || 'Item').join(', ')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
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

export default Overview;
