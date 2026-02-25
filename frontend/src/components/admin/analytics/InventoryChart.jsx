import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
    { name: 'Paracet.', stock: 120, min: 50 },
    { name: 'Amoxicill.', stock: 30, min: 40 },
    { name: 'Ibuprof.', stock: 85, min: 40 },
    { name: 'Ceterizine', stock: 15, min: 30 },
    { name: 'Omepraz.', stock: 150, min: 60 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const isLow = payload[0].value < payload[0].payload.min;
        return (
            <div className="bg-card border border-black/10 dark:border-white/10 p-3 rounded-lg shadow-lg">
                <p className="text-text font-medium">{label}</p>
                <p className={`font-bold ${isLow ? 'text-red-500' : 'text-emerald-500'}`}>
                    Stock: {payload[0].value}
                </p>
                <p className="text-text-muted text-xs">Min Reorder: {payload[0].payload.min}</p>
            </div>
        );
    }
    return null;
};

const InventoryChart = () => {
    return (
        <div className="bg-card border border-black/5 dark:border-white/5 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <div>
                    <h2 className="font-semibold text-text">Inventory Health</h2>
                    <p className="text-xs text-text-muted mt-1">Stock levels vs minimum threshold.</p>
                </div>
            </div>
            <div className="flex-grow p-4 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Bar dataKey="stock" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.stock < entry.min ? '#ef4444' : '#10b981'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default InventoryChart;
