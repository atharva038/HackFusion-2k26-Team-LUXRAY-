import React, { useEffect, useState } from 'react';
import { Check, X, FileText, AlertCircle, Loader2, Search, Filter } from 'lucide-react';
import { fetchPrescriptions, updatePrescription } from '../../services/api';
import ActionModal from '../../components/ui/ActionModal';

const PrescriptionReview = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null, approvedStatus: false, type: 'warning' });

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
            message: approved ? 'Are you sure you want to approve this prescription and authorize dispensing?' : 'Are you sure you want to reject this prescription? The order will be halted.',
            type: approved ? 'approve' : 'reject',
            color: approved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
        });
    };

    const filteredPrescriptions = prescriptions.filter((rx) => {
        const matchesSearch =
            (rx.user?.name && rx.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (rx.medicine?.name && rx.medicine.name.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesFilter = true;
        if (filterStatus === 'approved') matchesFilter = rx.approved === true;
        if (filterStatus === 'pending') matchesFilter = rx.approved === false;

        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Prescription Review</h1>
                <p className="text-text-muted text-sm mt-1">Review and authorize prescription-based orders.</p>
            </div>

            {/* Custom Control Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card border border-black/5 dark:border-white/5 p-4 rounded-xl shadow-sm">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Patient or Medicine..."
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
                {/* List */}
                <div className="lg:col-span-1 bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                    <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 shrink-0">
                        <h3 className="font-semibold text-text text-sm">Filtered Prescriptions ({filteredPrescriptions.length})</h3>
                    </div>
                    <div className="divide-y divide-black/5 dark:divide-white/5 overflow-y-auto flex-grow">
                        {filteredPrescriptions.length > 0 ? filteredPrescriptions.map((rx) => (
                            <button key={rx._id} onClick={() => setSelected(rx)}
                                className={`w-full text-left px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${selected?._id === rx._id ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-text text-[14px]">{rx.user?.name || 'N/A'}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${rx.approved ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'}`}>
                                        {rx.approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                                <p className="text-text-muted text-xs mt-1.5 truncate">{rx.medicine?.name || 'Unknown Medicine'}</p>
                            </button>
                        )) : (
                            <div className="p-8 text-center text-text-muted text-sm">No prescriptions found.</div>
                        )}
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
                                        <button onClick={() => triggerModal(selected._id, false)} className="flex items-center gap-2 px-4 py-2 bg-card border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium">
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                        <button onClick={() => triggerModal(selected._id, true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
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
