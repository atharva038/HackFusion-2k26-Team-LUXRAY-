import React, { useState, useEffect } from 'react';
import { PackagePlus, PackageMinus, X } from 'lucide-react';

const InventoryStockModal = ({ isOpen, onClose, onConfirm, medicineName, currentStock }) => {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (isOpen) setQuantity(1);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-black/10 dark:border-white/10">

                {/* Header */}
                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-text mb-1">Adjust Inventory</h3>
                        <p className="text-sm text-text-muted">
                            Update stock levels for <span className="font-semibold text-text">{medicineName}</span>.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted">Current Stock:</span>
                        <span className="font-semibold text-text">{currentStock} units</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Adjustment Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                            placeholder="Enter quantity..."
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col sm:flex-row items-center gap-3 rounded-b-2xl">
                    <button
                        onClick={() => {
                            if (quantity > 0) {
                                onConfirm(-quantity);
                                onClose();
                            }
                        }}
                        className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <PackageMinus className="w-4 h-4" /> Reduce Stock
                    </button>
                    <button
                        onClick={() => {
                            if (quantity > 0) {
                                onConfirm(quantity);
                                onClose();
                            }
                        }}
                        className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                        <PackagePlus className="w-4 h-4" /> Add Stock
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryStockModal;
