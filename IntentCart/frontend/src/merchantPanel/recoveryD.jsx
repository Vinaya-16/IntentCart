import React, { useState, useEffect } from 'react';
import {
    Loader2,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Clock,
    Mail,
    Send,
    Eye,
    MousePointer,
    CheckCircle,
    XCircle,
    Filter,
    X,
    Zap,
    AlertCircle,
    Heart,
    Truck,
    User
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
    Bar
} from 'recharts';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/merchant';

const RecoveryDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [detecting, setDetecting] = useState(false);
    const [stats, setStats] = useState({
        recoveredRevenue: 0,
        recoveryRate: 0,
        totalAttempts: 0,
        totalAbandonments: 0,
        recoveredOrders: 0,
        cartAbandoned: 0,
        checkoutAbandoned: 0,
        productAbandoned: 0,
        wishlistAbandoned: 0,
        cartRestored: 0,
        productViewed: 0,
        cartViewed: 0,
        checkoutViewed: 0
    });
    const [charts, setCharts] = useState({
        abandonmentData: [],
        notificationData: [],
        intentData: { High: 0, Medium: 0, Low: 0 },
        trends: []
    });
    const [period, setPeriod] = useState('30');
    const [allEvents, setAllEvents] = useState([]);
    const [showAbandonedModal, setShowAbandonedModal] = useState(false);
    const [recoveryLoading, setRecoveryLoading] = useState(null);

    const getToken = () => localStorage.getItem('token');

    // ==================== ABANDONMENT REASON LABELS ====================
    const ABANDONMENT_REASONS = {
        'cart_aged': { label: 'Cart Idle (>5 mins)', icon: Clock, color: '#f59e0b' },
        'checkout_complex': { label: 'Checkout Abandoned', icon: XCircle, color: '#ef4444' },
        'wishlist_abandoned': { label: 'Wishlist to Cart', icon: Heart, color: '#ec4899' },
        'high_interest_no_purchase': { label: 'Product Obsession', icon: Eye, color: '#8b5cf6' },
        'high_price': { label: 'High Price', icon: DollarSign, color: '#f97316' },
        'shipping_costs': { label: 'Shipping Costs', icon: Truck, color: '#06b6d4' },
        'payment_issue': { label: 'Payment Issue', icon: AlertCircle, color: '#ef4444' },
        'just_browsing': { label: 'Just Browsing', icon: Eye, color: '#94a3b8' },
        'account_creation': { label: 'Account Creation', icon: User, color: '#6366f1' },
        'technical_issue': { label: 'Technical Issue', icon: AlertCircle, color: '#dc2626' },
        'comparing_products': { label: 'Comparing Products', icon: ShoppingCart, color: '#3b82f6' },
        'waiting_for_discount': { label: 'Waiting for Discount', icon: DollarSign, color: '#10b981' },
        'other': { label: 'Other', icon: AlertCircle, color: '#94a3b8' }
    };

    // ==================== FETCH DATA ====================
    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const statsResponse = await fetch(`${API_URL}/recovery/stats?period=${period}`, { headers });
            if (!statsResponse.ok) throw new Error('Failed to fetch stats');

            const statsData = await statsResponse.json();

            if (statsData.success && statsData.stats) {
                setStats(statsData.stats);
                setCharts(statsData.charts || {
                    abandonmentData: [],
                    notificationData: [],
                    intentData: { High: 0, Medium: 0, Low: 0 },
                    trends: []
                });
            } else {
                setStats({
                    recoveredRevenue: 0,
                    recoveryRate: 0,
                    totalAttempts: 0,
                    totalAbandonments: 0,
                    recoveredOrders: 0,
                    cartAbandoned: 0,
                    checkoutAbandoned: 0,
                    productAbandoned: 0,
                    wishlistAbandoned: 0,
                    cartRestored: 0,
                    productViewed: 0,
                    cartViewed: 0,
                    checkoutViewed: 0
                });
                setCharts({
                    abandonmentData: [],
                    notificationData: [],
                    intentData: { High: 0, Medium: 0, Low: 0 },
                    trends: []
                });
                setError(statsData.message || 'No recovery data available');
            }

            const eventsResponse = await fetch(`${API_URL}/recovery/events?limit=500&page=1`, { headers });
            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                if (eventsData.success) {
                    setAllEvents(eventsData.data || []);
                }
            }

        } catch (err) {
            console.error('Error fetching recovery data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ==================== RUN ABANDONMENT DETECTION ====================
    const runAbandonmentDetection = async () => {
        try {
            setDetecting(true);
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/recovery/detect-abandonments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                await fetchData();
            } else {
                setError(data.message || 'Detection failed');
            }
        } catch (err) {
            console.error('Detection error:', err);
            setError('Failed to run abandonment detection');
        } finally {
            setDetecting(false);
        }
    };

    // ==================== TRIGGER RECOVERY ====================
    const handleTriggerRecovery = async (sessionId, customerId) => {
        try {
            setRecoveryLoading(sessionId);
            setError('');

            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/recovery/trigger`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionId, customerId, method: 'email' })
            });

            if (!response.ok) throw new Error('Failed to trigger recovery');

            const data = await response.json();
            if (data.success) {
                await fetchData();
            }
        } catch (err) {
            console.error('Error triggering recovery:', err);
            setError(err.message);
        } finally {
            setRecoveryLoading(null);
        }
    };

    // ==================== EFFECTS ====================
    useEffect(() => {
        fetchData();
    }, [period]);

    // ==================== COLORS & HELPERS ====================
    const COLORS = ['#2a1a6f', '#38bdf8', '#94a3b8', '#bfdbfe', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6', '#dc2626'];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);
    };

    const formatEventType = (type) => {
        const labels = {
            'cart_abandoned': 'Cart Abandoned', 'checkout_abandoned': 'Checkout Abandoned',
            'cart_restored': 'Cart Restored', 'cart_viewed': 'Cart Viewed',
            'checkout_viewed': 'Checkout Viewed', 'product_viewed': 'Product Viewed',
            'wishlist_viewed': 'Wishlist Viewed', 'recovery_email_sent': 'Recovery Email Sent',
            'recovery_email_opened': 'Recovery Email Opened', 'recovery_email_clicked': 'Recovery Email Clicked',
            'recovery_converted': 'Recovery Converted', 'product_abandoned': 'Product Abandoned',
            'wishlist_abandoned': 'Wishlist Abandoned'
        };
        return labels[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    };

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

    const getStatusLabel = (status) => {
        const labels = { 'converted': 'Converted', 'sent': 'Sent', 'opened': 'Opened', 'clicked': 'Clicked', 'pending': 'Pending', 'failed': 'Failed', 'expired': 'Expired' };
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

                        {/* Error Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error || 'An unknown error occurred'}</span>
                                <button onClick={() => setError('')} className="ml-auto hover:bg-red-100 p-1 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Recovered Revenue</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">{formatCurrency(stats.recoveredRevenue || 0)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Recovery Rate</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">{(stats.recoveryRate || 0).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg"><Mail className="w-5 h-5 text-purple-600" /></div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Recovery Attempts</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">{stats.totalAttempts || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-lg"><ShoppingCart className="w-5 h-5 text-amber-600" /></div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Total Abandonments</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">{stats.totalAbandonments || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ABANDONMENT FLOW */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Abandonment Flow Analysis</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="text-xs text-slate-500">Browse Products</div>
                                    <div className="text-lg font-bold text-blue-600">{stats.productViewed || 0}</div>
                                </div>
                                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                                    <div className="text-xs text-slate-500">Add to Cart</div>
                                    <div className="text-lg font-bold text-indigo-600">{stats.cartViewed || 0}</div>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <div className="text-xs text-slate-500">Checkout Started</div>
                                    <div className="text-lg font-bold text-purple-600">{stats.checkoutViewed || 0}</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <div className="text-xs text-slate-500">Abandoned</div>
                                    <div className="text-lg font-bold text-red-600">{stats.checkoutAbandoned || 0}</div>
                                </div>
                                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                    <div className="text-xs text-slate-500">Purchase Completed</div>
                                    <div className="text-lg font-bold text-emerald-600">{stats.recoveredOrders || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* HEADING & ACTIONS */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Recovery Dashboard</h1>
                            <div className="flex items-center gap-4 flex-wrap">
                                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                    <option value="7">Last 7 Days</option>
                                    <option value="15">Last 15 Days</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="90">Last 90 Days</option>
                                </select>

                                <button onClick={runAbandonmentDetection} disabled={detecting} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                                    {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    {detecting ? 'Scanning...' : 'Detect Abandonments'}
                                </button>

                                <button onClick={() => setShowAbandonedModal(true)} className="bg-[#1e1b4b] hover:bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow transition-colors">
                                    View Abandoned Events ({allEvents.filter(e => e.eventType && e.eventType.includes('abandoned') && e.recoveryStatus !== 'converted').length})
                                </button>
                            </div>
                        </div>

                        {/* RECOVERY TRENDS CHART */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-800">Recovery Trends</h2>
                                <div className="flex items-center gap-6 text-xs font-semibold">
                                    <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#2a1a6f] inline-block"></span><span>Revenue</span></div>
                                    <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#38bdf8] inline-block"></span><span>Orders</span></div>
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
                                            <Tooltip formatter={(value, name) => name === 'Revenue' ? formatCurrency(value) : value} />
                                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#2a1a6f" strokeWidth={2} dot={{ r: 5, fill: '#2a1a6f' }} name="Revenue" />
                                            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#38bdf8" strokeWidth={2} dot={{ r: 5, fill: '#38bdf8' }} name="Orders" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="font-medium">No recovery data available</p>
                                    <p className="text-sm text-gray-400">Click "Detect Abandonments" to find abandoned carts</p>
                                </div>
                            )}
                        </div>

                        {/* SUB-CHARTS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Abandonment Reasons</h3>
                                {charts.abandonmentData && charts.abandonmentData.length > 0 ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-36 h-36">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={charts.abandonmentData} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={0} dataKey="value">
                                                        {charts.abandonmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
                                ) : <div className="text-center py-8 text-gray-400 text-sm">No abandonment data available</div>}
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Notification Performance</h3>
                                {charts.notificationData && charts.notificationData.length > 0 && charts.notificationData.some(d => d.value > 0) ? (
                                    <div className="h-40 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={charts.notificationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" hide />
                                                <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        if (name === 'Sent') return [`${value} emails`, 'Sent'];
                                                        if (name === 'Opened') return [`${value} opens`, 'Opened'];
                                                        if (name === 'Clicked') return [`${value} clicks`, 'Clicked'];
                                                        if (name === 'Converted') return [`${value} conversions`, 'Converted'];
                                                        return [value, name];
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={24}>
                                                    {charts.notificationData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : <div className="text-center py-8 text-gray-400 text-sm">No notification data available</div>}
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Intent Score Distribution</h3>
                                {charts.intentData && (charts.intentData.High > 0 || charts.intentData.Medium > 0 || charts.intentData.Low > 0) ? (
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[{ category: 'High', value: charts.intentData.High || 0 }, { category: 'Medium', value: charts.intentData.Medium || 0 }, { category: 'Low', value: charts.intentData.Low || 0 }]} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="category" hide />
                                                <YAxis domain={[0, 'auto']} tickFormatter={(val) => `${val}`} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        const labelMap = {
                                                            'High': 'High Intent',
                                                            'Medium': 'Medium Intent',
                                                            'Low': 'Low Intent'
                                                        };
                                                        return [`${value} users`, labelMap[name] || name];
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={32}>
                                                    <Cell fill="#2a1a6f" /><Cell fill="#38bdf8" /><Cell fill="#94a3b8" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : <div className="text-center py-8 text-gray-400 text-sm">No intent score data available</div>}
                            </div>
                        </div>

                        {/* ABANDONED EVENTS MODAL */}
                        {showAbandonedModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                                    <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1e3a6a]">Abandoned Events</h2>
                                            <p className="text-sm text-gray-500">
                                                {allEvents.filter(e => e.eventType && e.eventType.includes('abandoned') && e.recoveryStatus !== 'converted').length} active events found
                                            </p>
                                        </div>
                                        <button onClick={() => setShowAbandonedModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-500" /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6">
                                        {allEvents.filter(e => e.eventType && e.eventType.includes('abandoned') && e.recoveryStatus !== 'converted').length > 0 ? (
                                            <div className="space-y-4">
                                                {allEvents
                                                    .filter(e => e.eventType && e.eventType.includes('abandoned') && e.recoveryStatus !== 'converted')
                                                    .map((cart) => {
                                                        const reasonData = cart.abandonmentReason ? ABANDONMENT_REASONS[cart.abandonmentReason] : null;
                                                        const ReasonIcon = reasonData?.icon || AlertCircle;
                                                        return (
                                                            <div key={cart._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition">
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-bold text-slate-900">{cart.customerId?.name || cart.customerId?.username || 'Guest'}</span>
                                                                            <span className="text-xs text-gray-400">{cart.customerId?.email || 'No email'}</span>
                                                                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{formatEventType(cart.eventType)}</span>
                                                                            {cart.abandonmentReason && reasonData && (
                                                                                <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: reasonData.color + '20', color: reasonData.color }}>
                                                                                    <ReasonIcon className="w-3 h-3" /> {reasonData.label}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {reasonData?.description && <p className="text-[10px] text-slate-400 mt-0.5">{reasonData.description}</p>}
                                                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                                                                            <span>{cart.cartItems?.length || 0} items</span>
                                                                            <span>{formatCurrency(cart.cartTotal || 0)}</span>
                                                                            <span className="flex items-center gap-1">{getStatusIcon(cart.recoveryStatus)}<span className="capitalize">{getStatusLabel(cart.recoveryStatus)}</span></span>
                                                                            <span className="text-xs text-gray-400">
                                                                                {cart.createdAt ? new Date(cart.createdAt).toLocaleDateString() : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        {cart.cartItems && cart.cartItems.length > 0 && (
                                                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                                                {cart.cartItems.slice(0, 3).map((item, idx) => <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{item.name || 'Product'} x{item.quantity || 1}</span>)}
                                                                                {cart.cartItems.length > 3 && <span className="text-xs text-gray-400">+{cart.cartItems.length - 3} more</span>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleTriggerRecovery(cart.sessionId, cart.customerId?._id)}
                                                                            disabled={
                                                                                recoveryLoading === cart.sessionId ||
                                                                                cart.recoveryStatus === 'converted' ||
                                                                                cart.recoveryStatus === 'sent' ||
                                                                                !cart.customerId?.email
                                                                            }
                                                                            className="px-4 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                                        >
                                                                            {recoveryLoading === cart.sessionId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}

                                                                            {cart.recoveryStatus === 'converted' ? (
                                                                                'Recovered'
                                                                            ) : cart.recoveryStatus === 'sent' ? (
                                                                                'Already Sent'
                                                                            ) : !cart.customerId?.email ? (
                                                                                'No Email'
                                                                            ) : (
                                                                                'Send Recovery'
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                                <p className="font-medium">No active abandoned events found</p>
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