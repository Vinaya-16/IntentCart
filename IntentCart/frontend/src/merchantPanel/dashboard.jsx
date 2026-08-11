import React, { useState, useEffect } from 'react';
import { Square, Loader2 } from 'lucide-react';
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

const API_URL = 'http://localhost:5000/api';

const DashboardContent = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        cartAbandonmentRate: 0,
        recoveryRate: 0,
        totalAbandonments: 0,
        recoveredCarts: 0,
        recoveryAttempts: 0,
        orderStatus: {
            completed: 0,
            pending: 0,
            cancelled: 0,
            processing: 0,
            shipped: 0,
            delivered: 0
        },
        monthlyData: [],
        chartConfig: {
            yAxisMax: 1000
        }
    });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Please login to view dashboard');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/merchant/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/intentCart-auth';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }

            const data = await response.json();

            if (data.success) {
                const statsData = data.stats || {};
                setStats({
                    totalSales: statsData.totalSales || 0,
                    totalRevenue: statsData.totalRevenue || 0,
                    totalOrders: statsData.totalOrders || 0,
                    totalProducts: statsData.totalProducts || 0,
                    cartAbandonmentRate: statsData.cartAbandonmentRate || 0,
                    recoveryRate: statsData.recoveryRate || 0,
                    totalAbandonments: statsData.totalAbandonments || 0,
                    recoveredCarts: statsData.recoveredCarts || 0,
                    recoveryAttempts: statsData.recoveryAttempts || 0,
                    orderStatus: {
                        completed: statsData.orderStatus?.completed || 0,
                        pending: statsData.orderStatus?.pending || 0,
                        cancelled: statsData.orderStatus?.cancelled || 0,
                        processing: statsData.orderStatus?.processing || 0,
                        shipped: statsData.orderStatus?.shipped || 0,
                        delivered: statsData.orderStatus?.delivered || 0
                    },
                    monthlyData: statsData.monthlyData || [],
                    chartConfig: statsData.chartConfig || { yAxisMax: 1000 }
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Prepare pie chart data with percentage calculations matching UI specs
    const getPieData = () => {
        const os = stats.orderStatus || {};
        const total = (os.completed || 0) + (os.delivered || 0) + (os.pending || 0) +
            (os.processing || 0) + (os.shipped || 0) + (os.cancelled || 0);

        if (total === 0) {
            return [{ name: 'No Data', value: 1, percentage: 0, color: '#e2e8f0' }];
        }

        const data = [];
        const addStatus = (name, val, color) => {
            if (val > 0) {
                data.push({
                    name,
                    value: val,
                    percentage: Math.round((val / total) * 100),
                    color
                });
            }
        };

        addStatus('Completed', (os.completed || 0) + (os.delivered || 0), '#3b31b0');
        addStatus('Pending', os.pending || 0, '#60a5fa');
        addStatus('Processing', os.processing || 0, '#f59e0b');
        addStatus('Shipped', os.shipped || 0, '#8b5cf6');
        addStatus('Cancelled', os.cancelled || 0, '#94a3b8');

        return data;
    };

    const getMetrics = () => {
        const os = stats.orderStatus || {};
        const totalCompleted = (os.completed || 0) + (os.delivered || 0);

        return [
            {
                title: 'Total Sales',
                value: `Rs. ${(stats.totalSales || 0).toLocaleString()}`,
                subtitle: `From ${stats.totalOrders || 0} orders`
            },
            {
                title: 'Revenue',
                value: `Rs. ${(stats.totalRevenue || 0).toLocaleString()}`,
                subtitle: `${totalCompleted} completed/delivered orders`
            },
            {
                title: 'Orders',
                value: (stats.totalOrders || 0).toLocaleString(),
                subtitle: `${totalCompleted} fulfilled`
            },
            {
                title: 'Cart Abandonment Rate',
                value: `${stats.cartAbandonmentRate || 0}%`,
                subtitle: `${stats.recoveredCarts || 0} recovered of ${stats.totalAbandonments || 0} abandoned`
            },
        ];
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getUserName = () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.businessName || user.username || user.name || 'Merchant';
            }
        } catch (e) { }
        return 'Merchant';
    };

    const pieData = getPieData();
    const metrics = getMetrics();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 bg-white p-8 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                            <p className="text-gray-500 mt-4">Loading dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 bg-white p-8 overflow-y-auto">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#1e3a6a]">Welcome Back, {getUserName()}</h2>
                            <span className="text-sm font-semibold text-[#1e3a6a]">{getCurrentDate()}</span>
                        </div>

                        {/* Top Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            {metrics.map((m, idx) => (
                                <div
                                    key={idx}
                                    className="p-5 border-2 border-sky-400 rounded-xl bg-white shadow-xs flex flex-col justify-between"
                                >
                                    <p className="text-xs font-semibold text-[#1e3a6a] mb-1">{m.title}</p>
                                    <p className="text-2xl font-extrabold text-[#1e3a6a]">{m.value}</p>
                                    {m.subtitle && (
                                        <p className="text-xs text-gray-400 mt-1">{m.subtitle}</p>
                                    )}
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
                                    {stats.monthlyData && stats.monthlyData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    domain={[0, stats.chartConfig?.yAxisMax || 1000]}
                                                    tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val}
                                                />
                                                <Tooltip formatter={(val) => `Rs. ${val.toLocaleString()}`} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="Revenue"
                                                    stroke="#1e3a6a"
                                                    strokeWidth={3}
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="Sales"
                                                    stroke="#38bdf8"
                                                    strokeWidth={3}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            No trend data available
                                        </div>
                                    )}
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
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name, item) => [`${value} orders (${item.payload.percentage}%)`, name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Dynamic Legend displaying percentages */}
                                <div className="flex flex-col gap-2 mt-2">
                                    {pieData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Square className="w-3 h-3 fill-current" style={{ color: item.color }} />
                                                <span>{item.name}</span>
                                            </div>
                                            <span className="text-gray-500">{item.percentage}%</span>
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