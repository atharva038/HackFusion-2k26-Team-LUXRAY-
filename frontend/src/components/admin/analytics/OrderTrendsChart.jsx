import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', orders: 45 },
    { name: 'Tue', orders: 52 },
    { name: 'Wed', orders: 38 },
    { name: 'Thu', orders: 65 },
    { name: 'Fri', orders: 48 },
    { name: 'Sat', orders: 70 },
    { name: 'Sun', orders: 85 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-black/10 dark:border-white/10 p-3 rounded-lg shadow-lg">
                <p className="text-text font-medium">{label}</p>
                <p className="text-blue-600 dark:text-blue-400 font-bold">
                    {payload[0].value} Orders
                </p>
            </div>
        );
    }
    return null;
};

const OrderTrendsChart = () => {
    return (
        <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5">
                <h2 className="font-semibold text-text">Order Trends (Last 7 Days)</h2>
                <p className="text-xs text-text-muted mt-1">Daily order volume progression.</p>
            </div>
            <div className="flex-grow p-4 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Line
                            type="monotone"
                            dataKey="orders"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'var(--color-card)' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default OrderTrendsChart;
