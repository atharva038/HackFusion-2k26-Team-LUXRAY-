import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Loader2, RefreshCw, Package,
    ChevronLeft, ChevronRight, Calendar, Hash, AlertCircle, Home,
    FileText, Download, CheckCircle2, XCircle, RotateCcw
} from 'lucide-react';
import Header from '../../components/layout/Header';
import { fetchUserOrders, sendChatMessage } from '../../services/api';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import { useSocket } from '../../context/SocketContext';
import { downloadInvoicePdf } from '../../utils/generateInvoice';

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'paid':
        case 'approved': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
        case 'dispatched': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
        case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
        case 'awaiting_payment': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
        case 'awaiting_prescription': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
        case 'pending':
        default: return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    }
};

// ─── Build a well-formed agent query from order history ────────────────────
const buildReorderQuery = (order) => {
    const itemLines = order.items
        .map((it) => {
            const name = it.medicine?.name || 'Unknown Medicine';
            const qty = it.quantity;
            const dose = it.dosage ? `, dosage: "${it.dosage}"` : '';
            return `- ${name}, quantity: ${qty}${dose}`;
        })
        .join('\n');

    return (
        `Reorder request: Please place a new order for me with exactly the following medicines:\n` +
        `${itemLines}\n\n` +
        `This is a repeat of my previous order #${order._id.slice(-6).toUpperCase()}. ` +
        `Process it exactly as listed, deduct stock, and confirm when done.`
    );
};

// ─── Order Card ────────────────────────────────────────────────────────────
const OrderCard = ({ order, reorderState, onReorder }) => {
    const rs = reorderState || {};
    const isPaid = order.paymentStatus === 'paid' || order.status === 'paid' || order.status === 'approved' || order.status === 'dispatched';

    const handleDownloadInvoice = () => {
        const medicineNames = order.items
            .map(i => i.medicine?.name || 'Medicine')
            .join(', ');
        downloadInvoicePdf({
            invoiceId: order.invoiceId || `INV-${order._id.slice(-6).toUpperCase()}`,
            orderId: order._id,
            amountPaid: order.totalAmount?.toFixed(2) || '0.00',
            items: medicineNames,
        });
    };

    return (
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
                    {isPaid && order.invoiceId && (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3" />
                            {order.invoiceId}
                        </p>
                    )}
                </div>
                <span className={`shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border capitalize whitespace-nowrap ${getStatusColor(order.status)}`}>
                    {order.status ? order.status.replace(/_/g, ' ') : 'Pending'}
                </span>
            </div>

            {/* Medicine list */}
            <div className="space-y-1.5">
                {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-text font-medium truncate">
                            {item.medicine?.name || 'Unknown Medicine'}
                        </span>
                        <span className="text-text-muted text-xs ml-3 flex items-center gap-1 shrink-0">
                            <Hash className="w-3 h-3" /> {item.quantity}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer: Amount + Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 gap-2">
                <p className="text-sm font-semibold text-text">
                    {order.totalAmount != null ? `₹${order.totalAmount.toFixed(2)}` : '—'}
                </p>

                <div className="flex items-center gap-2">
                    {isPaid && (
                        <button
                            onClick={handleDownloadInvoice}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                            title="Download Invoice PDF"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Invoice
                        </button>
                    )}

                    {/* Reorder button — states: idle | loading | success | error */}
                    {rs.status === 'success' ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ordered!
                        </span>
                    ) : rs.status === 'error' ? (
                        <button
                            onClick={() => onReorder(order)}
                            title={rs.message}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Retry
                        </button>
                    ) : rs.status === 'loading' ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Placing…
                        </span>
                    ) : (
                        <button
                            onClick={() => onReorder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-sm font-medium transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reorder
                        </button>
                    )}
                </div>
            </div>

            {/* Success agent reply */}
            {rs.status === 'success' && rs.message && (
                <div className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-4">{rs.message}</span>
                </div>
            )}

            {/* Error message */}
            {rs.status === 'error' && rs.message && (
                <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{rs.message}</span>
                </div>
            )}

            {/* Rejection reason banner */}
            {order.status === 'rejected' && order.rejectionReason && (
                <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{order.rejectionReason}</span>
                </div>
            )}
        </div>
    );
};

