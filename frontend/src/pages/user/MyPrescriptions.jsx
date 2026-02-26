import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Loader2, Eye, Download, MessageSquarePlus, X,
    Pill, Stethoscope, Building2, Hash, ImageOff
} from 'lucide-react';
import Header from '../../components/layout/Header';
import { fetchUserPrescriptions } from '../../services/api';
import useAppStore from '../../store/useAppStore';

const getPrescriptionStatusColor = (approved) =>
    approved
        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';

const ImageModal = ({ imageUrl, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
    >
        <div
            className="relative max-w-3xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
        >
            <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors cursor-pointer"
            >
                <X className="w-4 h-4" />
            </button>
            <img src={imageUrl} alt="Prescription" className="w-full max-h-[80vh] object-contain" />
        </div>
    </div>
);

const PrescriptionUploadEntry = ({ entry, index, onView, onDownload, onUseForOrder }) => {
    const meds = entry.extractedData || [];
    const firstMed = meds[0] || {};

    return (
        <div className="bg-card border border-black/5 dark:border-white/5 rounded-2xl shadow-soft p-5 flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-text truncate max-w-[140px]">
                            {firstMed.medi_name || 'Prescription Upload'}
                            {meds.length > 1 && ` +${meds.length - 1} more`}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                            {entry.uploadedAt
                                ? new Date(entry.uploadedAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })
                                : '—'}
                        </p>
                    </div>
                </div>
                <span className={`shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border whitespace-nowrap ${getPrescriptionStatusColor(entry.approved)}`}>
                    {entry.approved ? 'Verified' : 'Pending'}
                </span>
            </div>

            {/* Prescription image thumbnail */}
            <div className="w-full rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                {entry.imageUrl ? (
                    <img
                        src={entry.imageUrl}
                        alt="Prescription"
                        className="w-full max-h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onView(entry.imageUrl)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-24 gap-2 text-text-muted">
                        <ImageOff className="w-6 h-6 opacity-30" />
                        <span className="text-xs">No image</span>
                    </div>
                )}
            </div>

            {/* Doctor/Hospital chips */}
            {(firstMed.doctor_name || firstMed.hospital_name) && (
                <div className="flex flex-wrap gap-2 text-xs">
                    {firstMed.doctor_name && firstMed.doctor_name !== 'Unknown Doctor' && (
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 text-primary">
                            <Stethoscope className="w-3 h-3" /> {firstMed.doctor_name}
                        </span>
                    )}
                    {firstMed.hospital_name && firstMed.hospital_name !== 'General Hospital' && (
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-text-muted">
                            <Building2 className="w-3 h-3" /> {firstMed.hospital_name}
                        </span>
                    )}
                </div>
            )}

            {/* Extracted medicines */}
            {meds.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Extracted Medicines
                    </p>
                    <div className="space-y-1.5">
                        {meds.map((med, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-text font-medium truncate">{med.medi_name || '—'}</span>
                                <span className="text-text-muted text-xs ml-2 flex items-center gap-2 shrink-0">
                                    {med.dosage && (
                                        <span className="flex items-center gap-1">
                                            <Pill className="w-3 h-3" />{med.dosage}
                                        </span>
                                    )}
                                    {med.total_quantity != null && (
                                        <span className="flex items-center gap-1">
                                            <Hash className="w-3 h-3" />{med.total_quantity}
                                        </span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5 flex-wrap">
                <button
                    onClick={() => onView(entry.imageUrl)}
                    disabled={!entry.imageUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-text-muted hover:text-text text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button
                    onClick={() => onDownload(entry.imageUrl, index)}
                    disabled={!entry.imageUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-text-muted hover:text-text text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                    onClick={() => onUseForOrder(entry)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                    <MessageSquarePlus className="w-3.5 h-3.5" /> Use for New Order
                </button>
            </div>
        </div>
    );
};

const MyPrescriptions = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewImageUrl, setViewImageUrl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        fetchUserPrescriptions()
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Flatten all upload entries from all prescription documents, newest first
    const allUploads = data
        .flatMap((rx) =>
            (rx.prescriptions || []).map((entry) => ({
                ...entry,
                approved: rx.approved,
                validUntil: rx.validUntil,
            }))
        )
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    const overallApproved = data.length > 0 ? data[0]?.approved : null;

    const handleView = (imageUrl) => setViewImageUrl(imageUrl);

    const handleDownload = (imageUrl, index) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `prescription-${index + 1}.jpg`;
        link.target = '_blank';
        link.click();
    };

    const handleUseForOrder = (entry) => {
        const meds = entry.extractedData || [];
        const medNames = meds
            .map(m => m.medi_name)
            .filter(Boolean)
            .join(', ');
        const msg = medNames
            ? `I have a prescription on file. I'd like to order: ${medNames}. Please help me place an order.`
            : `I have a prescription on file. Please help me place a new order using it.`;

        // Pass both the message and the rich prescription data to the chat
        useAppStore.getState().setPendingChatMessage(msg);
        useAppStore.getState().setPendingPrescription({
            imageUrl: entry.imageUrl,
            medications: meds
        });
        navigate('/');
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg text-text transition-colors duration-500">
            <Header />
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-3">
                            <FileText className="w-6 h-6 text-primary" />
                            My Prescriptions
                        </h1>
                        <p className="text-text-muted text-sm mt-1">
                            Your prescription history and uploaded documents.
                        </p>
                    </div>
                    {overallApproved !== null && (
                        <span className={`shrink-0 text-xs px-3 py-1 rounded-full font-semibold border ${getPrescriptionStatusColor(overallApproved)}`}>
                            {overallApproved ? 'Verified' : 'Pending Review'}
                        </span>
                    )}
                </div>

                {loading && (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-sm text-center py-8">{error}</div>
                )}

                {!loading && !error && allUploads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-4">
                        <FileText className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-medium">No prescriptions uploaded yet.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            Go to Chat to Upload
                        </button>
                    </div>
                )}

                {!loading && !error && allUploads.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {allUploads.map((entry, i) => (
                            <PrescriptionUploadEntry
                                key={`${i}-${entry.uploadedAt}`}
                                entry={entry}
                                index={i}
                                onView={handleView}
                                onDownload={handleDownload}
                                onUseForOrder={handleUseForOrder}
                            />
                        ))}
                    </div>
                )}
            </main>

            {viewImageUrl && (
                <ImageModal imageUrl={viewImageUrl} onClose={() => setViewImageUrl(null)} />
            )}
        </div>
    );
};

export default MyPrescriptions;
