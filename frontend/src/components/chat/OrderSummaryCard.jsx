import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, Clock, XCircle, Truck, FileText } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const STATUS_CONFIG = {
    approved: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    },
    paid: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    },
    pending: {
        icon: <Clock className="w-4 h-4" />,
        cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    },
    rejected: {
        icon: <XCircle className="w-4 h-4" />,
        cls: 'bg-red-500/15 text-red-500 border-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    },
    dispatched: {
        icon: <Truck className="w-4 h-4" />,
        cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    },
    awaiting_payment: {
        icon: <Clock className="w-4 h-4" />,
        cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    },
    awaiting_prescription: {
        icon: <FileText className="w-4 h-4" />,
        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    },
};

/**
 * OrderSummaryCard — rich card for single-order summaries.
 * Props: { messageId, orderId, status, items, total, customer, razorpayOrderId, amount }
 */
const OrderSummaryCard = ({ messageId, orderId, status, items, total, customer, razorpayOrderId, amount }) => {
    const norm = status?.toLowerCase()?.replace(/ /g, '_') || 'pending';
    const cfg = STATUS_CONFIG[norm] || STATUS_CONFIG.pending;
    const updateMessageStructuredData = useAppStore(state => state.updateMessageStructuredData);
    const currentSessionId = useAppStore(state => state.currentSessionId);
    const setMessages = useAppStore(state => state.setMessages);

    const [isChecking, setIsChecking] = useState(norm === 'awaiting_payment');

    // Poll the backend if the order is awaiting payment
    useEffect(() => {
        if (norm !== 'awaiting_payment' || !razorpayOrderId) {
            setIsChecking(false);
            return;
        }

        let isMounted = true;
        let interval;
        let isFetching = false;

        const checkStatus = async () => {
            if (isFetching || !isMounted) return;
            isFetching = true;

            try {
                // VITE_API_URL may already end with /api (production) — strip it to avoid double /api
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const baseUrl = apiUrl.replace(/\/api\/?$/, '');
                const token = localStorage.getItem('pharmacy_token');
                const res = await fetch(`${baseUrl}/api/payment/status/${razorpayOrderId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();

                    // If paid, update UI and fetch chat history ONLY ONCE, then clear the interval
                    if (data.paymentStatus === 'paid') {
                        clearInterval(interval);

                        // 1. Mutate local UI state 
                        if (messageId && updateMessageStructuredData) {
                            updateMessageStructuredData(messageId, { status: 'paid' });
                        }

                        // 2. Fetch the latest chat messages to pull the invoice into the UI
                        if (currentSessionId && setMessages) {
                            const chatRes = await fetch(`${baseUrl}/api/chat/history/${currentSessionId}`, {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('pharmacy_token')}`
                                }
                            });

                            if (chatRes.ok) {
                                const chatData = await chatRes.json();
                                if (chatData.history) {
                                    const { parseStructuredOutput } = await import('../../utils/parseStructuredOutput.js');
                                    const formatted = chatData.history.map((msg, i) => ({
                                        id: i,
                                        role: msg.role,
                                        text: msg.content,
                                        tools: [],
                                        structured: msg.role === 'ai' ? parseStructuredOutput(msg.content) : null
                                    }));
                                    setMessages(formatted);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Payment status poll failed:", err);
            } finally {
                isFetching = false;
                if (isMounted) setIsChecking(false);
            }
        };

        // Check instantly on mount, then poll every 4 seconds
        checkStatus();
        interval = setInterval(checkStatus, 4000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [norm, razorpayOrderId, messageId, currentSessionId]); // Removed Zustand setter dependencies to prevent infinite loops

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 180, delay: 0.1 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(6,182,212,0.15)] bg-glass backdrop-blur-xl group"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-cyan-900/10 border-b border-white/10">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-widest uppercase">
                    <Package className="w-4 h-4" />
                    Order Summary
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize border transition-all duration-300 ${cfg.cls}`}>
                    {cfg.icon}
                    {norm.replace(/_/g, ' ')}
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-3">
                {customer && (
                    <Row label="Customer" value={customer} />
                )}
                {orderId && (
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-[12px] font-medium text-text-muted shrink-0">Order ID</span>
                        <span className="font-mono text-[11px] text-text-muted text-right break-all">{orderId}</span>
                    </div>
                )}
                {items && (
                    <Row label="Items" value={items} />
                )}
                {total && (
                    <Row label="Total" value={total} bold />
                )}

                {/* Pay Now Button */}
                {norm === 'awaiting_payment' && razorpayOrderId && (
                    <div className="pt-3 flex flex-col gap-2 mt-3">
                        <button
                            disabled={isChecking}
                            onClick={async () => {
                                // Dynamically load razorpay script
                                const res = await new Promise((resolve) => {
                                    const script = document.createElement('script');
                                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                                    script.onload = () => resolve(true);
                                    script.onerror = () => resolve(false);
                                    document.body.appendChild(script);
                                });

                                if (!res) {
                                    alert('Failed to load Razorpay SDK');
                                    return;
                                }

                                const options = {
                                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'test',
                                    amount: amount ? amount * 100 : 0,
                                    currency: 'INR',
                                    name: 'Pharmacy Assistant',
                                    description: `Order ${orderId}`,
                                    order_id: razorpayOrderId,
                                    handler: async function (response) {
                                        // ─── PRIMARY confirmation path: verify directly with backend ───
                                        // This works in BOTH production AND dev regardless of webhook setup
                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                        const baseUrl = apiUrl.replace(/\/api\/?$/, '');
                                        const token = localStorage.getItem('pharmacy_token');

                                        try {
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
                                                    amount: amount,
                                                }),
                                            });

                                            if (verifyRes.ok) {
                                                // Payment confirmed — update UI immediately
                                                if (messageId && updateMessageStructuredData) {
                                                    updateMessageStructuredData(messageId, { status: 'paid' });
                                                }

                                                // Reload chat messages to show invoice in chat
                                                if (currentSessionId && setMessages) {
                                                    try {
                                                        const chatRes = await fetch(`${baseUrl}/api/chat/history/${currentSessionId}`, {
                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                        });
                                                        if (chatRes.ok) {
                                                            const chatData = await chatRes.json();
                                                            if (chatData.history) {
                                                                const { parseStructuredOutput } = await import('../../utils/parseStructuredOutput.js');
                                                                const formatted = chatData.history.map((msg, i) => ({
                                                                    id: i, role: msg.role, text: msg.content,
                                                                    tools: [], structured: msg.role === 'ai' ? parseStructuredOutput(msg.content) : null
                                                                }));
                                                                setMessages(formatted);
                                                            }
                                                        }
                                                    } catch (chatErr) {
                                                        console.error('Failed to refresh chat after payment:', chatErr);
                                                    }
                                                }
                                            } else {
                                                console.error('Payment verify failed:', await verifyRes.text());
                                            }
                                        } catch (verifyErr) {
                                            console.error('Payment verify request failed:', verifyErr);
                                        }
                                    },
                                    theme: {
                                        color: '#3b82f6', // primary blue
                                    },
                                };
                                const rzp = new window.Razorpay(options);
                                rzp.open();
                            }}
                            className={`w-full py-3 text-white rounded-[1.25rem] font-semibold text-[14px] transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${isChecking
                                ? 'bg-amber-400 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                        >
                            {isChecking ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                `Pay Now ${amount ? `(₹${amount})` : ''}`
                            )}
                        </button>
                        <p className="text-[10px] text-text-muted text-center opacity-70 mt-1">
                            Secure payment powered by Razorpay
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const Row = ({ label, value, bold }) => (
    <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] font-medium text-text-muted shrink-0 min-w-[64px]">{label}</span>
        <span className={`text-[13px] text-text text-right ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
);

export default OrderSummaryCard;
