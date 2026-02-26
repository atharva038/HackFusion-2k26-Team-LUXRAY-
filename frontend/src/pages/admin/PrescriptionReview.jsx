import React, { useEffect, useState } from 'react';
import {
    Check, X, FileText, AlertCircle, Loader2,
    Search, Filter, Pill, Stethoscope, Building2,
    Calendar, Clock, Hash, User, ImageOff, ChevronDown, ChevronUp
} from 'lucide-react';
import { fetchPrescriptions, updatePrescription } from '../../services/api';
import ActionModal from '../../components/ui/ActionModal';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Return the MOST RECENT sub-prescription entry (last in the array) */
const latestRx = (rx) => {
    const arr = rx?.prescriptions;
    return arr && arr.length > 0 ? arr[arr.length - 1] : null;
};

/** All unique medicine names across all uploads */
const allMedicineNames = (rx) => {
    const names = new Set();
    (rx?.prescriptions || []).forEach(p =>
        (p.extractedData || []).forEach(m => { if (m.medi_name) names.add(m.medi_name); })
    );
    return [...names];
};

/** Most recent upload date (formatted) */
const latestUploadDate = (rx) => {
    const entry = latestRx(rx);
    return entry?.uploadedAt
        ? new Date(entry.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
};

// ── Sub-component: Medicine Row ────────────────────────────────────────────

const MedicineRow = ({ med, index }) => (
    <div className="flex gap-3 py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text leading-tight">{med.medi_name || 'Unknown'}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-text-muted">
                {med.dosage && (
                    <span className="flex items-center gap-1">
                        <Pill className="w-3 h-3 opacity-50" /> {med.dosage}
                    </span>
                )}
                {med.total_quantity != null && (
                    <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 opacity-50" /> Qty: {med.total_quantity}
                    </span>
                )}
                {med.frequency && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-50" /> {med.frequency}
                    </span>
                )}
                {med.duration_days && (
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 opacity-50" /> {med.duration_days} days
                    </span>
                )}
            </div>
            {med.instructions && (
                <p className="text-xs text-text-muted/70 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 opacity-40" /> {med.instructions}
                </p>
            )}
        </div>
    </div>
);

// ── Sub-component: Prescription Upload Block ───────────────────────────────
// One prescription record can have multiple upload entries

