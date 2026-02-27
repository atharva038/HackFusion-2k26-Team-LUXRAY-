import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Loader2, Plus, Calendar, Stethoscope } from 'lucide-react';
import { fetchUserPrescriptions } from '../../services/api';

const PrescriptionSelectorModal = ({ isOpen, onClose, onSelect, onUploadNew }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchUserPrescriptions()
                .then(data => {
                    const allUploads = data
                        .flatMap((rx) =>
                            (rx.prescriptions || []).map((entry) => ({
                                ...entry,
                                recordId: rx._id,
                                approved: rx.approved,
                            }))
                        )
                        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                    setPrescriptions(allUploads);
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/5 flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-text">Prescription Required</h2>
                                <p className="text-xs text-text-muted">Select a valid prescription to continue your order</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="w-4 h-4 text-text-muted" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm">Loading your prescriptions...</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {!loading && !error && prescriptions.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-text-muted opacity-50" />
                                </div>
                                <h3 className="text-base font-medium text-text mb-1">No Prescriptions Found</h3>
                                <p className="text-sm text-text-muted mb-6">You don't have any prescriptions on file yet.</p>
                            </div>
                        )}

                        {!loading && !error && prescriptions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {prescriptions.map((px) => {
                                    const meds = px.extractedData || [];
                                    const firstMed = meds[0] || {};
                                    return (
                                        <div
                                            key={px.uploadedAt}
                                            onClick={() => onSelect(px)}
                                            className="group relative rounded-2xl border border-black/5 dark:border-white/5 p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex flex-col gap-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                                    {px.imageUrl ? (
                                                        <img src={px.imageUrl} alt="Prescription snippet" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FileText className="w-full h-full p-4 text-text-muted opacity-50" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-text truncate">
                                                        {firstMed.medi_name || 'Uploaded Prescription'}
                                                        {meds.length > 1 && ` +${meds.length - 1} more`}
                                                    </h4>
                                                    <div className="flex flex-col gap-1 mt-1 text-xs text-text-muted">
                                                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(px.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        {firstMed.doctor_name && firstMed.doctor_name !== 'Unknown Doctor' && (
                                                            <span className="flex items-center gap-1.5 truncate"><Stethoscope className="w-3 h-3 shrink-0" /> {firstMed.doctor_name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${px.approved ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'}`}>
                                                    {px.approved ? 'Verified' : 'Pending'}
                                                </span>
                                                <span className="text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Select →
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex border-t border-black/5 dark:border-white/5 -mx-6 px-6 pt-6">
                            <button
                                onClick={onUploadNew}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Upload New Prescription
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default PrescriptionSelectorModal;