// ─── Page ──────────────────────────────────────────────────────────────────
const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    // { [orderId]: { status: 'idle'|'loading'|'success'|'error', message: string, razorpayOrderId?: string } }
    const [reorderStates, setReorderStates] = useState({});

    const navigate = useNavigate();
    const { on, off } = useSocket();
    const sessionId = useAppStore((s) => s.sessionId);
    const currentUserId = useAuthStore((s) => s.user?.id);
    const LIMIT = 10;

    const load = useCallback((p) => {
        setLoading(true);
        setError(null);
        fetchUserOrders(p, LIMIT)
            .then(({ orders: data, pagination: pag }) => {
                setOrders(data);
                setPagination(pag);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(page); }, [page, load]);

    // WebSocket listeners for real-time order updates
    useEffect(() => {
        // Prepend a new order only if it belongs to the current user and we're on page 1
        const handleNewOrder = (order) => {
            const orderUserId = order.user?._id?.toString() ?? order.user?.toString();
            if (orderUserId !== currentUserId) return;
            if (page !== 1) return;
            setOrders(prev => prev.some(o => o._id === order._id) ? prev : [order, ...prev]);
        };

        const handleOrderStatusUpdate = (data) => {
            setOrders(prevOrders =>
                prevOrders.map(order => {
                    if (order._id !== data.orderId) return order;
                    const updated = { ...order, status: data.status };
                    if (data.rejectionReason)  updated.rejectionReason  = data.rejectionReason;
                    // Carry through payment confirmation fields so the invoice
                    // download button appears immediately without a page refresh
                    if (data.paymentStatus)    updated.paymentStatus    = data.paymentStatus;
                    if (data.invoiceId)        updated.invoiceId        = data.invoiceId;
                    if (data.totalAmount != null) updated.totalAmount   = data.totalAmount;
                    return updated;
                })
            );
        };

        const handleOrderDispatched = (data) => {
            console.log('[MyOrders] Order dispatched:', data);
            
            // Update order status to dispatched
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order._id === data.orderId 
                        ? { ...order, status: 'dispatched' }
                        : order
                )
            );
        };

        const handleOrderRejected = (data) => {
            console.log('[MyOrders] Order rejected:', data);
            
            // Update order status to rejected with reason
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order._id === data.orderId 
                        ? { 
                            ...order, 
                            status: 'rejected',
                            rejectionReason: data.reason
                          }
                        : order
                )
            );
        };

        // Register event listeners
        on('order:new', handleNewOrder);
        on('order:status-updated', handleOrderStatusUpdate);
        on('order:dispatched', handleOrderDispatched);
        on('order:rejected', handleOrderRejected);

        // Cleanup listeners on unmount
        return () => {
            off('order:new', handleNewOrder);
            off('order:status-updated', handleOrderStatusUpdate);
            off('order:dispatched', handleOrderDispatched);
            off('order:rejected', handleOrderRejected);
        };
    }, [on, off, currentUserId, page]);

    // ── Core reorder: build query → send to chat agent → show result ──────
    const handleReorder = useCallback(async (order) => {
        const id = order._id;
        const activeSessionId = useAppStore.getState().currentSessionId;

        // Mark as loading
        setReorderStates(prev => ({ ...prev, [id]: { status: 'loading', message: '' } }));

        try {
            const query = buildReorderQuery(order);
            const resp = await sendChatMessage(query, activeSessionId);

            // Update session if the backend generated a new one
            if (resp && resp.sessionId && resp.sessionId !== activeSessionId) {
                useAppStore.getState().setCurrentSessionId(resp.sessionId);
            }

            // resp.text is the agent's final reply
            const replyText = resp?.text || resp?.message || 'Order placed successfully!';

            // Detect if agent replied with an error/blocked message
            const failed = resp?.blocked ||
                replyText.toLowerCase().includes('not found') ||
                replyText.toLowerCase().includes('cannot') ||
                replyText.toLowerCase().includes('failed');

            // Try to extract razorpay order id immediately
            const razorpayMatch = replyText.match(/Razorpay ID:\s*([A-Za-z0-9_]+)/i);
            const razorpayOrderId = razorpayMatch ? razorpayMatch[1] : null;

            if (!failed && razorpayOrderId) {
                // Instantly pop up Razorpay 
                const res = await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });

                if (!res) {
                    throw new Error('Failed to load Razorpay SDK');
                }

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'test',
                    amount: order.totalAmount ? Math.round(order.totalAmount * 100) : 0,
                    currency: 'INR',
                    name: 'Pharmacy Assistant',
                    description: `Reorder of ${order._id}`,
                    order_id: razorpayOrderId,
                    handler: async function (response) {
                        try {
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                            const baseUrl = apiUrl.replace(/\/api\/?$/, '');
                            const token = localStorage.getItem('pharmacy_token');

                            // Ensure synchronous backend verification works in Production without relying strictly on webhook transit time
                            const verifyRes = await fetch(`${baseUrl}/api/payment/verify`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: razorpayOrderId,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    amount: order.totalAmount,
                                }),
                            });

                            if (verifyRes.ok) {
                                setReorderStates(prev => ({
                                    ...prev,
                                    [id]: { status: 'success', message: 'Payment Successful! Reorder placed and paid.' }
                                }));
                                setTimeout(() => window.location.reload(), 1500);
                            } else {
                                throw new Error(await verifyRes.text());
                            }
                        } catch (e) {
                            console.error("Payment verification failed", e);
                            setReorderStates(prev => ({
                                ...prev,
                                [id]: { status: 'error', message: 'Payment captured but verification failed. Please check with support.' }
                            }));
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setReorderStates(prev => ({
                                ...prev,
                                [id]: { status: 'error', message: 'Payment cancelled. Order placed but payment is pending. Please pay via chat.' }
                            }));
                        }
                    },
                    theme: { color: '#3b82f6' },
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                setReorderStates(prev => ({
                    ...prev,
                    [id]: {
                        status: failed ? 'error' : 'success',
                        message: replyText,
                        razorpayOrderId
                    },
                }));
            }
        } catch (err) {
            setReorderStates(prev => ({
                ...prev,
                [id]: {
                    status: 'error',
                    message: err.message || 'Failed to place reorder. Please try again.',
                },
            }));
        }
    }, [sessionId]);

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
                        View and reorder your past pharmacy orders. Click <strong>Reorder</strong> to instantly place the same order again via AI.
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
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    reorderState={reorderStates[order._id]}
                                    onReorder={handleReorder}
                                />
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
