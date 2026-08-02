import React from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from 'recharts';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// 1. Line Chart Data (Recovery Trends)
const recoveryTrendsData = [
    { point: 1, revenue: 200, orders: -20 },
    { point: 2, revenue: 410, orders: 200 },
    { point: 3, revenue: 590, orders: 400 },
    { point: 4, revenue: 480, orders: 210 },
    { point: 5, revenue: 410, orders: 600 },
    { point: 6, revenue: 740, orders: 400 },
];

// 2. Donut Chart Data (Common Abandonment Reasons)
const abandonmentData = [
    { name: 'Shipping Costs', value: 35, color: '#2a1a6f' },
    { name: 'Just Browsing', value: 25, color: '#38bdf8' },
    { name: 'Account Creation', value: 20, color: '#94a3b8' },
    { name: 'Payment Issue', value: 20, color: '#bfdbfe' },
];

// 3. Vertical Bar Chart Data (Notification Performance)
const notificationData = [
    { stage: 'Open', count: 220, fill: '#2a1a6f' },
    { stage: 'Click', count: 160, fill: '#0284c7' },
    { stage: 'Purchase', count: 50, fill: '#38bdf8' },
];

// 4. Categorical Bar Chart Data (Intent Score Distribution)
const intentScoreData = [
    { category: 'High', percentage: 60, fill: '#1e1b4b' },
    { category: 'Medium', percentage: 47, fill: '#0284c7' },
    { category: 'Low', percentage: 18, fill: '#38bdf8' },
];

const RecoveryDashboard = () => {
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
                    {/* DASHBOARD BODY */}
                    <main className="flex-1 p-8 overflow-y-auto space-y-6">

                        {/* STATS CARDS SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Recovered Revenue</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">Rs. 14,250</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Recovery Rate</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">28.4 %</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Recovery Attempts</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">150</p>
                            </div>
                        </div>

                        {/* HEADING & ACTIONS */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Recovery Dashboard</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-slate-600">Thursday, July 30, 2026</span>
                                <button className="bg-[#1e1b4b] hover:bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow transition-colors">
                                    Create New Segment
                                </button>
                            </div>
                        </div>

                        {/* MAIN LINE CHART: RECOVERY TRENDS */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-800">Recovery Trends</h2>
                                <div className="flex items-center gap-6 text-xs font-semibold">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-0.5 bg-[#2a1a6f] inline-block"></span>
                                        <span>Total Recovery Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-0.5 bg-[#38bdf8] inline-block"></span>
                                        <span>Recovered Orders</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={recoveryTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="point" hide />
                                        <YAxis domain={[0, 800]} ticks={[0, 200, 400, 600, 800]} axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="revenue" stroke="#2a1a6f" strokeWidth={2} dot={{ r: 5, fill: '#2a1a6f' }} />
                                        <Line type="monotone" dataKey="orders" stroke="#38bdf8" strokeWidth={2} dot={{ r: 5, fill: '#38bdf8' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* BOTTOM CHARTS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* 1. DONUT CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Common Abandonment Reasons</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-36 h-36">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={abandonmentData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={32}
                                                    outerRadius={55}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                >
                                                    {abandonmentData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Custom Legend */}
                                    <div className="space-y-1.5 text-[11px] font-semibold text-slate-700">
                                        {abandonmentData.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. NOTIFICATION PERFORMANCE BAR CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Notification Performance</h3>
                                <div className="h-40 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={notificationData} margin={{ top: 10, right: 60, left: -25, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="stage" hide />
                                            <YAxis domain={[0, 400]} ticks={[0, 100, 200, 300, 400]} axisLine={false} tickLine={false} />
                                            <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={24}>
                                                {notificationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    {/* Custom Inline Label Legend on Right */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2 text-[10px] font-semibold text-slate-700">
                                        {notificationData.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <span>{item.stage}</span>
                                                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.fill }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. INTENT SCORE DISTRIBUTION BAR CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Intent Score Distribution</h3>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={intentScoreData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="category" hide />
                                            <YAxis
                                                domain={[0, 100]}
                                                ticks={[0, 25, 50, 75, 100]}
                                                tickFormatter={(val) => `${val} %`}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Bar dataKey="percentage" radius={[2, 2, 0, 0]} barSize={32}>
                                                {intentScoreData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default RecoveryDashboard;