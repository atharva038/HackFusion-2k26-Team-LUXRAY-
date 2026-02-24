import React, { useState } from 'react';
import { PackagePlus, Edit2 } from 'lucide-react';

const Inventory = () => {
    const [inventory] = useState([
        { id: 1, name: 'Amoxicillin', dosage: '250mg', stock: 120, threshold: 50, requiresRx: true },
        { id: 2, name: 'Lisinopril', dosage: '10mg', stock: 45, threshold: 50, requiresRx: true },
        { id: 3, name: 'Ibuprofen', dosage: '400mg', stock: 850, threshold: 200, requiresRx: false },
        { id: 4, name: 'Metformin', dosage: '500mg', stock: 15, threshold: 100, requiresRx: true },
        { id: 5, name: 'Atorvastatin', dosage: '20mg', stock: 320, threshold: 100, requiresRx: true },
    ]);

    const getStockStatusColor = (stock, threshold) => {
        if (stock <= threshold * 0.2) return 'text-red-600 dark:text-red-400 font-semibold';
        if (stock <= threshold) return 'text-amber-600 dark:text-amber-400 font-semibold';
        return 'text-green-600 dark:text-green-400 font-medium';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text">Inventory Control</h1>
                    <p className="text-text-muted text-sm mt-1">Manage medicine stock levels and configuration.</p>
                </div>
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Medicine</th>
                                <th className="px-6 py-4 font-semibold">Dosage</th>
                                <th className="px-6 py-4 font-semibold">Current Stock</th>
                                <th className="px-6 py-4 font-semibold">Alert Threshold</th>
                                <th className="px-6 py-4 font-semibold">Rx Required</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {inventory.map((item) => (
                                <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-medium text-text">{item.name}</td>
                                    <td className="px-6 py-4 text-text-muted">{item.dosage}</td>
                                    <td className={`px-6 py-4 ${getStockStatusColor(item.stock, item.threshold)}`}>
                                        {item.stock} units
                                    </td>
                                    <td className="px-6 py-4 text-text-muted">{item.threshold} units</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${item.requiresRx ? 'bg-primary/10 text-primary' : 'bg-black/5 text-text-muted'}`}>
                                            {item.requiresRx ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text transition-colors" title="Edit Item">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 rounded-md hover:bg-green-500/10 text-text-muted hover:text-green-600 transition-colors" title="Restock">
                                                <PackagePlus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
