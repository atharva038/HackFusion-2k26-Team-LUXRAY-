import React, { useEffect, useState } from 'react';
import { ShoppingCart, FileSignature, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { fetchDashboardStats } from '../../services/api';

// Analytics Components
import KPICard from '../../components/admin/analytics/KPICard';
import OrderTrendsChart from '../../components/admin/analytics/OrderTrendsChart';
import InventoryChart from '../../components/admin/analytics/InventoryChart';
import OrderStatusChart from '../../components/admin/analytics/OrderStatusChart';
import RefillAnalyticsCard from '../../components/admin/analytics/RefillAnalyticsCard';
import LowStockTable from '../../components/admin/analytics/LowStockTable';

const Overview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    if (!stats) return <p className="text-text-muted">Failed to load dashboard data.</p>;

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Pharmacist Operations Analytics</h1>
                <p className="text-text-muted text-sm mt-1">Decision-support metrics based on active inventory and order data.</p>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:h-32">
                <KPICard
                    title="Total Orders Today"
                    value={stats.ordersToday || 0}
                    icon={ShoppingCart}
                    colorClass="text-blue-600 dark:text-blue-400 bg-blue-500"
                    subtitle="Last 24 hours"
                />
                <KPICard
                    title="Approved Orders"
                    value={stats.approvedOrders || 0}
                    icon={CheckCircle}
                    colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-500"
                    subtitle="Processed & dispatched"
                />
                <KPICard
                    title="Awaiting Prescription"
                    value={stats.pendingApprovals || 0}
                    icon={FileSignature}
                    colorClass="text-amber-600 dark:text-amber-400 bg-amber-500"
                    subtitle="Requires review"
                />
                <KPICard
                    title="System Actions (AI)"
                    value={(stats.systemActions || 0).toLocaleString()}
                    icon={Clock}
                    colorClass="text-purple-600 dark:text-purple-400 bg-purple-500"
                    subtitle="Automated checks last 24h"
                />
            </div>

            {/* Row 2: Charts (Order Trends & Inventory) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-full">
                    <OrderTrendsChart data={stats.orderTrends} />
                </div>
                <div className="h-full">
                    <InventoryChart data={stats.inventoryHealth} />
                </div>
            </div>

            {/* Row 3: Advanced Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-full">
                    <OrderStatusChart data={stats.orderStatusDistribution} />
                </div>
                <div className="lg:col-span-2 h-full">
                    <RefillAnalyticsCard data={stats.refillStats} />
                </div>
            </div>

            {/* Row 4: Data Tables */}
            <div className="grid grid-cols-1 gap-6">
                <LowStockTable data={stats.lowStockItems} />
            </div>

        </div>
    );
};

export default Overview;
