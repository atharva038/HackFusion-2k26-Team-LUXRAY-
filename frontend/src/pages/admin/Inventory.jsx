import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Loader2, Search, Filter, Package, AlertTriangle, TrendingUp, Plus, X, Trash2, Upload, Download } from 'lucide-react';
import { fetchInventory, restockMedicine, addMedicine, deleteMedicine } from '../../services/api';
import InventoryStockModal from '../../components/ui/InventoryStockModal';
import { useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, item: null });
    const [addModal, setAddModal] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '', pzn: '', price: '', stock: '', unitType: 'tablet',
        description: '', prescriptionRequired: false, lowStockThreshold: '10',
    });
    const [addError, setAddError] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Excel features
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

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
        on('inventory:low-stock-manual-alert', () => { });

        return () => {
            off('inventory:medicine-updated', handleMedicineUpdated);
            off('inventory:medicine-restocked', handleMedicineRestocked);
            off('inventory:low-stock-alert', handleLowStockAlert);
            off('inventory:low-stock-manual-alert', () => { });
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

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddLoading(true);
        try {
            const payload = {
                name: addForm.name.trim(),
                pzn: addForm.pzn.trim(),
                price: Number(addForm.price),
                stock: Number(addForm.stock),
                unitType: addForm.unitType,
                description: addForm.description,
                prescriptionRequired: addForm.prescriptionRequired,
                lowStockThreshold: Number(addForm.lowStockThreshold) || 10,
            };
            const newMed = await addMedicine(payload);
            setInventory(prev => [newMed, ...prev]);
            setAddModal(false);
            setAddForm({ name: '', pzn: '', price: '', stock: '', unitType: 'tablet', description: '', prescriptionRequired: false, lowStockThreshold: '10' });
        } catch (err) {
            setAddError(err.message || 'Failed to add medicine');
        } finally {
            setAddLoading(false);
        }
    };

    const fieldCls = 'w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40';

    const handleDeleteMedicine = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            await deleteMedicine(confirmDelete.id);
            setInventory(prev => prev.filter(i => i._id !== confirmDelete.id));
            setConfirmDelete(null);
        } catch (err) {
            alert(err.message || 'Failed to delete medicine');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExportMedicines = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/admin/medicines/export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('pharmacy_token')}`
                }
            });
            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'medicines_inventory.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export medicines');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/api/admin/medicines/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('pharmacy_token')}`
                },
                body: formData
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Import failed');

            alert(`Import successful! ${result.message}`);
            load(); // Reload inventory
        } catch (error) {
            console.error('Import error:', error);
            alert(`Failed to import medicines: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-text bg-gradient-to-r from-text to-text-muted bg-clip-text text-transparent">Inventory Control</h1>
                    <p className="text-text-muted text-sm mt-1">Manage medicine stock levels and configuration.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".xlsx, .xls"
                        className="hidden" 
                    />
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 text-text hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-sm font-medium transition-colors border border-black/10 dark:border-white/10 disabled:opacity-50"
                    >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Uploading...' : 'Import'}
                    </button>
                    
                    <button 
                        onClick={handleExportMedicines}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 text-text hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-sm font-medium transition-colors border border-black/10 dark:border-white/10"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    <button
                        onClick={() => setAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-600 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" />
                        Add Medicine
                    </button>
                </div>
            </div>

            {/* ── Real-time Stats Bar ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
                    <div className="p-3 rounded-xl bg-primary/20 ring-1 ring-primary/30 shadow-[inset_0_0_15px_rgba(59,130,246,0.3)]">
                        <Package className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    </div>
                    <div>
                        <p className="text-[11px] text-text-muted uppercase tracking-widest font-semibold">Total Medicines</p>
                        <p className="text-2xl font-bold text-text mt-0.5">{totalMedicines}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
                    <div className={`p-3 rounded-xl ring-1 ${lowStockCount > 0 ? 'bg-amber-500/20 ring-amber-500/30 shadow-[inset_0_0_15px_rgba(245,158,11,0.3)]' : 'bg-green-500/20 ring-green-500/30'}`}>
                        <AlertTriangle className={`w-6 h-6 ${lowStockCount > 0 ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]'}`} />
                    </div>
                    <div>
                        <p className="text-[11px] text-text-muted uppercase tracking-widest font-semibold">Low Stock</p>
                        <p className={`text-2xl font-bold mt-0.5 ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                            {lowStockCount}
                        </p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
                    <div className="p-3 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30 shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]">
                        <TrendingUp className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    <div>
                        <p className="text-[11px] text-text-muted uppercase tracking-widest font-semibold">Total Value</p>
                        <p className="text-2xl font-bold text-text mt-0.5">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                </motion.div>
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
                        className="pl-10 pr-4 py-2 w-full bg-card/60 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text shadow-sm transition-all focus:bg-card/90"
                    />
                </div>
                <div className="relative min-w-45">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-text-muted" />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 w-full bg-card/60 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-text shadow-sm"
                    >
                        <option value="all">All Inventory</option>
                        <option value="low">Low Stock Alerts</option>
                        <option value="healthy">Healthy Stock</option>
                    </select>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card/40 backdrop-blur-3xl border border-white/5 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-200">
                        <thead>
                            <tr className="bg-black/5 dark:bg-black/40 text-text-muted text-[11px] uppercase tracking-wider">
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
                            <AnimatePresence>
                                {filteredInventory.length > 0 ? filteredInventory.map((item, index) => (
                                    <motion.tr
                                        key={item._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                        className="hover:bg-white/40 dark:hover:bg-black/20 transition-colors text-[14px] group"
                                    >
                                        <td className="px-6 py-4 font-semibold text-text">{item.name}</td>
                                        <td className="px-6 py-4 font-mono text-[13px] text-text-muted/80">{item.pzn}</td>
                                        <td className="px-6 py-4 text-text-muted font-medium">₹{item.price}</td>
                                        <td className={`px-6 py-4 ${getStockStatusColor(item.stock, item.lowStockThreshold)}`}>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border ${item.stock <= item.lowStockThreshold ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                                                {item.stock} {item.unitType}s
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-muted tabular-nums">{item.lowStockThreshold}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${item.prescriptionRequired ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-black/5 text-text-muted'}`}>
                                                {item.prescriptionRequired ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                <button onClick={() => triggerModal(item)} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary/20 text-text-muted hover:text-primary transition-all md:hover:scale-105" title="Adjust Stock">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setConfirmDelete({ id: item._id, name: item.name })} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-500 transition-all md:hover:scale-105" title="Remove Medicine">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-text-muted text-sm">
                                            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            No inventory matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <InventoryStockModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleRestockConfirm}
                medicineName={modalConfig.item?.name}
                currentStock={modalConfig.item?.stock}
            />

            {/* ── Delete Confirmation Modal ── */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-black/5 dark:border-white/5">
                            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-text">Remove Medicine</h2>
                                <p className="text-xs text-text-muted mt-0.5">This action cannot be undone</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm text-text">
                                Are you sure you want to permanently remove{' '}
                                <span className="font-semibold text-red-500">{confirmDelete.name}</span>{' '}
                                from the inventory?
                            </p>
                            <p className="text-xs text-text-muted mt-2">All associated stock data will be deleted. This cannot be recovered.</p>
                        </div>
                        <div className="flex gap-3 px-6 pb-5">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-text font-semibold text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDeleteMedicine} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {deleteLoading ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Medicine Modal ── */}
            {addModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
                            <div>
                                <h2 className="text-lg font-semibold text-text">Add New Medicine</h2>
                                <p className="text-xs text-text-muted mt-0.5">Add a brand-new medicine to the inventory</p>
                            </div>
                            <button onClick={() => { setAddModal(false); setAddError(''); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <X className="w-4 h-4 text-text-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleAddMedicine} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Medicine Name *</label>
                                    <input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Azithromycin 500mg" className={fieldCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">PZN Code *</label>
                                    <input required value={addForm.pzn} onChange={e => setAddForm(f => ({ ...f, pzn: e.target.value }))} placeholder="e.g. 12345678" className={fieldCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Unit Type *</label>
                                    <select required value={addForm.unitType} onChange={e => setAddForm(f => ({ ...f, unitType: e.target.value }))} className={fieldCls}>
                                        {['tablet', 'strip', 'bottle', 'injection', 'tube', 'box', 'capsule'].map(u => (
                                            <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Price (₹) *</label>
                                    <input required type="number" min="0" step="0.01" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 150" className={fieldCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Initial Stock *</label>
                                    <input required type="number" min="0" value={addForm.stock} onChange={e => setAddForm(f => ({ ...f, stock: e.target.value }))} placeholder="e.g. 100" className={fieldCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Low Stock Alert Threshold</label>
                                    <input type="number" min="0" value={addForm.lowStockThreshold} onChange={e => setAddForm(f => ({ ...f, lowStockThreshold: e.target.value }))} placeholder="Default: 10" className={fieldCls} />
                                </div>
                                <div className="flex items-center gap-3 pt-5">
                                    <input id="rxRequired" type="checkbox" checked={addForm.prescriptionRequired} onChange={e => setAddForm(f => ({ ...f, prescriptionRequired: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                                    <label htmlFor="rxRequired" className="text-sm font-medium text-text">Prescription Required (Rx)</label>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Description</label>
                                    <textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description (optional)" rows={2} className={`${fieldCls} resize-none`} />
                                </div>
                            </div>

                            {addError && (
                                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                    {addError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setAddModal(false); setAddError(''); }} className="flex-1 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-text font-semibold text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={addLoading} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {addLoading ? 'Adding...' : 'Add Medicine'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;

