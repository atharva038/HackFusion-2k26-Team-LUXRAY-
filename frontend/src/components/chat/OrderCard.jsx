import React from 'react';
import { motion } from 'framer-motion';
import { Pill, CheckCircle, Clock } from 'lucide-react';

const OrderCard = ({ details }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
            className="mt-3 overflow-hidden rounded-2xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 shadow-sm w-full max-w-sm relative"
        >
            {/* Top Banner section */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${details.status === 'awaiting_payment' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500' : 'bg-primary/10 border-primary/10 text-primary'}`}>
                <div className="flex items-center gap-2 font-medium text-sm">
                    <Pill className="w-4 h-4" />
                    {details.status === 'awaiting_payment' ? 'Awaiting Payment' : 'Order Confirmed'}
                </div>
                <span className="text-xs font-semibold opacity-70">{details.orderId}</span>
            </div>

            {/* Details Box */}
            <div className="px-4 py-4 space-y-3">
                <div>
                    <h4 className="text-text font-semibold text-[15px]">{details.medicine}</h4>
                    {details.status !== 'awaiting_payment' && (
                        <p className="text-sm text-text-muted mt-0.5">Will be delivered to your default address.</p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className={`w-4 h-4 ${details.status === 'awaiting_payment' ? 'text-amber-500' : 'text-green-500'}`} />
                            <span className="font-medium text-text capitalize">{details.status.replace('_', ' ')}</span>
                        </div>
                        {details.status !== 'awaiting_payment' && (
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                <Clock className="w-4 h-4" />
                                <span>ETA: {details.eta}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pay Now Button */}
                {details.status === 'awaiting_payment' && details.razorpayOrderId && (
                    <div className="pt-2">
                        <button
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
                                    amount: details.amount ? details.amount * 100 : 0,
                                    currency: 'INR',
                                    name: 'Pharmacy Assistant',
                                    description: `Order ${details.orderId}`,
                                    order_id: details.razorpayOrderId,
                                    handler: function (response) {
                                        // The webhook handles the actual backend confirmation.
                                        // We just alert the user here or update UI optimisticly.
                                        alert('Payment Successful! Your order will be confirmed shortly.');
                                    },
                                    theme: {
                                        color: '#3b82f6', // primary blue
                                    },
                                };
                                const rzp = new window.Razorpay(options);
                                rzp.open();
                            }}
                            className="w-full py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            Pay Now {details.amount ? `(₹${details.amount})` : ''}
                        </button>
                    </div>
                )}
            </div>

            {/* Shimmer Highlight */}
            {details.status !== 'awaiting_payment' && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            )}
        </motion.div>
    );
};

export default OrderCard;
