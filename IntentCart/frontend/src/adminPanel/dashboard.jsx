import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    UserCheck,
    UserX,
    RefreshCw,
    WifiOff,
    Package,
    Clock,
    Cross
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

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
                setStats(data.stats);
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

    // Stats Cards Data
    const statsCards = [
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
            label: 'Revenue', 
            value: `$${stats.revenue.total.toLocaleString()}`, 
            change: '+18%', 
            icon: DollarSign, 
            isPositive: true,
            color: 'amber'
        },
    ];

    // User Growth Chart Data
    const userGrowthData = {
        labels: stats.charts.months,
        datasets: [
            {
                label: 'Total Users',
                data: stats.charts.userGrowth,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: 'Merchants',
                data: stats.charts.merchantGrowth,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }
        ]
    };

    // Revenue Chart Data
    const revenueData = {
        labels: stats.charts.months,
        datasets: [
            {
                label: 'Revenue',
                data: stats.charts.monthlyRevenue,
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderColor: 'rgb(251, 191, 36)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }
        ]
    };

    // Merchant Status Doughnut Chart
    const merchantStatusData = {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [
            {
                data: [
                    stats.merchants.approved,
                    stats.merchants.pending,
                    stats.merchants.rejected
                ],
                backgroundColor: [
                    'rgb(16, 185, 129)',
                    'rgb(251, 191, 36)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 0
            }
        ]
    };

    const merchantStatusOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            }
        },
        cutout: '70%'
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    const revenueChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: {
                display: false
            }
        }
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {statsCards.map((stat, index) => {
                                    const Icon = stat.icon;
                                    const colorClasses = {
                                        blue: 'bg-blue-50 text-blue-600',
                                        emerald: 'bg-emerald-50 text-emerald-600',
                                        purple: 'bg-purple-50 text-purple-600',
                                        amber: 'bg-amber-50 text-amber-600'
                                    };
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

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-slate-700">
                                            User Growth Overview
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="flex items-center gap-1">
                                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                                Users
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                                Merchants
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-64">
                                        <Line data={userGrowthData} options={chartOptions} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4">
                                        Merchant Status
                                    </h3>
                                    <div className="h-64 flex items-center justify-center">
                                        <Doughnut data={merchantStatusData} options={merchantStatusOptions} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        Revenue Overview
                                    </h3>
                                </div>
                                <div className="h-48">
                                    <Line data={revenueData} options={revenueChartOptions} />
                                </div>
                            </div>

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