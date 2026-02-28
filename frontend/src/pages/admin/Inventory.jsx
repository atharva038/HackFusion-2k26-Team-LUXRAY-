import { useCallback, useEffect, useState } from 'react';
import { Edit2, Loader2, Search, Filter, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchInventory, restockMedicine } from '../../services/api';
import InventoryStockModal from '../../components/ui/InventoryStockModal';
import { useSocket } from '../../context/SocketContext';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, item: null });

    const { on, off } = useSocket();

    const load = useCallback(() => {
        setLoading(true);
        fetchInventory().then(setInventory).catch(console.error).finally(() => setLoading(false));
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load(); }, [load]);

    // WebSocket listeners for real-time inventory updates
    useEffect(() => {
        const handleMedicineUpdated = (data) => {
            setInventory(prev =>
                prev.map(item =>
                    item._id === data.medicine._id
                        ? { ...item, ...data.medicine }
                        : item
                )
            );
        };

        const handleMedicineRestocked = (data) => {
            // Handles both restocks (positive qty) and dispatch deductions (negative qty)
            setInventory(prev =>
                prev.map(item =>
                    item._id === data.medicine._id
                        ? { ...item, stock: data.medicine.newStock }
                        : item
                )
            );
        };

        const handleLowStockAlert = (data) => {
            setInventory(prev =>
                prev.map(item =>
                    item._id === data.medicine._id
                        ? { ...item, stock: data.medicine.stock }
                        : item
                )
            );
        };

        on('inventory:medicine-updated', handleMedicineUpdated);
        on('inventory:medicine-restocked', handleMedicineRestocked);
        on('inventory:low-stock-alert', handleLowStockAlert);
        on('inventory:low-stock-manual-alert', () => {});

        return () => {
            off('inventory:medicine-updated', handleMedicineUpdated);
            off('inventory:medicine-restocked', handleMedicineRestocked);
            off('inventory:low-stock-alert', handleLowStockAlert);
            off('inventory:low-stock-manual-alert', () => {});
        };
    }, [on, off]);

    // ── Restock — no load() needed; socket event updates the row in real-time ──
    const handleRestockConfirm = async (qtyDelta) => {
        try {
            await restockMedicine(modalConfig.item._id, qtyDelta);
            // Socket event 'inventory:medicine-restocked' will update state
        } catch (err) { console.error(err); }
    };

    const triggerModal = (item) => {
        setModalConfig({ isOpen: true, item });
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

    // ── Live computed stats (update automatically on every socket event) ──
    const totalMedicines = inventory.length;
    const lowStockCount = inventory.filter(i => i.stock <= i.lowStockThreshold).length;
    const totalValue = inventory.reduce((sum, i) => sum + (i.stock * (i.price || 0)), 0);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Inventory Control</h1>
                <p className="text-text-muted text-sm mt-1">Manage medicine stock levels and configuration.</p>
            </div>

            {/* ── Real-time Stats Bar ── */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Medicines</p>
                        <p className="text-xl font-bold text-text">{totalMedicines}</p>
                    </div>
                </div>
                <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${lowStockCount > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
                        <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-amber-500' : 'text-green-500'}`} />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Low Stock</p>
                        <p className={`text-xl font-bold ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                            {lowStockCount}
                        </p>
                    </div>
                </div>
                <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Value</p>
                        <p className="text-xl font-bold text-text">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            </div>

            {/* Custom Control Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
                <div className="relative grow">
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
                <div className="relative min-w-45">
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
                    <table className="w-full text-left border-collapse min-w-200">
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
                                <tr key={item._id} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors text-[14px]">
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
                                        <button onClick={() => triggerModal(item)} className="p-1.5 rounded-md hover:bg-primary/10 text-text-muted hover:text-primary transition-colors" title="Adjust Stock">
                                            <Edit2 className="w-4 h-4" />
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

            <InventoryStockModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleRestockConfirm}
                medicineName={modalConfig.item?.name}
                currentStock={modalConfig.item?.stock}
            />
        </div>
    );
};

export default Inventory;
