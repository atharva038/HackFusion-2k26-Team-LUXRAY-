import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
    'Approved': '#10b981',
    'Pending': '#f59e0b',
    'Rejected': '#ef4444'
};
const DEFAULT_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-black/10 dark:border-white/10 p-3 rounded-lg shadow-lg">
                <p className="text-text font-medium">{payload[0].name}</p>
                <p className="font-bold" style={{ color: payload[0].payload.fill }}>
                    {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

const OrderStatusChart = ({ data = [] }) => {
    // Determine if there is actually data to show
    const hasData = data && data.length > 0 && data.some(d => d.value > 0);

    return (
        <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5">
                <h2 className="font-semibold text-text">Order Status Distribution</h2>
                <p className="text-xs text-text-muted mt-1">Breakdown by current state.</p>
            </div>
            <div className="flex-grow p-4 min-h-[300px]">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                formatter={(value) => <span className="text-text-muted text-sm">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-text-muted text-sm">No data available yet</div>
                )}
            </div>
        </div>
    );
};

export default OrderStatusChart;
