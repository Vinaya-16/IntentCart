import React from 'react';
import { Square } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

const lineData = [
    { month: 'Jun', Revenue: 0, Sales: 0 },
    { month: '', Revenue: 420, Sales: 180 },
    { month: '', Revenue: 350, Sales: 300 },
    { month: '', Revenue: 670, Sales: 200 },
    { month: 'Jul', Revenue: 600, Sales: 640 },
    { month: '', Revenue: 500, Sales: 700 },
    { month: 'Aug', Revenue: 750, Sales: 750 },
];

const pieData = [
    { name: 'Completed', value: 55, color: '#3b31b0' },
    { name: 'Pending', value: 25, color: '#60a5fa' },
    { name: 'Cancelled', value: 20, color: '#82a3c7' },
];

const metrics = [
    { title: 'Total Sales', value: 'Rs. 48,000' },
    { title: 'Revenue', value: 'Rs. 34,000' },
    { title: 'Orders', value: '1,200' },
    { title: 'Cart Abandonment Rate', value: '35 %' },
];

const DashboardContent = () => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">

            {/* 2. Header placed at the top (full width) */}
            <Header />

            {/* 3. Row layout below Header for Sidebar + Main Content */}
            <div className="flex flex-1 overflow-hidden">

                {/* 4. Sidebar pinned on the left */}
                <Sidebar />

                {/* 5. Main Content takes up remaining space */}
                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 bg-white p-8 overflow-y-auto">
                        {/* Date Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#1e3a6a]">Welcome Back, Merchant S.</h2>
                            <span className="text-sm font-semibold text-[#1e3a6a]">Thursday, July 30, 2026</span>
                        </div>

                        {/* Top Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            {metrics.map((m, idx) => (
                                <div
                                    key={idx}
                                    className="p-5 border-2 border-sky-400 rounded-xl bg-white shadow-sm flex flex-col justify-between"
                                >
                                    <p className="text-xs font-semibold text-[#1e3a6a] mb-2">{m.title}</p>
                                    <p className="text-2xl font-extrabold text-[#1e3a6a]">{m.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Visualizations Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Line Chart */}
                            <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-[#1e3a6a]">Sales & Revenue Trend</h3>
                                    <div className="flex items-center gap-4 text-xs font-semibold text-[#1e3a6a]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-6 h-0.5 bg-[#1e3a6a] inline-block"></span>
                                            <span>Revenue</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-6 h-0.5 bg-sky-400 inline-block"></span>
                                            <span>Sales</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                            <YAxis tickLine={false} axisLine={false} domain={[0, 800]} ticks={[0, 200, 400, 600, 800]} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="Revenue" stroke="#1e3a6a" strokeWidth={3} dot={false} />
                                            <Line type="monotone" dataKey="Sales" stroke="#38bdf8" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Donut Chart */}
                            <div className="border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                                <h3 className="text-lg font-bold text-[#1e3a6a]">Order Status</h3>

                                <div className="h-48 w-full flex justify-center items-center my-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={0}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Legend using Lucide Icons */}
                                <div className="flex flex-col gap-1.5">
                                    {pieData.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                            <Square className="w-3 h-3 fill-current" style={{ color: item.color }} />
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </main>
                </div>

            </div>
        </div>
    );
};

export default DashboardContent;