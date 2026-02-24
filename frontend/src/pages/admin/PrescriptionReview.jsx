import React, { useEffect, useState } from 'react';
import { Check, X, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { fetchPrescriptions, updatePrescription } from '../../services/api';

const PrescriptionReview = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    const load = () => {
        setLoading(true);
        fetchPrescriptions().then((data) => {
            setPrescriptions(data);
            // Auto-select first pending one
            const pending = data.find(p => !p.approved);
            setSelected(pending || data[0] || null);
        }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleAction = async (id, approved) => {
        try {
            await updatePrescription(id, { approved });
            load();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Prescription Review</h1>
                <p className="text-text-muted text-sm mt-1">Review and authorize prescription-based orders.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-1 bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-black/5 dark:border-white/5">
                        <h3 className="font-semibold text-text text-sm">All Prescriptions ({prescriptions.length})</h3>
                    </div>
                    <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[500px] overflow-y-auto">
                        {prescriptions.map((rx) => (
                            <button key={rx._id} onClick={() => setSelected(rx)}
                                className={`w-full text-left px-5 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${selected?._id === rx._id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-text text-sm">{rx.user?.name || 'N/A'}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${rx.approved ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'}`}>
                                        {rx.approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                                <p className="text-text-muted text-xs mt-1">{rx.medicine?.name || 'Unknown Medicine'}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-2 space-y-5">
                    {selected ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-text">Prescription Details</h2>
                                {!selected.approved && (
                                    <div className="flex gap-3">
                                        <button onClick={() => handleAction(selected._id, false)} className="flex items-center gap-2 px-4 py-2 bg-card border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium">
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                        <button onClick={() => handleAction(selected._id, true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
                                            <Check className="w-4 h-4" /> Approve
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-sm">
                                <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Details
                                </h3>
                                <dl className="space-y-3 text-[14px]">
                                    <div className="flex justify-between"><dt className="text-text-muted">Patient</dt><dd className="font-medium text-text">{selected.user?.name}</dd></div>
                                    <div className="flex justify-between"><dt className="text-text-muted">Medicine</dt><dd className="font-medium text-text">{selected.medicine?.name}</dd></div>
                                    <div className="flex justify-between"><dt className="text-text-muted">Valid Until</dt><dd className="font-medium text-text">{selected.validUntil ? new Date(selected.validUntil).toLocaleDateString() : 'N/A'}</dd></div>
                                    <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd className="font-medium text-text">{selected.approved ? '✅ Approved' : '⏳ Pending'}</dd></div>
                                </dl>
                            </div>

                            {!selected.approved && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-700 dark:text-amber-400 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>Verify that the prescription matches the requested medicine before approving.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-text-muted">Select a prescription to review.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrescriptionReview;
