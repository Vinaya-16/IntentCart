import React, { useState, useEffect } from 'react';
import {
    Bell,
    User,
    ChevronDown,
    Loader2,
    WifiOff,
    RefreshCw,
    TrendingUp,
    DollarSign,
    Users,
    ShoppingCart,
    Clock,
    Mail,
    Send,
    Eye,
    MousePointer,
    CheckCircle,
    XCircle,
    PlusCircle
} from 'lucide-react';
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
    Bar,
    Legend
} from 'recharts';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/merchant';

const RecoveryDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [stats, setStats] = useState({
        recoveredRevenue: 0,
        recoveryRate: 0,
        totalAttempts: 0,
        totalAbandonments: 0,
        recoveredOrders: 0,
        recoveryOpened: 0,
        recoveryClicked: 0
    });
    const [charts, setCharts] = useState({
        abandonmentData: [],
        notificationData: [],
        intentData: { High: 0, Medium: 0, Low: 0 },
        trends: []
    });
    const [period, setPeriod] = useState('30');
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [showAbandonedModal, setShowAbandonedModal] = useState(false);
    const [recoveryLoading, setRecoveryLoading] = useState(null);
    const [generatingSample, setGeneratingSample] = useState(false);

    const getToken = () => localStorage.getItem('token');

    // Fetch recovery stats
    const fetchStats = async () => {
        try {
            setLoading(true);
            setError('');
            setIsServerDown(false);

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/recovery/stats?period=${period}`, {
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
                throw new Error('Failed to fetch recovery stats');
            }

            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
                setCharts(data.charts);
            }
        } catch (err) {
            console.error('Error fetching recovery stats:', err);
            if (err.message === 'Failed to fetch' || err.message.includes('ERR_CONNECTION_REFUSED')) {
                setIsServerDown(true);
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch abandoned carts
    const fetchAbandonedCarts = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/recovery/abandoned`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch abandoned carts');

            const data = await response.json();
            if (data.success) {
                setAbandonedCarts(data.abandoned || []);
            }
        } catch (err) {
            console.error('Error fetching abandoned carts:', err);
        }
    };

    // Generate sample data
    const generateSampleData = async () => {
        try {
            setGeneratingSample(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setGeneratingSample(false);
                return;
            }

            if (!window.confirm('This will generate sample data for demo purposes. Continue?')) {
                setGeneratingSample(false);
                return;
            }

            const response = await fetch(`${API_URL}/recovery/generate-sample`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate sample data');
            }

            const data = await response.json();
            if (data.success) {
                alert('Sample data generated successfully!');
                await fetchStats();
                await fetchAbandonedCarts();
            }
        } catch (err) {
            console.error('Error generating sample data:', err);
            setError(err.message);
        } finally {
            setGeneratingSample(false);
        }
    };

    // Trigger recovery
    const handleTriggerRecovery = async (sessionId, customerId) => {
        try {
            setRecoveryLoading(sessionId);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setRecoveryLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/recovery/trigger`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionId, customerId, method: 'email' })
            });

            if (!response.ok) {
                throw new Error('Failed to trigger recovery');
            }

            const data = await response.json();
            if (data.success) {
                alert('Recovery email sent successfully!');
                await fetchAbandonedCarts();
                await fetchStats();
            }
        } catch (err) {
            console.error('Error triggering recovery:', err);
            setError(err.message);
        } finally {
            setRecoveryLoading(null);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchAbandonedCarts();
    }, [period]);

    // Colors for charts
    const COLORS = ['#2a1a6f', '#38bdf8', '#94a3b8', '#bfdbfe', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Get status icon
    const getStatusIcon = (status) => {
        const statusMap = {
            'converted': <CheckCircle className="w-4 h-4 text-emerald-500" />,
            'sent': <Send className="w-4 h-4 text-blue-500" />,
            'opened': <Eye className="w-4 h-4 text-amber-500" />,
            'clicked': <MousePointer className="w-4 h-4 text-purple-500" />,
            'pending': <Clock className="w-4 h-4 text-gray-400" />,
            'failed': <XCircle className="w-4 h-4 text-red-500" />,
            'expired': <XCircle className="w-4 h-4 text-red-400" />
        };
        return statusMap[status] || <Clock className="w-4 h-4 text-gray-400" />;
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            'converted': 'Converted',
            'sent': 'Sent',
            'opened': 'Opened',
            'clicked': 'Clicked',
            'pending': 'Pending',
            'failed': 'Failed',
            'expired': 'Expired'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#1e3a6a] animate-spin" />
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
                    <main className="flex-1 p-8 overflow-y-auto space-y-6">

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <XCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {/* Server Down */}
                        {isServerDown && (
                            <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={fetchStats}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Recovered Revenue</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">
                                            {formatCurrency(stats.recoveredRevenue || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Recovery Rate</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">
                                            {(stats.recoveryRate || 0).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <Mail className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Recovery Attempts</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">
                                            {stats.totalAttempts || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <ShoppingCart className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Abandoned Carts</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">
                                            {stats.totalAbandonments || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* HEADING & ACTIONS */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Recovery Dashboard</h1>
                            <div className="flex items-center gap-4 flex-wrap">
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
                                >
                                    <option value="7">Last 7 Days</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="90">Last 90 Days</option>
                                    <option value="180">Last 6 Months</option>
                                </select>
                                <span className="text-sm font-semibold text-slate-600">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <button
                                    onClick={generateSampleData}
                                    disabled={generatingSample}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {generatingSample ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <PlusCircle className="w-4 h-4" />
                                    )}
                                    Generate Sample
                                </button>
                                <button
                                    onClick={() => setShowAbandonedModal(true)}
                                    className="bg-[#1e1b4b] hover:bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow transition-colors"
                                >
                                    View Abandoned Carts
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
                                        <span>Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-0.5 bg-[#38bdf8] inline-block"></span>
                                        <span>Orders</span>
                                    </div>
                                </div>
                            </div>

                            {charts.trends && charts.trends.length > 0 && charts.trends.some(t => t.revenue > 0 || t.orders > 0) ? (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={charts.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                                            <YAxis yAxisId="left" domain={[0, 'auto']} axisLine={false} tickLine={false} fontSize={11} />
                                            <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} axisLine={false} tickLine={false} fontSize={11} />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (name === 'Revenue') return formatCurrency(value);
                                                    return value;
                                                }}
                                            />
                                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#2a1a6f" strokeWidth={2} dot={{ r: 5, fill: '#2a1a6f' }} name="Revenue" />
                                            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#38bdf8" strokeWidth={2} dot={{ r: 5, fill: '#38bdf8' }} name="Orders" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="font-medium">No recovery data available</p>
                                    <p className="text-sm text-gray-400">Click "Generate Sample" to see analytics</p>
                                </div>
                            )}
                        </div>

                        {/* BOTTOM CHARTS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* 1. DONUT CHART - Abandonment Reasons */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Abandonment Reasons</h3>
                                {charts.abandonmentData && charts.abandonmentData.length > 0 && charts.abandonmentData[0].name !== 'No Data' ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-36 h-36">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={charts.abandonmentData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={32}
                                                        outerRadius={55}
                                                        paddingAngle={0}
                                                        dataKey="value"
                                                    >
                                                        {charts.abandonmentData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => `${value}%`} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-1.5 text-[11px] font-semibold text-slate-700">
                                            {charts.abandonmentData.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 shrink-0 rounded-xs" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                    <span className="truncate">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No abandonment data available
                                    </div>
                                )}
                            </div>

                            {/* 2. NOTIFICATION PERFORMANCE BAR CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Notification Performance</h3>
                                {charts.notificationData && charts.notificationData.length > 0 && charts.notificationData.some(d => d.count > 0) ? (
                                    <div className="h-40 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={charts.notificationData} margin={{ top: 10, right: 60, left: -25, bottom: 0 }}>
                                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="stage" hide />
                                                <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} />
                                                <Tooltip />
                                                <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={24}>
                                                    {charts.notificationData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2 text-[10px] font-semibold text-slate-700">
                                            {charts.notificationData.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5">
                                                    <span>{item.stage}</span>
                                                    <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No notification data available
                                    </div>
                                )}
                            </div>

                            {/* 3. INTENT SCORE DISTRIBUTION */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Intent Score Distribution</h3>
                                {charts.intentData && (charts.intentData.High > 0 || charts.intentData.Medium > 0 || charts.intentData.Low > 0) ? (
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { category: 'High', value: charts.intentData.High || 0 },
                                                    { category: 'Medium', value: charts.intentData.Medium || 0 },
                                                    { category: 'Low', value: charts.intentData.Low || 0 }
                                                ]}
                                                margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
                                            >
                                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="category" hide />
                                                <YAxis
                                                    domain={[0, 'auto']}
                                                    tickFormatter={(val) => `${val}`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip formatter={(value) => `${value} users`} />
                                                <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={32}>
                                                    <Cell fill="#2a1a6f" />
                                                    <Cell fill="#38bdf8" />
                                                    <Cell fill="#94a3b8" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No intent score data available
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Abandoned Carts Modal */}
                        {showAbandonedModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                                    <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1e3a6a]">Abandoned Carts</h2>
                                            <p className="text-sm text-gray-500">Review and recover lost sales</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAbandonedModal(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <XCircle className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6">
                                        {abandonedCarts.length > 0 ? (
                                            <div className="space-y-4">
                                                {abandonedCarts.map((cart) => (
                                                    <div key={cart._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-bold text-slate-900">
                                                                        {cart.customerId?.name || cart.customerId?.username || 'Guest User'}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {cart.customerId?.email || 'No email'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                                                                    <span>{cart.cartItems?.length || 0} items</span>
                                                                    <span>{formatCurrency(cart.cartTotal || 0)}</span>
                                                                    <span className="flex items-center gap-1">
                                                                        {getStatusIcon(cart.recoveryStatus)}
                                                                        <span className="capitalize">{getStatusLabel(cart.recoveryStatus)}</span>
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(cart.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                {cart.cartItems && cart.cartItems.length > 0 && (
                                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                                        {cart.cartItems.slice(0, 3).map((item, idx) => (
                                                                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                                                {item.name || 'Product'} x{item.quantity || 1}
                                                                            </span>
                                                                        ))}
                                                                        {cart.cartItems.length > 3 && (
                                                                            <span className="text-xs text-gray-400">
                                                                                +{cart.cartItems.length - 3} more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleTriggerRecovery(cart.sessionId, cart.customerId?._id)}
                                                                    disabled={recoveryLoading === cart.sessionId || cart.recoveryStatus === 'converted'}
                                                                    className="px-4 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                                >
                                                                    {recoveryLoading === cart.sessionId ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <Send className="w-4 h-4" />
                                                                    )}
                                                                    {cart.recoveryStatus === 'converted' ? 'Recovered' : 'Send Recovery'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                                <p className="font-medium">No abandoned carts found</p>
                                                <p className="text-sm text-gray-400">Great job! All carts have been recovered or are being processed.</p>
                                                <button
                                                    onClick={generateSampleData}
                                                    className="mt-4 px-4 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition"
                                                >
                                                    Generate Sample Data
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default RecoveryDashboard;