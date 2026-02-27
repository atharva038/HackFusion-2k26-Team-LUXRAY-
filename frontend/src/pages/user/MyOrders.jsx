import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Loader2, RefreshCw, Package,
    ChevronLeft, ChevronRight, Calendar, Hash, AlertCircle, Home
} from 'lucide-react';
import Header from '../../components/layout/Header';
import { fetchUserOrders } from '../../services/api';
import useAppStore from '../../store/useAppStore';

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
        case 'dispatched': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
        case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
        case 'awaiting_prescription': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
        case 'pending':
        default: return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    }
};

const OrderCard = ({ order, onReorder }) => (
    <div className="bg-card border border-black/5 dark:border-white/5 rounded-2xl shadow-soft p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
        {/* Top row: ID + Status + Date */}
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs text-text-muted font-mono uppercase tracking-wider">
                    Order #{order._id.slice(-6).toUpperCase()}
                </p>
                <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    })}
                </p>
            </div>
            <span className={`shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border capitalize whitespace-nowrap ${getStatusColor(order.status)}`}>
                {order.status ? order.status.replace('_', ' ') : 'Pending'}
            </span>
        </div>

        {/* Medicine list */}
        <div className="space-y-1.5">
            {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-text font-medium truncate">{item.medicine?.name || 'Unknown Medicine'}</span>
                    <span className="text-text-muted text-xs ml-3 flex items-center gap-1 shrink-0">
                        <Hash className="w-3 h-3" /> {item.quantity}
                    </span>
                </div>
            ))}
        </div>

        {/* Footer: Amount + Reorder button */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
            <p className="text-sm font-semibold text-text">
                {order.totalAmount != null ? `₹${order.totalAmount.toFixed(2)}` : '—'}
            </p>
            <button
                onClick={() => onReorder(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Reorder
            </button>
        </div>

        {/* Rejection reason banner */}
        {order.status === 'rejected' && order.rejectionReason && (
            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{order.rejectionReason}</span>
            </div>
        )}
    </div>
);

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    const navigate = useNavigate();

    const load = (p) => {
        setLoading(true);
        setError(null);
        fetchUserOrders(p, LIMIT)
            .then(({ orders: data, pagination: pag }) => {
                setOrders(data);
                setPagination(pag);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(page); }, [page]);

    const handleReorder = (order) => {
        const medList = order.items
            .map(i => `${i.medicine?.name || 'Unknown'} (qty: ${i.quantity})`)
            .join(', ');
        const msg = `I'd like to reorder my previous order (ID: ...${order._id.slice(-6).toUpperCase()}). The medicines were: ${medList}. Please help me place this order again.`;
        useAppStore.getState().setPendingChatMessage(msg);
        navigate('/');
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg text-text transition-colors duration-500">
            <Header />
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-colors cursor-pointer"
                            title="Back to Chat"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-primary" />
                            My Orders
                        </h1>
                    </div>
                    <p className="text-text-muted text-sm mt-1">
                        View and reorder your past pharmacy orders.
                    </p>
                </div>

                {loading && (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-sm text-center py-8">{error}</div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-4">
                        <Package className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-medium">You haven't placed any orders yet.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            Start Ordering
                        </button>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {orders.map(order => (
                                <OrderCard key={order._id} order={order} onReorder={handleReorder} />
                            ))}
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-8">
                                <button
                                    onClick={() => setPage(p => p - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="p-2 rounded-lg bg-card border border-black/5 dark:border-white/5 text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-text-muted">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!pagination.hasNext}
                                    className="p-2 rounded-lg bg-card border border-black/5 dark:border-white/5 text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default MyOrders;
