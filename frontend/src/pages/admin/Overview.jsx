import React from 'react';
import { Users, FileSignature, AlertTriangle, PackageSearch } from 'lucide-react';

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
    const recentOrders = [
        { id: 'ORD-1025', customer: 'Sarah Jenkins', items: 'Metformin 500mg', status: 'Pending', date: 'Just now' },
        { id: 'ORD-1024', customer: 'Michael Chen', items: 'Lisinopril 10mg', status: 'Approved', date: '2 hours ago' },
        { id: 'ORD-1023', customer: 'Emma Thompson', items: 'Amoxicillin 250mg', status: 'Requires Rx', date: '5 hours ago' },
        { id: 'ORD-1022', customer: 'David Wilson', items: 'Atorvastatin 20mg', status: 'Dispatched', date: 'Yesterday' },
    ];

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text">Dashboard Overview</h1>
                    <p className="text-text-muted text-sm mt-1">Monitor daily operations and active alerts.</p>
                </div>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Orders Today"
                    value="24"
                    icon={Users}
                    colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                />
                <SummaryCard
                    title="Pending Approvals"
                    value="7"
                    icon={FileSignature}
                    colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                />
                <SummaryCard
                    title="Low Stock Items"
                    value="3"
                    icon={AlertTriangle}
                    colorClass="bg-red-500/10 text-red-600 dark:text-red-400"
                />
                <SummaryCard
                    title="Active Refill Alerts"
                    value="12"
                    icon={PackageSearch}
                    colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                />
            </div>

            {/* Recent Orders Table Area */}
            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
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
                                <th className="px-6 py-3 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-medium text-text">{order.id}</td>
                                    <td className="px-6 py-4 text-text-muted">{order.customer}</td>
                                    <td className="px-6 py-4 text-text-muted">{order.items}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${order.status === 'Approved' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                                                order.status === 'Requires Rx' || order.status === 'Pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' :
                                                    order.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                                                        'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                                            }
                    `}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-[13px]">{order.date}</td>
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
