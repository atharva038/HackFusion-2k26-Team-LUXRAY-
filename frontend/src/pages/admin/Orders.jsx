import React, { useEffect, useState } from 'react';
import { Eye, Check, X, Truck, Loader2, Search, Filter } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../../services/api';
import ActionModal from '../../components/ui/ActionModal';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null, status: null, type: 'warning' });

    const load = () => {
        setLoading(true);
        fetchOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleActionConfirm = async () => {
        try {
            await updateOrderStatus(modalConfig.id, modalConfig.status, modalConfig.status === 'rejected' ? 'Rejected by pharmacist.' : '');
            load(); // refresh
        } catch (err) { console.error(err); }
    };

    const triggerModal = (id, status) => {
        let title, message, type, color;
        if (status === 'approved') {
            title = 'Approve Order';
            message = 'Are you sure you want to approve this order for processing?';
            type = 'approve';
            color = 'bg-green-600 hover:bg-green-700 text-white';
        } else if (status === 'rejected') {
            title = 'Reject Order';
            message = 'Are you sure you want to reject this order? This action cannot be undone.';
            type = 'reject';
            color = 'bg-red-600 hover:bg-red-700 text-white';
        } else if (status === 'dispatched') {
            title = 'Dispatch Order';
            message = 'Confirm that this order has been packaged and handed over to the delivery partner.';
            type = 'dispatch';
            color = 'bg-blue-600 hover:bg-blue-700 text-white';
        }
        setModalConfig({ isOpen: true, id, status, title, message, type, color });
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

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user?.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = filterStatus === 'all' || order.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Orders Management</h1>
                <p className="text-text-muted text-sm mt-1">Review and process all incoming pharmacy orders.</p>
            </div>

            {/* Custom Control Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer..."
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
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="awaiting_prescription">Awaiting Rx</option>
                        <option value="approved">Approved</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="rejected">Rejected</option>
                    </select>
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
                                <th className="px-6 py-4 font-semibold">Total Price</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-mono text-text text-xs">{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-text-muted">{order.user?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-text-muted truncate max-w-[200px]">{order.items.map(i => `${i.medicine?.name || 'Item'} (x${i.quantity || 1})`).join(', ')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-[13px]">
                                        {order.totalAmount ? `€${order.totalAmount.toFixed(2)}` : '€0.00'}
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-[13px]">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {(order.status === 'pending' || order.status === 'awaiting_prescription') && (
                                                <>
                                                    <button onClick={() => triggerModal(order._id, 'approved')} className="p-1.5 rounded-md hover:bg-green-500/10 text-text-muted hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Approve">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => triggerModal(order._id, 'rejected')} className="p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Reject">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'approved' && (
                                                <button onClick={() => triggerModal(order._id, 'dispatched')} className="p-1.5 rounded-md hover:bg-blue-500/10 text-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Dispatch">
                                                    <Truck className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-text-muted text-sm">
                                        No orders found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleActionConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                iconType={modalConfig.type}
                confirmColorClass={modalConfig.color}
            />
        </div>
    );
};

export default Orders;
