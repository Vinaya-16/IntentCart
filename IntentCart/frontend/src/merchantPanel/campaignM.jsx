import React from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// 1. Channel Performance Data (Vertical Bar Chart)
const channelPerformanceData = [
    { metric: 'Open Rate', count: 350, fill: '#2a1a6f' },
    { metric: 'Click Rate', count: 220, fill: '#0284c7' },
    { metric: 'Conversion Rate', count: 50, fill: '#38bdf8' },
];

// 2. Campaign Types Overview Data (Donut Chart)
const campaignTypesData = [
    { name: 'Discount', value: 40, color: '#2a1a6f' },
    { name: 'Coupon', value: 25, color: '#0284c7' },
    { name: 'Free Shipping', value: 20, color: '#38bdf8' },
    { name: 'Loyalty Reward', value: 15, color: '#64748b' },
];

// 3. Sample Recent Logs Data
const recentLogs = [
    { event: 'Summer Sale Draft Saved', time: '1 today' },
    { event: 'Coupon Code Sent', time: '3 hours ago' },
    { event: 'Summer Sale Draft Sale', time: '3 hours ago' },
    { event: 'Coupon Code Sent', time: '2 hours ago' },
];

const CampaignManagement = () => {
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
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Active Campaigns</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">5</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Conversions</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">2,850</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Promo Value</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">Rs. 18,500</p>
                            </div>
                        </div>

                        {/* HEADING & ACTION BAR */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Campaign Management</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-slate-600">Thursday, July 30, 2026</span>
                                <button className="bg-[#1e1b4b] hover:bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow transition-colors">
                                    Create New Campaign
                                </button>
                            </div>
                        </div>

                        {/* CAMPAIGN CALENDAR GRID */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-800">Campaign Calendar</h2>
                                {/* Legend */}
                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-[#5b4da7] rounded-xs inline-block" />
                                        <span>Summer Sale</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-[#0284c7] rounded-xs inline-block" />
                                        <span>New Product Launch</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-[#38bdf8] rounded-xs inline-block" />
                                        <span>Loyalty Bonus</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Table Container */}
                            <div className="border border-slate-200 rounded-lg overflow-x-auto">
                                <div className="min-w-[600px]">
                                    {/* Days Header */}
                                    <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50/50 text-center text-xs font-semibold text-slate-700 py-2">
                                        <div>Sun</div>
                                        <div>Mon</div>
                                        <div>Tue</div>
                                        <div>Wed</div>
                                        <div>Thu</div>
                                        <div>Fri</div>
                                    </div>

                                    {/* Timeline Tracks */}
                                    <div className="grid grid-cols-6 divide-x divide-slate-200 min-h-[140px] relative p-2 space-y-2">
                                        {/* Event Bar 1 */}
                                        <div className="col-start-2 col-span-4 bg-[#5b4da7] text-white text-xs px-3 py-1.5 rounded-md flex justify-between items-center shadow-sm font-medium">
                                            <span>Summer Sale</span>
                                            <span className="text-[10px] opacity-90 font-light">Active</span>
                                        </div>

                                        {/* Event Bar 2 */}
                                        <div className="col-start-3 col-span-3 bg-[#0284c7] text-white text-xs px-3 py-1.5 rounded-md flex justify-between items-center shadow-sm font-medium">
                                            <span>New Product Launch</span>
                                            <span className="text-[10px] opacity-90 font-light">Scheduled</span>
                                        </div>

                                        {/* Event Bar 3 */}
                                        <div className="col-start-4 col-span-3 bg-[#38bdf8] text-white text-xs px-3 py-1.5 rounded-md flex justify-between items-center shadow-sm font-medium">
                                            <span>Loyalty Bonus</span>
                                            <span className="text-[10px] opacity-90 font-light">Scheduled</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM TRIPLE WIDGETS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* 1. RECENT CAMPAIGN LOGS */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <h3 className="text-sm font-bold text-slate-800 mb-3">Recent Campaign Logs</h3>
                                <div className="space-y-2.5">
                                    {recentLogs.map((log, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                                            <span className="font-semibold text-slate-800">{log.event}</span>
                                            <span className="text-slate-400 font-medium text-[11px]">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. CHANNEL PERFORMANCE BAR CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Channel Performance</h3>
                                <div className="h-40 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={channelPerformanceData} margin={{ top: 10, right: 75, left: -25, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="metric" hide />
                                            <YAxis domain={[0, 400]} ticks={[0, 100, 200, 300, 400]} axisLine={false} tickLine={false} />
                                            <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={24}>
                                                {channelPerformanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    {/* Custom Inline Label Legend on Right */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-1.5 text-[10px] font-semibold text-slate-700">
                                        {channelPerformanceData.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <span>{item.metric}</span>
                                                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.fill }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. CAMPAIGN TYPES OVERVIEW DONUT CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Campaign Types Overview</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-36 h-36">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={campaignTypesData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={32}
                                                    outerRadius={55}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                >
                                                    {campaignTypesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Custom Legend */}
                                    <div className="space-y-1.5 text-[11px] font-semibold text-slate-700">
                                        {campaignTypesData.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default CampaignManagement;