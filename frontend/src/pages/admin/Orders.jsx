import React, { useEffect, useState } from 'react';
import { Eye, Check, X, Truck, Loader2 } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../../services/api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        fetchOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleAction = async (id, status, reason) => {
        try {
            await updateOrderStatus(id, status, reason);
            load(); // refresh
        } catch (err) { console.error(err); }
    };

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

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Orders Management</h1>
                <p className="text-text-muted text-sm mt-1">Review and process all incoming pharmacy orders.</p>
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
                                <tr key={order._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-mono text-text text-xs">{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-text-muted">{order.user?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-text-muted truncate max-w-[200px]">{order.items.map(i => i.medicine?.name || 'Item').join(', ')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-[13px]">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {(order.status === 'pending' || order.status === 'awaiting_prescription') && (
                                                <>
                                                    <button onClick={() => handleAction(order._id, 'approved')} className="p-1.5 rounded-md hover:bg-green-500/10 text-text-muted hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Approve">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleAction(order._id, 'rejected', 'Rejected by pharmacist.')} className="p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Reject">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'approved' && (
                                                <button onClick={() => handleAction(order._id, 'dispatched')} className="p-1.5 rounded-md hover:bg-blue-500/10 text-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Dispatch">
                                                    <Truck className="w-4 h-4" />
                                                </button>
                                            )}
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
