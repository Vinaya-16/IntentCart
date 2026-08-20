import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Square,
    Loader2,
    RefreshCw,
    Bell,
    User,
    LogOut,
    ShoppingBag,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    X,
    Menu
} from 'lucide-react';
import {
    BarChart,
    Bar,
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

// Use environment variable
const API_BASE_URI = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URI}` || 'http://localhost:5000/api';

const DashboardContent = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        dailyData: [],
        chartConfig: {
            yAxisMax: 1000
        }
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    }, []);

    const handleAuthError = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/intentCart-auth';
    }, []);

    const fetchDashboardStats = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to view dashboard');
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${API_URL}/merchant/dashboard`, {
                headers: getAuthHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 401) {
                handleAuthError();
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
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
                    dailyData: statsData.dailyData || [],
                    chartConfig: statsData.chartConfig || { yAxisMax: 1000 }
                });
            } else {
                throw new Error(data.message || 'Failed to fetch stats');
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            if (error.name === 'AbortError') {
                setError('Request timeout. Please try again.');
            } else {
                setError(error.message || 'Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getAuthHeaders, handleAuthError]);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/merchant/notifications/unread-count`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUnreadCount(data.unreadCount || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [getAuthHeaders]);

    const fetchRecentOrders = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/merchant/orders?limit=5`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setRecentOrders(data.orders || []);
                }
            }
        } catch (error) {
            console.error('Error fetching recent orders:', error);
        }
    }, [getAuthHeaders]);

    const fetchRecentProducts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/merchant/products?limit=5&sortBy=createdAt&sortOrder=desc`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setRecentProducts(data.products || []);
                }
            }
        } catch (error) {
            console.error('Error fetching recent products:', error);
        }
    }, [getAuthHeaders]);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchDashboardStats(true),
            fetchUnreadCount(),
            fetchRecentOrders(),
            fetchRecentProducts()
        ]);
    }, [fetchDashboardStats, fetchUnreadCount, fetchRecentOrders, fetchRecentProducts]);

    useEffect(() => {
        fetchDashboardStats();
        fetchUnreadCount();
        fetchRecentOrders();
        fetchRecentProducts();
    }, [fetchDashboardStats, fetchUnreadCount, fetchRecentOrders, fetchRecentProducts]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && !refreshing) {
                refreshAll();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [loading, refreshing, refreshAll]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/intentCart-auth';
        }
    };

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
                subtitle: `From ${stats.totalOrders || 0} orders`,
                icon: TrendingUp,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50'
            },
            {
                title: 'Revenue',
                value: `Rs. ${(stats.totalRevenue || 0).toLocaleString()}`,
                subtitle: `${totalCompleted} completed orders`,
                icon: ShoppingBag,
                color: 'text-blue-600',
                bg: 'bg-blue-50'
            },
            {
                title: 'Total Orders',
                value: (stats.totalOrders || 0).toLocaleString(),
                subtitle: `${totalCompleted} fulfilled`,
                icon: CheckCircle,
                color: 'text-purple-600',
                bg: 'bg-purple-50'
            },
            {
                title: 'Cart Abandonment',
                value: `${stats.cartAbandonmentRate || 0}%`,
                subtitle: `${stats.recoveredCarts || 0} recovered of ${stats.totalAbandonments || 0}`,
                icon: Clock,
                color: 'text-amber-600',
                bg: 'bg-amber-50'
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

    const LoadingSkeleton = () => (
        <div className="animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-5 border-2 border-sky-400 rounded-xl bg-white shadow-xs">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-40"></div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-6">
                    <div className="h-64 bg-slate-100 rounded"></div>
                </div>
                <div className="border border-slate-200 rounded-2xl p-6">
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

    const RecentActivity = () => (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-lg font-bold text-[#1e3a6a] mb-4">Recent Orders</h3>
                {recentOrders.length === 0 ? (
                    <p className="text-gray-400 text-sm">No recent orders</p>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.slice(0, 5).map((order) => (
                            <div key={order._id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">#{order.orderNumber || order._id.slice(-6)}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold">Rs. {order.total?.toLocaleString() || 0}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'completed' || order.status === 'delivered'
                                        ? 'bg-green-100 text-green-700'
                                        : order.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : order.status === 'cancelled'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <NavLink to="/merchant-OrderM">View All Orders -</NavLink>
                </button>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-lg font-bold text-[#1e3a6a] mb-4">Recent Products</h3>
                {recentProducts.length === 0 ? (
                    <p className="text-gray-400 text-sm">No recent products</p>
                ) : (
                    <div className="space-y-3">
                        {recentProducts.slice(0, 5).map((product) => (
                            <div key={product._id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                                        {product.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Stock: {product.stock || 0}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold">Rs. {product.price?.toLocaleString() || 0}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${product.status === 'active' && product.approvalStatus === 'approved'
                                        ? 'bg-green-100 text-green-700'
                                        : product.approvalStatus === 'pending'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {product.approvalStatus || 'draft'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <NavLink to="/merchant-ProductM">View All Products -</NavLink>
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar
                        activeTab="Dashboard"
                        isOpen={isSidebarOpen}
                        setIsOpen={setIsSidebarOpen}
                    />
                    <div className="flex-1 bg-white p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <LoadingSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    activeTab="Dashboard"
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                />

                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 bg-white p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        {error && (
                            <ErrorDisplay message={error} onRetry={() => refreshAll()} />
                        )}

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a6a]">
                                    Welcome Back, {getUserName()}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Here's what's happening with your store today
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs sm:text-sm font-semibold text-[#1e3a6a] hidden md:block">
                                    {getCurrentDate()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
                            {metrics.map((m, idx) => {
                                const Icon = m.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="p-4 sm:p-5 border-2 border-sky-400 rounded-xl bg-white shadow-xs hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-[#1e3a6a] mb-1">{m.title}</p>
                                                <p className="text-xl sm:text-2xl font-extrabold text-[#1e3a6a]">{m.value}</p>
                                                {m.subtitle && (
                                                    <p className="text-xs text-gray-400 mt-1">{m.subtitle}</p>
                                                )}
                                            </div>
                                            <div className={`p-2 rounded-lg ${m.bg}`}>
                                                <Icon className={`w-5 h-5 ${m.color}`} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                                    <h3 className="text-lg font-bold text-[#1e3a6a]">Daily Sales & Revenue</h3>
                                    <div className="flex items-center gap-4 text-xs font-semibold text-[#1e3a6a]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 bg-[#1e3a6a] inline-block rounded-sm"></span>
                                            <span>Revenue</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 bg-sky-400 inline-block rounded-sm"></span>
                                            <span>Sales</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-56 sm:h-64 w-full">
                                    {stats.dailyData && stats.dailyData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fontSize: 10 }}
                                                    minTickGap={10}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    domain={[0, stats.chartConfig?.yAxisMax || 1000]}
                                                    tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val}
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <Tooltip
                                                    formatter={(val) => `Rs. ${val.toLocaleString()}`}
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="Revenue"
                                                    fill="#1e3a6a"
                                                    radius={[4, 4, 0, 0]}
                                                    barSize={20}
                                                />
                                                <Bar
                                                    dataKey="Sales"
                                                    fill="#38bdf8"
                                                    radius={[4, 4, 0, 0]}
                                                    barSize={20}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                            <TrendingUp className="w-12 h-12 text-gray-300 mb-2" />
                                            <p className="text-sm">No daily data available</p>
                                            <p className="text-xs">Daily sales data will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                                <h3 className="text-lg font-bold text-[#1e3a6a]">Order Status</h3>

                                <div className="h-40 sm:h-48 w-full flex justify-center items-center my-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name, item) => [
                                                    `${value} orders (${item.payload.percentage}%)`,
                                                    name
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

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

                        <RecentActivity />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardContent;