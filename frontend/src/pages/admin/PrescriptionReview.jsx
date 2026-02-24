import React from 'react';
import { Check, X, FileText, AlertCircle } from 'lucide-react';

const PrescriptionReview = () => {
    // Mock data for a single review task
    const mockOrder = {
        id: 'ORD-1023',
        customer: 'Emma Thompson',
        date: '2026-02-23 04:45 PM',
        medicines: [
            { name: 'Amoxicillin', dosage: '250mg', quantity: 14, notes: 'Take 1 capsule every 8 hours for 7 days' }
        ]
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text">Prescription Review</h1>
                    <p className="text-text-muted text-sm mt-1">Review {mockOrder.id} to authorize dispatch.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-card border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium">
                        <X className="w-4 h-4" /> Reject
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
                        <Check className="w-4 h-4" /> Approve Prescription
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Order Meta Data */}
                <div className="space-y-6">
                    <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Order Details
                        </h3>
                        <dl className="space-y-3 text-[14px]">
                            <div className="flex justify-between">
                                <dt className="text-text-muted">Customer Name</dt>
                                <dd className="font-medium text-text">{mockOrder.customer}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-text-muted">Order Date</dt>
                                <dd className="font-medium text-text">{mockOrder.date}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-text mb-4">Requested Medicines</h3>
                        <div className="space-y-4">
                            {mockOrder.medicines.map((med, idx) => (
                                <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                                    <div className="flex justify-between font-medium text-text">
                                        <span>{med.name} {med.dosage}</span>
                                        <span>Qty: {med.quantity}</span>
                                    </div>
                                    <p className="text-sm text-text-muted mt-2 bg-bg p-2 rounded border border-black/5 dark:border-white/5">
                                        {med.notes}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-700 dark:text-amber-400 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>Verify that the uploaded prescription matches the requested dosage and quantity exactly before approving.</p>
                    </div>
                </div>

                {/* Prescription Image Viewer */}
                <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-sm flex flex-col h-full min-h-[500px]">
                    <h3 className="font-semibold text-text mb-4 flex items-center justify-between">
                        Prescription Document
                        <span className="text-xs font-normal text-text-muted bg-bg px-2 py-1 rounded border border-black/5 dark:border-white/5">
                            scanned_rx_492.pdf
                        </span>
                    </h3>

                    <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 flex items-center justify-center p-4 relative overflow-hidden group">
                        {/* Mock Image Placeholder for Prescription */}
                        <div className="w-full h-full bg-white dark:bg-gray-800 rounded shadow-sm opacity-50 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <div className="text-center space-y-2 opacity-50">
                                <FileText className="w-12 h-12 mx-auto text-gray-400" />
                                <p className="text-sm text-gray-500 font-medium">Document Viewer</p>
                            </div>

                            {/* Abstract lines to simulate text */}
                            <div className="absolute inset-8 flex flex-col gap-4 opacity-20 hidden md:flex">
                                <div className="h-4 bg-gray-400 rounded w-1/3"></div>
                                <div className="h-2 bg-gray-400 rounded w-1/4"></div>
                                <div className="h-2 bg-gray-400 rounded w-1/2 mt-4"></div>
                                <div className="h-2 bg-gray-400 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-400 rounded w-2/3"></div>
                                <div className="h-12 bg-gray-400 rounded w-full mt-4"></div>
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-black text-text px-4 py-2 rounded-lg shadow-sm border border-black/10 text-sm font-medium">
                                Expand Image
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PrescriptionReview;
