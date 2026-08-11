import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    IndianRupee,
    UserCheck,
    RefreshCw,
    Package,
    Clock,
    Cross
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from 'recharts';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

const API_URL = 'http://localhost:5000/api/admin';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        users: { total: 0, active: 0, blocked: 0, admins: 0, merchants: 0, customers: 0 },
        merchants: { total: 0, pending: 0, approved: 0, rejected: 0 },
        revenue: { total: 0, totalOrders: 0, totalProducts: 0 },
        charts: {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            userGrowth: [0, 0, 0, 0, 0, 0],
            merchantGrowth: [0, 0, 0, 0, 0, 0],
            monthlyRevenue: [0, 0, 0, 0, 0, 0]
        }
    });

    const getToken = () => localStorage.getItem('token');
    const COLORS = ['#2a1a6f', '#38bdf8', '#94a3b8'];

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/dashboard-stats`, {
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
                //  Fallback: If backend sends empty arrays, use default safe arrays
                const safeStats = {
                    ...data.stats,
                    charts: {
                        months: data.stats.charts?.months?.length > 0 ? data.stats.charts.months : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        userGrowth: data.stats.charts?.userGrowth || [0, 0, 0, 0, 0, 0],
                        merchantGrowth: data.stats.charts?.merchantGrowth || [0, 0, 0, 0, 0, 0],
                        monthlyRevenue: data.stats.charts?.monthlyRevenue || [0, 0, 0, 0, 0, 0]
                    }
                };
                setStats(safeStats);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const userGrowthData = useMemo(() => {
        return stats.charts.months.map((month, index) => ({
            month,
            Users: stats.charts.userGrowth[index] || 0,
            Merchants: stats.charts.merchantGrowth[index] || 0
        }));
    }, [stats.charts]);

    const revenueData = useMemo(() => {
        return stats.charts.months.map((month, index) => ({
            month,
            Revenue: stats.charts.monthlyRevenue[index] || 0
        }));
    }, [stats.charts]);

    const merchantStatusData = useMemo(() => [
        { name: 'Approved', value: stats.merchants.approved },
        { name: 'Pending', value: stats.merchants.pending },
        { name: 'Rejected', value: stats.merchants.rejected }
    ], [stats.merchants]);

    //  STATS CARDS

    const statsCards = useMemo(() => [
        {
            label: 'Total Users',
            value: stats.users.total.toLocaleString(),
            change: '+12%',
            icon: Users,
            isPositive: true,
            color: 'blue'
        },
        {
            label: 'Total Merchants',
            value: stats.merchants.total.toLocaleString(),
            change: '+5%',
            icon: UserCheck,
            isPositive: true,
            color: 'emerald'
        },
        {
            label: 'Total Products',
            value: stats.revenue.totalProducts.toLocaleString(),
            change: '0%',
            icon: Package,
            isPositive: true,
            color: 'purple'
        },
        {
            label: 'Total Revenue',
            value: `RS.${stats.revenue.total.toLocaleString()}`,
            change: '+18%',
            icon: IndianRupee,
            isPositive: true,
            color: 'amber'
        },
    ], [stats]);

    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
            <Sidebar
                activeTab='Dashboard'
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="p-8 flex-1 bg-white">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1e2356]">
                                Overall System Progress
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Real-time overview of your e-commerce platform
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-sky-600 font-medium">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <button
                                onClick={fetchDashboardStats}
                                className="p-2 text-gray-500 hover:text-[#1e2356] hover:bg-gray-100 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                            <Cross /> {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-96">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e2356] border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            {/* STATS CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {statsCards.map((stat, index) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={index} className="p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                                        {stat.label}
                                                    </p>
                                                    <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                                                    <span className={`inline-flex items-center text-xs font-semibold mt-2 ${stat.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        {stat.change}
                                                        <span className="text-slate-400 font-normal ml-1">vs last month</span>
                                                    </span>
                                                </div>
                                                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* MAIN CHARTS GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* USER GROWTH CHART (Area Chart) */}
                                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-slate-700">
                                            User Growth Overview
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="flex items-center gap-1">
                                                <span className="w-3 h-0.5 bg-[#2a1a6f] inline-block"></span>
                                                Users
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="w-3 h-0.5 bg-[#38bdf8] inline-block"></span>
                                                Merchants
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-64 w-full">
                                        {userGrowthData.some(d => d.Users > 0 || d.Merchants > 0) ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                                                    <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} fontSize={11} />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="Users" stroke="#2a1a6f" fill="#2a1a6f" fillOpacity={0.1} strokeWidth={2} />
                                                    <Area type="monotone" dataKey="Merchants" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.1} strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                No user growth data available
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* MERCHANT STATUS (Pie Chart) */}
                                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4">
                                        Merchant Status
                                    </h3>
                                    <div className="h-64 w-full flex items-center justify-center">
                                        {merchantStatusData.some(d => d.value > 0) ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={merchantStatusData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={80}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                    >
                                                        {merchantStatusData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-gray-400 text-sm">
                                                No merchant data available
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-center gap-6 mt-2 text-xs font-medium text-slate-600">
                                        {merchantStatusData.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                <span>{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* REVENUE CHART */}
                            <div className="mt-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        Revenue Overview
                                    </h3>
                                </div>
                                <div className="h-48 w-full">
                                    {revenueData.some(d => d.Revenue > 0) ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                                                <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} fontSize={11} />
                                                <Tooltip formatter={(value) => `RS.${value.toLocaleString()}`} />
                                                <Line type="monotone" dataKey="Revenue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 5, fill: '#f59e0b' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                            No revenue data available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* BOTTOM STATS CARDS */}
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Active Users</p>
                                            <p className="text-lg font-bold text-slate-800">
                                                {stats.users.active.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                            <UserCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Approved Merchants</p>
                                            <p className="text-lg font-bold text-slate-800">
                                                {stats.merchants.approved.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Pending Merchants</p>
                                            <p className="text-lg font-bold text-slate-800">
                                                {stats.merchants.pending.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Total Products</p>
                                            <p className="text-lg font-bold text-slate-800">
                                                {stats.revenue.totalProducts.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;