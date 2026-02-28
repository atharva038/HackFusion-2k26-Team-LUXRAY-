import React from 'react';
import { PackageSearch, Repeat, BrainCircuit, Activity } from 'lucide-react';

const HighlightRow = ({ icon: Icon, title, value, colorClass }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-text font-medium text-sm">{title}</span>
        </div>
        <span className="text-text font-bold text-lg">{value}</span>
    </div>
);

const RefillAnalyticsCard = ({ data = {} }) => {
    const {
        activeAlerts = 0,
        conversionRate = 0,
        autoApprovals = 0,
        topRecurring = { name: 'N/A', mrr: '₹0' }
    } = data;

    return (
        <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent">
                <h2 className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5" />
                    AI Refill Intelligence
                </h2>
                <p className="text-xs text-text-muted mt-1">Autonomous predictions & patient retention.</p>
            </div>
            <div className="p-6 flex-grow flex flex-col justify-center space-y-4">
                <HighlightRow
                    icon={PackageSearch}
                    title="Active Refill Alerts Generated"
                    value={activeAlerts}
                    colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                />
                <HighlightRow
                    icon={Repeat}
                    title="Refill Conversion Rate"
                    value={`${conversionRate}%`}
                    colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                />
                <HighlightRow
                    icon={Activity}
                    title="System Auto-Approvals"
                    value={autoApprovals}
                    colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                />

                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-semibold">Most Common Recurring</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span className="text-text font-medium">{topRecurring.name}</span>
                        </div>
                        <span className="text-text-muted text-sm shadow-sm px-2 py-1 rounded-md bg-black/5 dark:bg-white/5">
                            Est M.R.R: {topRecurring.mrr}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefillAnalyticsCard;
