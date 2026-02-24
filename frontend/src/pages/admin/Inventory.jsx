import React, { useEffect, useState } from 'react';
import { PackagePlus, Edit2, Loader2 } from 'lucide-react';
import { fetchInventory, restockMedicine } from '../../services/api';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        fetchInventory().then(setInventory).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleRestock = async (id) => {
        const qty = prompt('Enter restock quantity:');
        if (!qty || isNaN(qty) || Number(qty) <= 0) return;
        try {
            await restockMedicine(id, Number(qty));
            load();
        } catch (err) { console.error(err); }
    };

    const getStockStatusColor = (stock, threshold) => {
        if (stock <= threshold * 0.2) return 'text-red-600 dark:text-red-400 font-semibold';
        if (stock <= threshold) return 'text-amber-600 dark:text-amber-400 font-semibold';
        return 'text-green-600 dark:text-green-400 font-medium';
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Inventory Control</h1>
                <p className="text-text-muted text-sm mt-1">Manage medicine stock levels and configuration.</p>
            </div>

            <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Medicine</th>
                                <th className="px-6 py-4 font-semibold">PZN</th>
                                <th className="px-6 py-4 font-semibold">Price (₹)</th>
                                <th className="px-6 py-4 font-semibold">Current Stock</th>
                                <th className="px-6 py-4 font-semibold">Threshold</th>
                                <th className="px-6 py-4 font-semibold">Rx</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {inventory.map((item) => (
                                <tr key={item._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[14px]">
                                    <td className="px-6 py-4 font-medium text-text">{item.name}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-text-muted">{item.pzn}</td>
                                    <td className="px-6 py-4 text-text-muted">₹{item.price}</td>
                                    <td className={`px-6 py-4 ${getStockStatusColor(item.stock, item.lowStockThreshold)}`}>
                                        {item.stock} {item.unitType}s
                                    </td>
                                    <td className="px-6 py-4 text-text-muted">{item.lowStockThreshold}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${item.prescriptionRequired ? 'bg-primary/10 text-primary' : 'bg-black/5 text-text-muted'}`}>
                                            {item.prescriptionRequired ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleRestock(item._id)} className="p-1.5 rounded-md hover:bg-green-500/10 text-text-muted hover:text-green-600 transition-colors" title="Restock">
                                            <PackagePlus className="w-4 h-4" />
                                        </button>
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
