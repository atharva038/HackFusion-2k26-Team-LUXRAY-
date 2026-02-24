import React from 'react';
import { motion } from 'framer-motion';
import { Pill, CheckCircle, Clock } from 'lucide-react';

const OrderCard = ({ details }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
            className="mt-3 overflow-hidden rounded-2xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 shadow-sm w-full max-w-sm"
        >
            {/* Top Banner section */}
            <div className="bg-primary/10 px-4 py-3 border-b border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <Pill className="w-4 h-4" />
                    Order Confirmed
                </div>
                <span className="text-xs font-semibold text-primary/70">{details.orderId}</span>
            </div>

            {/* Details Box */}
            <div className="px-4 py-4 space-y-3">
                <div>
                    <h4 className="text-text font-semibold text-[15px]">{details.medicine}</h4>
                    <p className="text-sm text-text-muted mt-0.5">Will be delivered to your default address.</p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-text">{details.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Clock className="w-4 h-4" />
                        <span>ETA: {details.eta}</span>
                    </div>
                </div>
            </div>

            {/* Shimmer Highlight */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        </motion.div>
    );
};

export default OrderCard;
