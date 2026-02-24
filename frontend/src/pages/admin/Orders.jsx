import React, { useState } from 'react';
import { Eye, Check, X, Truck } from 'lucide-react';

const Orders = () => {
    const [orders, setOrders] = useState([
        { id: 'ORD-1025', customer: 'Sarah Jenkins', items: 'Metformin 500mg (60)', status: 'Pending', date: '2026-02-24 10:30 AM' },
        { id: 'ORD-1024', customer: 'Michael Chen', items: 'Lisinopril 10mg (30)', status: 'Approved', date: '2026-02-24 08:15 AM' },
        { id: 'ORD-1023', customer: 'Emma Thompson', items: 'Amoxicillin 250mg (14)', status: 'Requires Rx', date: '2026-02-23 04:45 PM' },
        { id: 'ORD-1022', customer: 'David Wilson', items: 'Atorvastatin 20mg (90)', status: 'Dispatched', date: '2026-02-23 02:20 PM' },
        { id: 'ORD-1021', customer: 'Lisa Park', items: 'Ibuprofen 400mg (20)', status: 'Rejected', date: '2026-02-23 11:10 AM' },
    ]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
            case 'Requires Rx':
            case 'Pending': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
            case 'Dispatched': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
            case 'Rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
            default: return 'bg-black/5 text-text-muted border-black/10';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text">Orders Management</h1>
                    <p className="text-text-muted text-sm mt-1">Review and process all incoming pharmacy orders.</p>
                </div>
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Order ID</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Items</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-medium text-text">{order.id}</td>
                                    <td className="px-6 py-4 text-text-muted">{order.customer}</td>
                                    <td className="px-6 py-4 text-text-muted truncate max-w-[200px]">{order.items}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-[13px]">{order.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text transition-colors" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {order.status === 'Pending' || order.status === 'Requires Rx' ? (
                                                <>
                                                    <button className="p-1.5 rounded-md hover:bg-green-500/10 text-text-muted hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Approve">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Reject">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : order.status === 'Approved' ? (
                                                <button className="p-1.5 rounded-md hover:bg-blue-500/10 text-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Dispatch Order">
                                                    <Truck className="w-4 h-4" />
                                                </button>
                                            ) : null}
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

export default Orders;
