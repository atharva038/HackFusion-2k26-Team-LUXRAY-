import React from 'react';

const KPICard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="text-text-muted text-sm font-medium">{title}</h3>
                <p className="text-text text-3xl font-bold mt-2">{value}</p>
            </div>
            {Icon && (
                <div className={`p-3 rounded-lg flex-shrink-0 bg-opacity-10 dark:bg-opacity-20 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
            )}
        </div>
        {subtitle && (
            <div className="mt-4 text-xs text-text-muted flex items-center gap-1">
                {subtitle}
            </div>
        )}
    </div>
);

export default KPICard;
