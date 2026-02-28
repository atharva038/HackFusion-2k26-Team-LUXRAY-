import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Truck, Loader2, Search, Filter, Wifi, WifiOff, PackageOpen } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../../services/api';
import ActionModal from '../../components/ui/ActionModal';
import { useSocket } from '../../context/SocketContext';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null, status: null, type: 'warning' });
    const [updatingIds, setUpdatingIds] = useState(new Set());
    const [newOrderIds, setNewOrderIds] = useState(new Set());

    const { on, off, isConnected } = useSocket();

    const load = useCallback(() => {
        setLoading(true);
        fetchOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    // Shared helper to patch a single order in state
    const patchOrder = useCallback((orderId, patch) => {
        setOrders(prev =>
            prev.map(order =>
                order._id === orderId ? { ...order, ...patch } : order
            )
        );
    }, []);

    // Flash-highlight a newly arrived order row for 3 s then clear
    const flashNew = useCallback((orderId) => {
        setNewOrderIds(prev => new Set(prev).add(orderId));
        setTimeout(() => {
            setNewOrderIds(prev => { const s = new Set(prev); s.delete(orderId); return s; });
        }, 3000);
    }, []);

    useEffect(() => {
        // New order placed by a customer — prepend to list with highlight
        const handleNewOrder = (order) => {
            setOrders(prev => prev.some(o => o._id === order._id) ? prev : [order, ...prev]);
            flashNew(order._id);
        };

        // Broadcast sent to all admins whenever ANY order status changes
        const handleAdminOrderUpdate = (data) => {
            const patch = {
                status: data.status,
                rejectionReason: data.rejectionReason,
                approvedBy: data.approvedBy,
                totalAmount: data.totalAmount,
            };
            // Carry through payment fields when order is confirmed paid
            if (data.paymentStatus) patch.paymentStatus = data.paymentStatus;
            if (data.invoiceId) patch.invoiceId = data.invoiceId;
            patchOrder(data.orderId, patch);
            // Clear any lingering spinner (e.g. from another admin's action)
            setUpdatingIds(prev => { const s = new Set(prev); s.delete(data.orderId); return s; });
        };

        on('order:new', handleNewOrder);
        on('order:admin-updated', handleAdminOrderUpdate);

        return () => {
            off('order:new', handleNewOrder);
            off('order:admin-updated', handleAdminOrderUpdate);
        };
    }, [on, off, patchOrder, flashNew]);

    const handleActionConfirm = async () => {
        const { id, status } = modalConfig;
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setUpdatingIds(prev => new Set(prev).add(id));

        // Optimistically update UI immediately
        patchOrder(id, { status });

        try {
            await updateOrderStatus(id, status, status === 'rejected' ? 'Rejected by pharmacist.' : '');
            // Socket event (order:admin-updated) will propagate the change to other admins
        } catch (err) {
            console.error(err);
            load(); // Rollback on failure
        } finally {
            // Always clear spinner after API responds — don't rely solely on socket for this
            setUpdatingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        }
    };

    const triggerModal = (id, status) => {
        const configs = {
            approved: { title: 'Approve Order', message: 'Are you sure you want to approve this order for processing?', type: 'approve', color: 'bg-green-600 hover:bg-green-700 text-white' },
            rejected: { title: 'Reject Order', message: 'Are you sure you want to reject this order? This action cannot be undone.', type: 'reject', color: 'bg-red-600 hover:bg-red-700 text-white' },
            dispatched: { title: 'Dispatch Order', message: 'Confirm that this order has been packaged and handed over to the delivery partner.', type: 'dispatch', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
        };
        setModalConfig({ isOpen: true, id, status, ...configs[status] });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
            case 'approved': return 'bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]';
            case 'pending':
            case 'awaiting_prescription': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
            case 'awaiting_payment': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.15)]';
            case 'dispatched': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
            case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
            default: return 'bg-black/5 text-text-muted ring-1 ring-black/10 dark:ring-white/10';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch && (filterStatus === 'all' || order.status === filterStatus);
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-text bg-gradient-to-r from-text to-text-muted bg-clip-text text-transparent">Orders Management</h1>
                    <p className="text-text-muted text-sm mt-1">Review and process all incoming pharmacy orders.</p>
                </div>
                {/* Real-time connection badge */}
                <div className={`flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full ring-1 ${isConnected
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/30'
                    }`}>
                    {isConnected
                        ? <><Wifi className="w-3.5 h-3.5 animate-pulse" /> Live</>
                        : <><WifiOff className="w-3.5 h-3.5" /> Offline</>
                    }
                </div>
            </div>

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
                        className="pl-10 pr-4 py-2 w-full bg-card/60 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text shadow-sm transition-all focus:bg-card/90"
                    />
                </div>
                <div className="relative min-w-[180px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-text-muted" />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 w-full bg-card/60 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-text shadow-sm"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="awaiting_prescription">Awaiting Rx</option>
                        <option value="awaiting_payment">Awaiting Payment</option>
                        <option value="paid">Paid</option>
                        <option value="approved">Approved</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/40 backdrop-blur-3xl border border-white/5 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-black/40 text-text-muted text-[11px] uppercase tracking-wider">
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
                            <AnimatePresence>
                                {filteredOrders.length > 0 ? filteredOrders.map((order, index) => (
                                    <motion.tr
                                        key={order._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                        className={`transition-colors text-[14px] group ${newOrderIds.has(order._id) ? 'bg-green-500/10 dark:bg-green-500/10 shadow-[inset_0_0_20px_rgba(34,197,94,0.3)]' : 'hover:bg-white/40 dark:hover:bg-black/20'}`}
                                    >
                                        <td className="px-6 py-4 font-mono text-text-muted/80 text-[13px]">{order._id.substring(order._id.length - 8).toUpperCase()}</td>
                                        <td className="px-6 py-4">{order.user?.name
                                            ? (
                                                <span className="font-semibold text-text">
                                                    {order.user.name}
                                                    {order.user.email && (
                                                        <span className="block text-[11px] text-text-muted mt-0.5 font-normal">{order.user.email}</span>
                                                    )}
                                                </span>
                                            )
                                            : <span className="italic text-text-muted/60 text-xs">Unknown user</span>}</td>
                                        <td className="px-6 py-4 text-text-muted font-medium truncate max-w-[200px]">{order.items.map(i => `${i.medicine?.name || 'Item'} (x${i.quantity || 1})`).join(', ')}</td>
                                        <td className="px-6 py-4">
                                            {updatingIds.has(order._id) ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-primary drop-shadow-md" />
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-widest uppercase shadow-sm ${getStatusColor(order.status)}`}>
                                                    {order.status?.replace(/_/g, ' ')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-text font-semibold text-[14px]">
                                            {order.totalAmount ? `₹${order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
                                        </td>
                                        <td className="px-6 py-4 text-text-muted font-medium text-[13px]">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                {(order.status === 'pending' || order.status === 'awaiting_prescription' || order.status === 'awaiting_payment') && (
                                                    <>
                                                        <button
                                                            onClick={() => triggerModal(order._id, 'approved')}
                                                            disabled={updatingIds.has(order._id)}
                                                            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-green-500/20 text-text-muted hover:text-green-600 dark:hover:text-green-400 transition-all md:hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Approve"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => triggerModal(order._id, 'rejected')}
                                                            disabled={updatingIds.has(order._id)}
                                                            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-all md:hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {(order.status === 'approved' || order.status === 'paid') && (
                                                    <button
                                                        onClick={() => triggerModal(order._id, 'dispatched')}
                                                        disabled={updatingIds.has(order._id)}
                                                        className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-blue-500/20 text-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-all md:hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="Dispatch"
                                                    >
                                                        <Truck className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-text-muted text-sm">
                                            <PackageOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            No orders found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

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
