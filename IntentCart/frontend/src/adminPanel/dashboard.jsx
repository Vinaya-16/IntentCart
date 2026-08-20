import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    IndianRupee,
    UserCheck,
    RefreshCw,
    Package,
    Clock,
    X,
    AlertCircle
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

const API_BASE_URI = import.meta.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URI}/admin` || 'http://localhost:5000/api/admin';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    const getToken = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found in localStorage');
            return null;
        }
        return token;
    }, []);

    const COLORS = ['#2a1a6f', '#38bdf8', '#94a3b8'];

    const fetchDashboardStats = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${API_URL}/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/intentCart-auth';
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const safeStats = {
                    ...data.stats,
                    charts: {
                        months: data.stats.charts?.months?.length > 0
                            ? data.stats.charts.months
                            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        userGrowth: data.stats.charts?.userGrowth?.length > 0
                            ? data.stats.charts.userGrowth
                            : [0, 0, 0, 0, 0, 0],
                        merchantGrowth: data.stats.charts?.merchantGrowth?.length > 0
                            ? data.stats.charts.merchantGrowth
                            : [0, 0, 0, 0, 0, 0],
                        monthlyRevenue: data.stats.charts?.monthlyRevenue?.length > 0
                            ? data.stats.charts.monthlyRevenue
                            : [0, 0, 0, 0, 0, 0]
                    }
                };
                setStats(safeStats);
            } else {
                throw new Error(data.message || 'Failed to fetch stats');
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            if (err.name === 'AbortError') {
                setError('Request timeout. Please try again.');
            } else {
                setError(err.message || 'Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    const userGrowthData = useMemo(() => {
        const months = stats.charts.months || [];
        const userGrowth = stats.charts.userGrowth || [];
        const merchantGrowth = stats.charts.merchantGrowth || [];

        return months.map((month, index) => ({
            month,
            Users: userGrowth[index] || 0,
            Merchants: merchantGrowth[index] || 0
        }));
    }, [stats.charts]);

    const revenueData = useMemo(() => {
        const months = stats.charts.months || [];
        const monthlyRevenue = stats.charts.monthlyRevenue || [];

        return months.map((month, index) => ({
            month,
            Revenue: monthlyRevenue[index] || 0
        }));
    }, [stats.charts]);

    const merchantStatusData = useMemo(() => [
        { name: 'Approved', value: stats.merchants?.approved || 0 },
        { name: 'Pending', value: stats.merchants?.pending || 0 },
        { name: 'Rejected', value: stats.merchants?.rejected || 0 }
    ], [stats.merchants]);

    const statsCards = useMemo(() => [
        {
            label: 'Total Users',
            value: stats.users?.total?.toLocaleString() || '0',
            change: '+12%',
            icon: Users,
            isPositive: true,
            color: 'blue'
        },
        {
            label: 'Total Merchants',
            value: stats.merchants?.total?.toLocaleString() || '0',
            change: '+5%',
            icon: UserCheck,
            isPositive: true,
            color: 'emerald'
        },
        {
            label: 'Total Products',
            value: stats.revenue?.totalProducts?.toLocaleString() || '0',
            change: '0%',
            icon: Package,
            isPositive: true,
            color: 'purple'
        },
        {
            label: 'Total Revenue',
            value: `RS.${stats.revenue?.total?.toLocaleString() || '0'}`,
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

    const LoadingSkeleton = () => (
        <div className="animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-5 rounded-xl bg-white border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="h-3 bg-slate-200 rounded w-24 mb-2"></div>
                                <div className="h-8 bg-slate-200 rounded w-20 mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-32"></div>
                            </div>
                            <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100">
                    <div className="h-64 bg-slate-100 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100">
                    <div className="h-64 bg-slate-100 rounded"></div>
                </div>
            </div>
        </div>
    );

    const ErrorDisplay = ({ message, onRetry }) => (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="font-medium">Error loading dashboard</p>
                <p className="text-sm">{message}</p>
            </div>
            <button
                onClick={onRetry}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
                <RefreshCw className="w-3 h-3" />
                Retry
            </button>
        </div>
    );

    const ChartEmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm">{message}</p>
            <p className="text-xs text-gray-300 mt-1">Data will appear here as it becomes available</p>
        </div>
    );

    const handleRefresh = () => {
        if (!refreshing) {
            fetchDashboardStats(true);
        }
    };

    const formatCurrency = (value) => {
        return `RS.${value?.toLocaleString() || '0'}`;
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

                <main className="p-4 sm:p-6 lg:p-8 flex-1 bg-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#1e2356]">
                                Overall System Progress
                            </h2>
                            <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                                Real-time overview of your e-commerce platform
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs sm:text-sm text-sky-600 font-medium hidden md:block">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing || loading}
                                className={`p-2 text-gray-500 hover:text-[#1e2356] hover:bg-gray-100 rounded-lg transition-colors ${(refreshing || loading) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <ErrorDisplay message={error} onRetry={() => fetchDashboardStats()} />
                    )}

                    {loading ? (
                        <LoadingSkeleton />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
                                {statsCards.map((stat, index) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div
                                            key={index}
                                            className="p-4 sm:p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-slate-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                                        {stat.label}
                                                    </p>
                                                    <h3 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                                                        {stat.value}
                                                    </h3>
                                                    <span className={`inline-flex items-center text-xs font-semibold mt-2 ${stat.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        {stat.change}
                                                        <span className="text-slate-400 font-normal ml-1 hidden sm:inline">
                                                            vs last month
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ml-3 ${colorClasses[stat.color]}`}>
                                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                                        <h3 className="text-sm font-semibold text-slate-700">
                                            User Growth Overview
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs flex-wrap">
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
                                    <div className="h-56 sm:h-64 w-full">
                                        {userGrowthData.some(d => d.Users > 0 || d.Merchants > 0) ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#94a3b8"
                                                        fontSize={11}
                                                        tick={{ fontSize: 11 }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 'auto']}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        fontSize={11}
                                                        tick={{ fontSize: 11 }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            fontSize: '12px'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="Users"
                                                        stroke="#2a1a6f"
                                                        fill="#2a1a6f"
                                                        fillOpacity={0.1}
                                                        strokeWidth={2}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="Merchants"
                                                        stroke="#38bdf8"
                                                        fill="#38bdf8"
                                                        fillOpacity={0.1}
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <ChartEmptyState message="No user growth data available" />
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4">
                                        Merchant Status
                                    </h3>
                                    <div className="h-56 sm:h-64 w-full flex items-center justify-center">
                                        {merchantStatusData.some(d => d.value > 0) ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={merchantStatusData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={65}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        label={({ name, percent }) =>
                                                            `${name} ${(percent * 100).toFixed(0)}%`
                                                        }
                                                        labelLine={false}
                                                    >
                                                        {merchantStatusData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value) => value.toLocaleString()}
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            fontSize: '12px'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <ChartEmptyState message="No merchant data available" />
                                        )}
                                    </div>
                                    <div className="flex justify-center gap-4 sm:gap-6 mt-2 text-xs font-medium text-slate-600 flex-wrap">
                                        {merchantStatusData.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                />
                                                <span>{item.name}</span>
                                                <span className="text-slate-400">({item.value})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        Revenue Overview
                                    </h3>
                                    <span className="text-xs text-slate-500">
                                        Total Revenue: {formatCurrency(stats.revenue?.total)}
                                    </span>
                                </div>
                                <div className="h-40 sm:h-48 w-full">
                                    {revenueData.some(d => d.Revenue > 0) ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke="#94a3b8"
                                                    fontSize={11}
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <YAxis
                                                    domain={[0, 'auto']}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    fontSize={11}
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <Tooltip
                                                    formatter={(value) => formatCurrency(value)}
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="Revenue"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    dot={{ r: 4, fill: '#f59e0b' }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <ChartEmptyState message="No revenue data available" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 truncate">Active Users</p>
                                            <p className="text-base sm:text-lg font-bold text-slate-800">
                                                {stats.users?.active?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 truncate">Approved Merchants</p>
                                            <p className="text-base sm:text-lg font-bold text-slate-800">
                                                {stats.merchants?.approved?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 truncate">Pending Merchants</p>
                                            <p className="text-base sm:text-lg font-bold text-slate-800">
                                                {stats.merchants?.pending?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 truncate">Total Products</p>
                                            <p className="text-base sm:text-lg font-bold text-slate-800">
                                                {stats.revenue?.totalProducts?.toLocaleString() || '0'}
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