import React from 'react';
import { motion } from 'framer-motion';
import { Pill, User, Stethoscope, Building2, Clock, Calendar, AlertCircle, Hash } from 'lucide-react';

/**
 * PrescriptionCard — renders extracted prescription data as a premium card inside the chat.
 * Displayed inside MessageBubble when message.prescriptionData is present.
 */
const PrescriptionCard = ({ data }) => {
    if (!data || !data.medications || data.medications.length === 0) return null;

    // Try to extract doctor/hospital from first medicine that has it
    const firstMed = data.medications[0] || {};
    const doctorName = firstMed.doctor_name || 'Unknown Doctor';
    const hospitalName = firstMed.hospital_name || '';
    const patientName = firstMed.user_name || '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-sm mt-2"
        >
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-glass backdrop-blur-xl shadow-[0_8px_32px_rgba(6,182,212,0.15)] group">
                {/* Header */}
                <div className="px-5 py-4 bg-cyan-900/10 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            <Pill className="w-4 h-4 text-cyan-400" />
                        </div>
                        <h3 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">Prescription Extracted</h3>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                        {doctorName && doctorName !== 'Unknown Doctor' && (
                            <span className="flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" />
                                {doctorName}
                            </span>
                        )}
                        {hospitalName && (
                            <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {hospitalName}
                            </span>
                        )}
                        {patientName && (
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {patientName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Medicines List */}
                <div className="px-5 py-3 space-y-3">
                    {data.medications.map((med, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.3 }}
                            className="flex gap-3 py-2 border-b border-black/[0.03] dark:border-white/[0.03] last:border-0"
                        >
                            <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center mt-0.5 border border-cyan-500/20 shadow-sm">
                                <span className="text-xs font-bold text-cyan-400">{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text leading-tight">
                                    {med.medi_name || med.name || 'Unknown Medicine'}
                                </p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-text-muted">
                                    {med.dosage && (
                                        <span className="flex items-center gap-1">
                                            <Pill className="w-3 h-3 opacity-50" />
                                            {med.dosage}
                                        </span>
                                    )}
                                    {med.total_quantity != null && (
                                        <span className="flex items-center gap-1">
                                            <Hash className="w-3 h-3 opacity-50" />
                                            Qty: {med.total_quantity}
                                        </span>
                                    )}
                                    {med.frequency && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 opacity-50" />
                                            {med.frequency}
                                        </span>
                                    )}
                                    {med.duration_days && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 opacity-50" />
                                            {med.duration_days} days
                                        </span>
                                    )}
                                </div>
                                {med.instructions && (
                                    <p className="text-xs text-text-muted/70 mt-0.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 opacity-40" />
                                        {med.instructions}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-green-500/5 border-t border-green-500/10">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {data.medications.length} medicine{data.medications.length > 1 ? 's' : ''} extracted • Saved to your profile
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default PrescriptionCard;