const UploadBlock = ({ entry, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    const allMeds = entry.extractedData || [];
    const firstMed = allMeds[0] || {};

    return (
        <div className="border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
            {/* Collapsible header */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text truncate">
                            {firstMed.medi_name || 'Prescription Upload'}
                            {allMeds.length > 1 && ` +${allMeds.length - 1} more`}
                        </p>
                        <p className="text-xs text-text-muted">
                            Uploaded {entry.uploadedAt ? new Date(entry.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                    </div>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
            </button>

            {open && (
                <div className="px-4 pb-4 pt-3 space-y-4">
                    {/* Prescription Image */}
                    <div className="w-full rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                        {entry.imageUrl ? (
                            <img
                                src={entry.imageUrl}
                                alt="Prescription"
                                className="w-full max-h-72 object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 gap-2 text-text-muted">
                                <ImageOff className="w-8 h-8 opacity-30" />
                                <span className="text-xs">No image available</span>
                            </div>
                        )}
                    </div>

                    {/* Doctor / Hospital */}
                    {(firstMed.doctor_name || firstMed.hospital_name) && (
                        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                            {firstMed.doctor_name && firstMed.doctor_name !== 'Unknown Doctor' && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10 text-primary">
                                    <Stethoscope className="w-3 h-3" /> {firstMed.doctor_name}
                                </span>
                            )}
                            {firstMed.hospital_name && firstMed.hospital_name !== 'General Hospital' && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                    <Building2 className="w-3 h-3" /> {firstMed.hospital_name}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Medicines */}
                    {allMeds.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Extracted Medicines</p>
                            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                                {allMeds.map((med, i) => (
                                    <MedicineRow key={i} med={med} index={i} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────────────────────

const PrescriptionReview = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    const load = () => {
        setLoading(true);
        fetchPrescriptions()
            .then((data) => {
                setPrescriptions(data);
                const pending = data.find(p => !p.approved);
                setSelected(pending || data[0] || null);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleActionConfirm = async () => {
        try {
            await updatePrescription(modalConfig.id, { approved: modalConfig.approvedStatus });
            load();
        } catch (err) { console.error(err); }
    };

    const triggerModal = (id, approved) => {
        setModalConfig({
            isOpen: true,
            id,
            approvedStatus: approved,
            title: approved ? 'Approve Prescription' : 'Reject Prescription',
            message: approved
                ? 'Are you sure you want to approve this prescription and authorize dispensing?'
                : 'Are you sure you want to reject this prescription? The order will be halted.',
            type: approved ? 'approve' : 'reject',
            color: approved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
        });
    };

    const filteredPrescriptions = prescriptions.filter((rx) => {
        const patientName = (rx.user?.name || '').toLowerCase();
        const medNames = allMedicineNames(rx).join(' ').toLowerCase();
        const matchesSearch = patientName.includes(searchTerm.toLowerCase()) || medNames.includes(searchTerm.toLowerCase());
        let matchesFilter = true;
        if (filterStatus === 'approved') matchesFilter = rx.approved === true;
        if (filterStatus === 'pending') matchesFilter = rx.approved === false;
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Prescription Review</h1>
                <p className="text-text-muted text-sm mt-1">Review and authorize prescription-based orders.</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card border border-black/5 dark:border-white/5 p-4 rounded-xl shadow-sm">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by patient or medicine…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text transition-all"
                    />
                </div>
                <div className="relative min-w-[180px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-text-muted" />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-text transition-all"
                    >
                        <option value="all">All Prescriptions</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left: List ───────────────────────────────────── */}
                <div className="lg:col-span-1 bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[680px]">
                    <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 shrink-0">
                        <h3 className="font-semibold text-text text-sm">
                            Prescriptions ({filteredPrescriptions.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-black/5 dark:divide-white/5 overflow-y-auto flex-grow">
                        {filteredPrescriptions.length > 0 ? filteredPrescriptions.map((rx) => (
                            <button
                                key={rx._id}
                                onClick={() => setSelected(rx)}
                                className={`w-full text-left px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors
                                    ${selected?._id === rx._id
                                        ? 'bg-primary/5 border-l-2 border-primary'
                                        : 'border-l-2 border-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-text text-[14px] truncate">
                                            {rx.user?.name || 'Unknown Patient'}
                                        </p>
                                        {rx.user?.email && (
                                            <p className="text-text-muted/60 text-[11px] truncate">{rx.user.email}</p>
                                        )}
                                        <p className="text-text-muted text-xs mt-1 truncate flex items-center gap-1">
                                            <Pill className="w-3 h-3 opacity-50 shrink-0" />
                                            {allMedicineNames(rx).slice(0, 2).join(', ') || 'No medicines extracted'}
                                            {allMedicineNames(rx).length > 2 && ` +${allMedicineNames(rx).length - 2}`}
                                        </p>
                                        <p className="text-text-muted/60 text-xs mt-0.5 flex items-center gap-1">
                                            <Calendar className="w-3 h-3 opacity-40 shrink-0" />
                                            {latestUploadDate(rx)}
                                            {rx.prescriptions?.length > 1 && (
                                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                                                    {rx.prescriptions.length} uploads
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border whitespace-nowrap
                                        ${rx.approved
                                            ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                        }`}>
                                        {rx.approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                            </button>
                        )) : (
                            <div className="p-8 text-center text-text-muted text-sm">No prescriptions found.</div>
                        )}
                    </div>
                </div>

                {/* ── Right: Detail Panel ──────────────────────────── */}
                <div className="lg:col-span-2 space-y-5 overflow-y-auto max-h-[680px] pr-1">
                    {selected ? (
                        <>
                            {/* Header row */}
                            <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 bg-bg pt-1 pb-2 z-10">
                                <div>
                                    <h2 className="font-semibold text-text text-base">
                                        {selected.user?.name || 'Unknown Patient'}
                                    </h2>
                                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Valid until: {selected.validUntil ? new Date(selected.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        <span className="mx-2 opacity-30">·</span>
                                        <span className={`font-medium ${selected.approved ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {selected.approved ? '✅ Approved' : '⏳ Pending Review'}
                                        </span>
                                    </p>
                                </div>
                                {!selected.approved && (
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => triggerModal(selected._id, false)}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                        <button
                                            onClick={() => triggerModal(selected._id, true)}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                                        >
                                            <Check className="w-4 h-4" /> Approve
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Warning banner for pending */}
                            {!selected.approved && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-700 dark:text-amber-400 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>Verify that the prescription image and extracted medicines match the requested order before approving.</p>
                                </div>
                            )}

                            {/* Patient info row */}
                            <div className="flex flex-wrap gap-3 text-xs">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-black/5 dark:border-white/5 text-text-muted">
                                    <User className="w-3.5 h-3.5" /> {selected.user?.name || '—'}
                                </span>
                                {selected.user?.email && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-black/5 dark:border-white/5 text-text-muted">
                                        {selected.user.email}
                                    </span>
                                )}
                            </div>

                            {/* Upload entries — newest first, first one open by default */}
                            {selected.prescriptions && selected.prescriptions.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                                        Upload History ({selected.prescriptions.length} upload{selected.prescriptions.length > 1 ? 's' : ''})
                                    </p>
                                    {[...selected.prescriptions].reverse().map((entry, idx) => (
                                        <UploadBlock key={idx} entry={entry} defaultOpen={idx === 0} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 gap-2 text-text-muted border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                                    <ImageOff className="w-8 h-8 opacity-30" />
                                    <p className="text-sm">No prescription uploads found.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-text-muted">
                            Select a prescription to review.
                        </div>
                    )}
                </div>
            </div>

            <ActionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleActionConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                iconType={modalConfig.type}
                confirmColorClass={modalConfig.color}
            />
        </div>
    );
};

export default PrescriptionReview;
