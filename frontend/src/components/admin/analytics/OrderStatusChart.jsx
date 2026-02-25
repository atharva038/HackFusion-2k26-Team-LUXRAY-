import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
    { name: 'Approved', value: 65 },
    { name: 'Pending', value: 20 },
    { name: 'Rejected', value: 15 },
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-black/10 dark:border-white/10 p-3 rounded-lg shadow-lg">
                <p className="text-text font-medium">{payload[0].name}</p>
                <p className="font-bold" style={{ color: payload[0].payload.fill }}>
                    {payload[0].value}%
                </p>
            </div>
        );
    }
    return null;
};

const OrderStatusChart = () => {
    return (
        <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5">
                <h2 className="font-semibold text-text">Order Status Distribution</h2>
                <p className="text-xs text-text-muted mt-1">Breakdown by current state.</p>
            </div>
            <div className="flex-grow p-4 min-h-[300px]">
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
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            </div>
        </div>
    );
};

export default OrderStatusChart;
