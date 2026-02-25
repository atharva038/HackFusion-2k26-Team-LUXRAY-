import React from 'react';
import { AlertCircle, X, AlertTriangle, CheckCircle, Truck, PackagePlus } from 'lucide-react';

const ACTION_ICONS = {
    approve: <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />,
    reject: <X className="w-6 h-6 text-red-600 dark:text-red-400" />,
    dispatch: <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    restock: <PackagePlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    notify: <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
};

const ActionModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    confirmColorClass = "bg-primary hover:bg-primary/90 text-white",
    iconType = "warning"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-black/10 dark:border-white/10">

                {/* Header */}
                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex items-start gap-4">
                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-full shrink-0">
                        {ACTION_ICONS[iconType] || ACTION_ICONS.warning}
                    </div>
                    <div className="flex-grow pt-1">
                        <h3 className="text-lg font-bold text-text mb-1">{title}</h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${confirmColorClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;
