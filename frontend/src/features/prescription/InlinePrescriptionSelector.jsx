import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Plus, Calendar, Stethoscope } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { fetchUserPrescriptions } from '../../services/api';

const InlinePrescriptionSelector = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasSelected, setHasSelected] = useState(false);

    // Grab the injected chat actions from the global store
    const { addMessage } = useAppStore();
    const chatActions = useAppStore.getState().chatActions;

    useEffect(() => {
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
    }, []);

    const handleUploadNew = () => {
        if (!chatActions || hasSelected) return;
        setHasSelected(true);
        chatActions.setShowPrescriptionModal(true);
    };

    const handleSelect = (prescription) => {
        if (!chatActions || hasSelected) return;
        setHasSelected(true);

        addMessage({
            id: Date.now(),
            role: 'user',
            text: '📎 Selected an existing prescription',
            imagePreview: prescription.imageUrl,
        });

        // Simulate the handlePrescriptionResult flow but skip OCR
        const meds = prescription.extractedData || [];
        const medNames = meds.map(m => m.medi_name).filter(Boolean);

        addMessage({
            id: Date.now() + 1,
            role: 'ai',
            text: '📄 Prescription linked. Sending to the pharmacy agent for validation…',
            tools: [
                { icon: 'success', text: 'Prescription Selected', status: 'success' },
            ],
            prescriptionData: {
                medications: meds,
                imageUrl: prescription.imageUrl,
                recordId: prescription.recordId || prescription._id,
            },
        });

        // Resume AI context
        const agentMessage = `I have selected my prescription from file. Please validate it against my current order by triggering the check_prescription_on_file tool.`;
        chatActions.processSend(agentMessage);
    };

    if (hasSelected) return null; // Hide the selector once an action is taken

    return (
        <div className="mt-4 flex flex-col gap-3 w-full animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-text">Select Prescription</span>
            </div>

            {loading && (
                <div className="flex items-center gap-3 py-3 text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm">Loading your prescriptions...</span>
                </div>
            )}

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="flex flex-col gap-2.5">
                    {/* Horizontal scrollable list for prescriptions */}
                    {prescriptions.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                            {prescriptions.map((px) => {
                                const meds = px.extractedData || [];
                                const firstMed = meds[0] || {};
                                return (
                                    <div
                                        key={px.uploadedAt}
                                        onClick={() => handleSelect(px)}
                                        className="snap-start shrink-0 w-[240px] group relative rounded-xl bg-card border border-black/5 dark:border-white/5 p-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col gap-2"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                                {px.imageUrl ? (
                                                    <img src={px.imageUrl} alt="Prescription snippet" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FileText className="w-full h-full p-2.5 text-text-muted opacity-50" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[13px] font-semibold text-text truncate">
                                                    {firstMed.medi_name || 'Prescription'}
                                                    {meds.length > 1 && ` +${meds.length - 1} more`}
                                                </h4>
                                                <div className="flex flex-col gap-0.5 mt-0.5 text-[11px] text-text-muted">
                                                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {new Date(px.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    {firstMed.doctor_name && firstMed.doctor_name !== 'Unknown Doctor' && (
                                                        <span className="flex items-center gap-1 truncate"><Stethoscope className="w-2.5 h-2.5 shrink-0" /> {firstMed.doctor_name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-1 pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${px.approved ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'}`}>
                                                {px.approved ? 'Verified' : 'Pending'}
                                            </span>
                                            <span className="text-primary text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                Select →
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-3 text-sm text-text-muted bg-black/5 dark:bg-white/5 rounded-xl text-center">
                            No prescriptions on file.
                        </div>
                    )}

                    {/* Upload New Button */}
                    <button
                        onClick={handleUploadNew}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text text-sm font-medium transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/5"
                    >
                        <Plus className="w-4 h-4" />
                        Upload New Prescription
                    </button>
                </div>
            )}
        </div>
    );
};

export default InlinePrescriptionSelector;
