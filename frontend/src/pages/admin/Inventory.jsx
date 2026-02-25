import React, { useEffect, useState } from 'react';
import { PackagePlus, Edit2, Loader2, Search, Filter } from 'lucide-react';
import { fetchInventory, restockMedicine } from '../../services/api';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

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

    const filteredInventory = inventory.filter((item) => {
        const matchesSearch =
            (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.pzn && item.pzn.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesFilter = true;
        if (filterStatus === 'low') matchesFilter = item.stock <= item.lowStockThreshold;
        if (filterStatus === 'healthy') matchesFilter = item.stock > item.lowStockThreshold;

        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Inventory Control</h1>
                <p className="text-text-muted text-sm mt-1">Manage medicine stock levels and configuration.</p>
            </div>

            {/* Custom Control Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-text-muted" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Medicine Name or PZN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-card border border-black/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                    />
                </div>
                <div className="relative min-w-[180px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-text-muted" />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 w-full bg-card border border-black/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-text"
                    >
                        <option value="all">All Inventory</option>
                        <option value="low">Low Stock Alerts</option>
                        <option value="healthy">Healthy Stock</option>
                    </select>
                </div>
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
                            {filteredInventory.length > 0 ? filteredInventory.map((item) => (
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
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-text-muted text-sm">
                                        No inventory matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
