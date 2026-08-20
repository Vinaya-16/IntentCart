import React, { useState, useEffect } from 'react';
import {
    Bell,
    User,
    ChevronDown,
    Search,
    Loader2,
    WifiOff,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    ShoppingBag,
    Clock,
    X,
    AlertTriangle,
    CheckCircle,
    Zap,
    Sparkles,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    Target,
    Gift,
    Truck,
    Percent,
    Shield,
    Crown,
    Zap as ZapIcon,
    Eye,
    EyeOff,
    ChevronRight,
    ChevronLeft,
    Calendar,
    Filter,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    HelpCircle,
    Info,
    History,
    Edit,
    Trash2,
    Database,
    Layers,
    Brain,
    Gauge
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
    BarChart,
    Bar,
    AreaChart,
    Area,
    ComposedChart
} from 'recharts';
import { toast, Toaster } from 'react-hot-toast';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_BASE_URI = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URI}/merchant` || 'http://localhost:5000/api/merchant';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const INTENT_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const RecoveryDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [stats, setStats] = useState({
        recoverableRevenue: 0,
        recoveryRate: 0,
        recoveryAttempts: 0,
        totalAbandonments: 0,
        recoveredRevenue: 0,
        abandonmentReasons: [],
        recoveryTrend: [],
        intentDistribution: [],
        recommendations: [],
        recentRecoveries: [],
        activeAbandonments: [],
        pureAbandonedCarts: {
            count: 0,
            totalRevenue: 0,
            carts: []
        },
        intentStats: {
            average: 0,
            high: 0,
            medium: 0,
            low: 0,
            distribution: [],
            totalCartsAnalyzed: 0
        }
    });
    const [selectedTimeRange, setSelectedTimeRange] = useState('week');
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [expandedRecommendation, setExpandedRecommendation] = useState(null);
    const [triggeringRecovery, setTriggeringRecovery] = useState(null);
    const [expandedAbandonment, setExpandedAbandonment] = useState(null);
    const [showPureAbandonedDetails, setShowPureAbandonedDetails] = useState(false);
    const [showIntentDetails, setShowIntentDetails] = useState(false);

    const getToken = () => localStorage.getItem('token');

    // Fetch recovery data from backend ONLY
    const fetchRecoveryData = async () => {
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

            const response = await fetch(`${API_URL}/recovery/dashboard`, {
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
                throw new Error('Failed to fetch recovery data');
            }

            const data = await response.json();

            if (data.success) {
                setStats({
                    recoverableRevenue: data.stats?.recoverableRevenue || 0,
                    recoveryRate: data.stats?.recoveryRate || 0,
                    recoveryAttempts: data.stats?.recoveryAttempts || 0,
                    totalAbandonments: data.stats?.totalAbandonments || 0,
                    recoveredRevenue: data.stats?.recoveredRevenue || 0,
                    abandonmentReasons: data.stats?.abandonmentReasons || [],
                    recoveryTrend: data.stats?.recoveryTrend || [],
                    intentDistribution: data.stats?.intentDistribution || [],
                    recommendations: data.stats?.recommendations || [],
                    recentRecoveries: data.stats?.recentRecoveries || [],
                    activeAbandonments: data.stats?.activeAbandonments || [],
                    pureAbandonedCarts: data.stats?.pureAbandonedCarts || {
                        count: 0,
                        totalRevenue: 0,
                        carts: []
                    },
                    intentStats: data.stats?.intentStats || {
                        average: 0,
                        high: 0,
                        medium: 0,
                        low: 0,
                        distribution: [],
                        totalCartsAnalyzed: 0
                    }
                });
            } else {
                setError(data.message || 'Failed to load recovery data');
            }
        } catch (err) {
            console.error('Error fetching recovery data:', err);
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

    // Trigger recovery for an abandonment
    const handleTriggerRecovery = async (abandonmentId, source = 'cart') => {
        try {
            setTriggeringRecovery(abandonmentId);
            const token = getToken();
            if (!token) {
                toast.error('Please login first');
                return;
            }

            const response = await fetch(`${API_URL}/recovery/trigger`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    abandonmentId,
                    source: source
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to trigger recovery');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Recovery email sent successfully!');
                fetchRecoveryData();
            } else {
                toast.error(data.message || 'Failed to trigger recovery');
            }
        } catch (err) {
            console.error('Error triggering recovery:', err);
            toast.error(err.message || 'Failed to trigger recovery');
        } finally {
            setTriggeringRecovery(null);
        }
    };

    useEffect(() => {
        fetchRecoveryData();
    }, []);

    // Format currency 
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    // Get status icon and label with case-insensitive matching
    const getStatusInfo = (status) => {
        if (!status) {
            return { icon: <Clock className="w-3 h-3" />, label: 'Abandoned', color: 'bg-yellow-100 text-yellow-700' };
        }

        // Normalize status to lowercase for consistent matching
        const normalizedStatus = status.toLowerCase();

        const statusMap = {
            'abandoned': { icon: <Clock className="w-3 h-3" />, label: 'Abandoned', color: 'bg-yellow-100 text-yellow-700' },
            'partially_removed': { icon: <Edit className="w-3 h-3" />, label: 'Modified', color: 'bg-orange-100 text-orange-700' },
            'items_removed': { icon: <Trash2 className="w-3 h-3" />, label: 'Items Removed', color: 'bg-orange-100 text-orange-700' },
            'empty': { icon: <X className="w-3 h-3" />, label: 'Empty Cart', color: 'bg-gray-100 text-gray-500' },
            'recovered': { icon: <CheckCircle className="w-3 h-3" />, label: 'Recovered', color: 'bg-emerald-100 text-emerald-700' },
            'recovery_attempted': { icon: <Clock className="w-3 h-3" />, label: 'Recovery Sent', color: 'bg-blue-100 text-blue-700' }
        };
        return statusMap[normalizedStatus] || statusMap['abandoned'];
    };

    // Get intent badge with better handling
    const getIntentBadge = (level) => {
        if (!level) {
            return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">N/A</span>;
        }

        const levelMap = {
            'High': 'bg-green-100 text-green-700',
            'Medium': 'bg-yellow-100 text-yellow-700',
            'Low': 'bg-red-100 text-red-700'
        };
        const className = levelMap[level] || 'bg-gray-100 text-gray-700';
        return <span className={`text-xs ${className} px-2 py-0.5 rounded-full`}>{level}</span>;
    };

    // Get reason icon
    const getReasonIcon = (reason) => {
        const icons = {
            'High shipping cost': <Truck className="w-4 h-4 text-red-500" />,
            'Price too high': <DollarSign className="w-4 h-4 text-orange-500" />,
            'Not ready to buy': <Clock className="w-4 h-4 text-yellow-500" />,
            'Payment issues': <Shield className="w-4 h-4 text-purple-500" />,
            'Login required': <User className="w-4 h-4 text-blue-500" />,
            'Product out of stock': <ShoppingBag className="w-4 h-4 text-red-500" />,
            'Long delivery time': <Truck className="w-4 h-4 text-amber-500" />,
            'Better price elsewhere': <Percent className="w-4 h-4 text-pink-500" />
        };
        return icons[reason] || <HelpCircle className="w-4 h-4 text-gray-500" />;
    };

    // Get recommendation icon
    const getRecommendationIcon = (type) => {
        switch (type) {
            case 'offer_free_shipping': return <Truck className="w-5 h-5 text-emerald-500" />;
            case 'send_discount_coupon': return <Gift className="w-5 h-5 text-purple-500" />;
            case 'improve_checkout': return <ShoppingBag className="w-5 h-5 text-blue-500" />;
            case 'reduce_price': return <DollarSign className="w-5 h-5 text-orange-500" />;
            case 'follow_up_email': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
            default: return <Sparkles className="w-5 h-5 text-yellow-500" />;
        }
    };

    // Get recommendation badge color
    const getRecommendationBadge = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#1e3a6a] animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Toaster position="top-right" />
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 p-8 overflow-y-auto">

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <X className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {isServerDown && (
                            <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={fetchRecoveryData}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-[#1e3a6a] flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-yellow-500" />
                                    AI Recovery Dashboard
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-2">AI Powered</span>
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Recover lost revenue with AI-powered insights and recommendations
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchRecoveryData}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-500">Refresh</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Recoverable Revenue</p>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a] mt-1">
                                            {formatCurrency(stats.recoverableRevenue)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Recovery Attempts Rate</p>
                                        <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                                            {stats.recoveryRate || 0}%
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <Target className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Recovered Revenue</p>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a] mt-1">
                                            {formatCurrency(stats.recoveredRevenue)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Total Abandonments</p>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a] mt-1">
                                            {stats.totalAbandonments || 0}
                                        </p>
                                        <p className="text-xs text-slate-400">{stats.recoveryAttempts || 0} recovery attempts</p>
                                    </div>
                                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                        <ShoppingBag className="w-5 h-5 text-red-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-600 text-sm font-medium flex items-center gap-1">
                                            <Database className="w-3 h-3" />
                                            Pure Abandoned
                                        </p>
                                        <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                                            {stats.pureAbandonedCarts?.count || 0}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatCurrency(stats.pureAbandonedCarts?.totalRevenue || 0)} value
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-200 rounded-xl flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-indigo-700" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intent Score Stats Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-[#1e3a6a] flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-500" />
                                    Purchase Intent Prediction
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI Score</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium">Average Intent Score</p>
                                            <p className="text-3xl font-extrabold text-purple-700 mt-1">
                                                {stats.intentStats?.average || 0}%
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                                            <Gauge className="w-6 h-6 text-purple-700" />
                                        </div>
                                    </div>
                                    <div className="mt-2 w-full bg-purple-200 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full bg-purple-600 transition-all duration-500"
                                            style={{ width: `${Math.min(stats.intentStats?.average || 0, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium">High Intent</p>
                                            <p className="text-3xl font-extrabold text-green-700 mt-1">
                                                {stats.intentStats?.high || 0}
                                            </p>
                                            <p className="text-xs text-slate-400">71-100% Score</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-green-700" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-2xl border border-yellow-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium">Medium Intent</p>
                                            <p className="text-3xl font-extrabold text-yellow-700 mt-1">
                                                {stats.intentStats?.medium || 0}
                                            </p>
                                            <p className="text-xs text-slate-400">31-70% Score</p>
                                        </div>
                                        <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-yellow-700" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-2xl border border-red-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium">Low Intent</p>
                                            <p className="text-3xl font-extrabold text-red-700 mt-1">
                                                {stats.intentStats?.low || 0}
                                            </p>
                                            <p className="text-xs text-slate-400">0-30% Score</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                                            <TrendingDown className="w-6 h-6 text-red-700" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 1: PURE ABANDONED CARTS (from AbandonedCart model) */}
                        {stats.pureAbandonedCarts?.carts?.length > 0 && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 shadow-sm overflow-hidden mb-8">
                                <div
                                    className="p-4 border-b border-indigo-200 flex items-center justify-between cursor-pointer hover:bg-indigo-100/30 transition"
                                    onClick={() => setShowPureAbandonedDetails(!showPureAbandonedDetails)}
                                >
                                    <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        Pure Abandoned Carts
                                        <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                                            {stats.pureAbandonedCarts?.count || 0} carts
                                        </span>
                                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                                            {formatCurrency(stats.pureAbandonedCarts?.totalRevenue || 0)}
                                        </span>
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-indigo-600">
                                            {showPureAbandonedDetails ? 'Hide details' : 'Show details'}
                                        </span>
                                        {showPureAbandonedDetails ? (
                                            <ChevronLeft className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-indigo-600" />
                                        )}
                                    </div>
                                </div>

                                {showPureAbandonedDetails && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-indigo-100/50">
                                                <tr>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3">Customer</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3">Contact</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3 text-center">Items</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3 text-center">Amount</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3 text-center">Intent</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3 text-center">Status</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3 text-center">Attempts</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3 text-center">Abandoned</th>
                                                    <th className="text-left text-xs font-semibold text-indigo-700 px-4 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-indigo-100">
                                                {stats.pureAbandonedCarts.carts.map((cart, idx) => {
                                                    const statusInfo = getStatusInfo(cart.status);
                                                    return (
                                                        <tr key={idx} className="hover:bg-indigo-50/50 transition">
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-800">{cart.customer || 'Unknown'}</p>
                                                                    <p className="text-xs text-slate-400">ID: {cart._id?.substring(0, 8) || 'N/A'}</p>
                                                                    <p className="text-xs text-indigo-600 font-medium">Source: AbandonedCart</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="text-sm text-slate-600">{cart.email || 'No email'}</p>
                                                                    {cart.phone && cart.phone !== 'No phone' && (
                                                                        <p className="text-xs text-slate-400">{cart.phone}</p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-sm font-semibold text-slate-800">
                                                                    {cart.itemsCount || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-sm font-semibold text-indigo-700">
                                                                    {formatCurrency(cart.amount)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {cart.intent?.level ? getIntentBadge(cart.intent.level) : 'N/A'}
                                                                {cart.intent?.score && (
                                                                    <p className="text-xs text-slate-400">{cart.intent.score}%</p>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                                                                    {statusInfo.icon}
                                                                    {statusInfo.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-sm font-medium text-slate-700">
                                                                    {cart.recoveryAttempts || 0}
                                                                </span>
                                                                {cart.lastRecoveryAttempt && (
                                                                    <p className="text-xs text-slate-400">
                                                                        {new Date(cart.lastRecoveryAttempt).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-xs text-slate-400">
                                                                    {cart.abandonedAt ? new Date(cart.abandonedAt).toLocaleDateString() : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {cart.status !== 'recovered' && cart.status !== 'Recovered' && (
                                                                    <button
                                                                        onClick={() => handleTriggerRecovery(cart._id, 'abandonedCart')}
                                                                        disabled={triggeringRecovery === cart._id}
                                                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1 mx-auto disabled:opacity-50"
                                                                    >
                                                                        {triggeringRecovery === cart._id ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Zap className="w-3 h-3" />
                                                                        )}
                                                                        {triggeringRecovery === cart._id ? 'Sending...' : 'Recover'}
                                                                    </button>
                                                                )}
                                                                {(cart.status === 'recovered' || cart.status === 'Recovered') && (
                                                                    <span className="text-xs text-emerald-600">✓ Recovered</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800">Recovery Trend</h3>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-0.5 bg-[#1e3a6a]"></span>
                                            Revenue
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-0.5 bg-green-500"></span>
                                            Recovered
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-0.5 bg-blue-400"></span>
                                            Abandoned
                                        </span>
                                    </div>
                                </div>
                                <div className="h-64">
                                    {stats.recoveryTrend && stats.recoveryTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={stats.recoveryTrend}>
                                                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Area type="monotone" dataKey="revenue" fill="#1e3a6a" fillOpacity={0.2} stroke="#1e3a6a" name="Revenue" />
                                                <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2} name="Recovered" />
                                                <Line type="monotone" dataKey="abandoned" stroke="#60a5fa" strokeWidth={2} name="Abandoned" />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                            No trend data available
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">Intent Distribution</h3>
                                <div className="h-48">
                                    {stats.intentDistribution && stats.intentDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.intentDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    labelLine={false}
                                                >
                                                    {stats.intentDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                            No intent data available
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center mt-3">
                                    {stats.intentDistribution && stats.intentDistribution.map((item, idx) => (
                                        <span key={idx} className="text-xs flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                            {item.name}: {item.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Reasons & Recommendations */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800">Most Common Reasons</h3>
                                    <span className="text-xs text-slate-400">Why customers abandon</span>
                                </div>
                                {stats.abandonmentReasons && stats.abandonmentReasons.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.abandonmentReasons.map((reason, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                    {getReasonIcon(reason.name)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-800">{reason.name}</p>
                                                    <p className="text-xs text-slate-400">{reason.count} abandonments</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-[#1e3a6a]">{reason.percentage}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        No abandonment data available
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        AI Recommendations
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI Powered</span>
                                    </h3>
                                    <button
                                        onClick={() => setShowRecommendations(!showRecommendations)}
                                        className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        {showRecommendations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {showRecommendations && stats.recommendations && stats.recommendations.length > 0 ? (
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {stats.recommendations.map((rec, idx) => {
                                            const Icon = getRecommendationIcon(rec.type);
                                            const isExpanded = expandedRecommendation === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`border rounded-xl p-3 transition-all cursor-pointer hover:shadow-md ${rec.priority === 'high' ? 'border-red-200 bg-red-50/30' :
                                                        rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50/30' :
                                                            'border-green-200 bg-green-50/30'
                                                        }`}
                                                    onClick={() => setExpandedRecommendation(isExpanded ? null : idx)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-1.5 rounded-lg ${rec.priority === 'high' ? 'bg-red-100' :
                                                            rec.priority === 'medium' ? 'bg-yellow-100' :
                                                                'bg-green-100'
                                                            }`}>
                                                            {Icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-sm font-semibold text-slate-800">{rec.title}</p>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRecommendationBadge(rec.priority)}`}>
                                                                    {rec.priority}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mt-0.5">{rec.description}</p>
                                                            {isExpanded && (
                                                                <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200">
                                                                    <p className="text-xs text-slate-700">{rec.details}</p>
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button className="text-xs bg-[#1e3a6a] text-white px-3 py-1 rounded-lg hover:bg-blue-800 transition">
                                                                            Apply Recommendation
                                                                        </button>
                                                                        <button className="text-xs border border-slate-200 text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-50 transition">
                                                                            Learn More
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!isExpanded && (
                                                                <p className="text-[10px] text-slate-400 mt-1">Click to see details</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-slate-400">{rec.impact}</span>
                                                            {isExpanded ? (
                                                                <ChevronLeft className="w-4 h-4 text-slate-400" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        {showRecommendations ? 'No recommendations available' : 'Recommendations hidden'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 2: ACTIVE ABANDONMENTS (from Cart model) */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-red-500" />
                                    Active Abandonments
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                        {stats.activeAbandonments?.length || 0} customers
                                    </span>
                                </h3>
                                <span className="text-xs text-slate-400">Carts that were abandoned (not explicitly marked)</span>
                            </div>
                            {stats.activeAbandonments && stats.activeAbandonments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Customer</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Contact</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3 text-center">Items</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3 text-center">Amount</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3 text-center">Intent</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3 text-center">Status</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3 text-center">Abandoned</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {stats.activeAbandonments.map((abandonment, idx) => {
                                                const statusInfo = getStatusInfo(abandonment.status);
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 transition">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{abandonment.customer || 'Unknown'}</p>
                                                                <p className="text-xs text-slate-400">ID: {abandonment._id?.substring(0, 8) || 'N/A'}</p>
                                                                <p className="text-xs text-orange-600 font-medium">Source: Cart</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="text-sm text-slate-600">{abandonment.email || 'No email'}</p>
                                                                {abandonment.phone && abandonment.phone !== 'No phone' && (
                                                                    <p className="text-xs text-slate-400">{abandonment.phone}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-sm font-semibold text-slate-800">
                                                                {abandonment.itemsCount || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-sm font-semibold ${abandonment.amount > 5000 ? 'text-red-600' : 'text-[#1e3a6a]'}`}>
                                                                {formatCurrency(abandonment.amount)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {abandonment.intent?.level ? getIntentBadge(abandonment.intent.level) : 'N/A'}
                                                            {abandonment.intent?.score && (
                                                                <p className="text-xs text-slate-400">{abandonment.intent.score}%</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                                                                {statusInfo.icon}
                                                                {statusInfo.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-xs text-slate-400">
                                                                {abandonment.abandonedAt ? new Date(abandonment.abandonedAt).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {abandonment.status !== 'empty' && abandonment.status !== 'items_removed' && (
                                                                <button
                                                                    onClick={() => handleTriggerRecovery(abandonment._id, 'cart')}
                                                                    disabled={triggeringRecovery === abandonment._id}
                                                                    className="text-xs bg-[#1e3a6a] text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition flex items-center gap-1 mx-auto disabled:opacity-50"
                                                                >
                                                                    {triggeringRecovery === abandonment._id ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <Zap className="w-3 h-3" />
                                                                    )}
                                                                    {triggeringRecovery === abandonment._id ? 'Sending...' : 'Recover'}
                                                                </button>
                                                            )}
                                                            {abandonment.status === 'empty' && (
                                                                <span className="text-xs text-gray-400">Empty Cart</span>
                                                            )}
                                                            {abandonment.status === 'items_removed' && (
                                                                <span className="text-xs text-gray-400">Items Removed</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No active abandoned carts found
                                </div>
                            )}
                        </div>

                        {/* Recent Recoveries */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-green-500" />
                                    Recent Recoveries
                                </h3>
                                <span className="text-xs text-slate-400">Real-time recovery activity</span>
                            </div>
                            {stats.recentRecoveries && stats.recentRecoveries.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Customer</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Amount</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Reason</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Status</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {stats.recentRecoveries.map((recovery, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">{recovery.customer || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-400">{recovery.email || 'No email'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-semibold text-emerald-600">
                                                            {formatCurrency(recovery.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-slate-600">{recovery.reason || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${recovery.status === 'recovered' || recovery.status === 'Recovered'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {recovery.status === 'recovered' || recovery.status === 'Recovered' ? (
                                                                <CheckCircle className="w-3 h-3" />
                                                            ) : (
                                                                <Clock className="w-3 h-3" />
                                                            )}
                                                            {recovery.status ? recovery.status.charAt(0).toUpperCase() + recovery.status.slice(1) : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-slate-400">
                                                            {recovery.time ? new Date(recovery.time).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No recent recoveries
                                </div>
                            )}
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default RecoveryDashboard;