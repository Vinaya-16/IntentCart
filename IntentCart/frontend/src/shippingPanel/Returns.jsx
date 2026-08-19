import React, { useState, useMemo, useEffect } from 'react';
import {
    ArrowLeft,
    RotateCcw,
    CheckCircle,
    Clock,
    AlertCircle,
    Truck,
    Search,
    X,
    Package,
    Filter,
    Menu,
    ChevronRight,
    Loader2,
    WifiOff,
    RefreshCw,
    Eye,
    Check,
    XCircle,
    Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/returns';

const ShippingReturns = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data States
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [stats, setStats] = useState(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const getToken = () => localStorage.getItem('token');

    // Fetch returns from backend
    const fetchReturns = async () => {
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

            const params = new URLSearchParams();
            if (filterStatus !== 'All') {
                params.append('status', filterStatus.toLowerCase());
            }
            const url = `${API_URL}${params.toString() ? `?${params.toString()}` : ''}`;

            const [returnsRes, statsRes] = await Promise.all([
                fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${API_URL}/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (returnsRes.status === 401 || statsRes.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/intentCart-auth';
                return;
            }

            if (!returnsRes.ok) {
                const errorData = await returnsRes.json();
                throw new Error(errorData.message || 'Failed to fetch returns');
            }

            const returnsData = await returnsRes.json();

            if (returnsData.success) {
                const formattedReturns = (returnsData.returns || []).map(ret => {
                    let refundAmount = ret.refundAmount || 0;
                    if (refundAmount === 0 && ret.items && ret.items.length > 0) {
                        refundAmount = ret.items.reduce((sum, item) => {
                            const price = item.price || 0;
                            return sum + (price * (item.quantity || 1));
                        }, 0);
                    }

                    const firstItem = ret.items && ret.items.length > 0 ? ret.items[0] : null;
                    const productName = firstItem?.productName ||
                        firstItem?.productId?.name ||
                        'Unknown Product';

                    return {
                        _id: ret._id,
                        returnId: ret.returnId || ret._id?.slice(-6),
                        orderNumber: ret.orderNumber || ret.orderId?.orderId || 'N/A',
                        customerId: ret.customerId || { username: 'Unknown', email: '' },
                        items: (ret.items || []).map(item => ({
                            ...item,
                            productName: item.productName || item.productId?.name || 'Unknown Product',
                            price: item.price || item.productId?.price || 0
                        })),
                        productName: productName,
                        itemCount: ret.items?.length || 0,
                        reason: ret.reason || 'other',
                        reasonDescription: ret.reasonDescription || '',
                        status: ret.status || 'pending',
                        refundMethod: ret.refundMethod || 'original_payment',
                        refundAmount: refundAmount,
                        pickupAddress: ret.pickupAddress || {},
                        createdAt: ret.createdAt || new Date(),
                        notes: ret.notes || '',
                        rejectionReason: ret.rejectionReason || '',
                        qualityCheckNotes: ret.qualityCheckNotes || '',
                        pickupScheduledAt: ret.pickupScheduledAt,
                        pickedUpAt: ret.pickedUpAt,
                        refundProcessedAt: ret.refundProcessedAt
                    };
                });
                setReturns(formattedReturns);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setStats(statsData.stats);
                }
            }

        } catch (err) {
            console.error('Error fetching returns:', err);
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

    // Update return status
    const updateReturnStatus = async (returnId, status, notes = '') => {
        try {
            setActionLoading(true);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/${returnId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, notes })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update return status');
            }

            const data = await response.json();
            if (data.success) {
                setSuccess(`Return status updated to ${status.replace('_', ' ')}`);
                await fetchReturns();
                setShowActionModal(false);
                setSelectedReturn(null);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error updating return:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, [filterStatus]);

    // Filter Logic
    const filteredReturns = useMemo(() => {
        let result = returns;

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(ret =>
                ret.returnId?.toLowerCase().includes(query) ||
                ret.orderNumber?.toLowerCase().includes(query) ||
                ret.customerId?.username?.toLowerCase().includes(query) ||
                ret.productName?.toLowerCase().includes(query) ||
                ret.items?.some(item => item.productName?.toLowerCase().includes(query))
            );
        }

        return result;
    }, [returns, searchQuery]);

    // Stats Cards
    const statsCards = useMemo(() => {
        if (!stats) return [];

        let totalRefund = stats.totalRefund || 0;
        let refundedOrders = stats.refundedOrders || 0;

        // If totalRefund is 0, calculate from returns array
        if (totalRefund === 0 && returns.length > 0) {
            const refundedReturns = returns.filter(r =>
                r.status === 'refund_processed' || r.status === 'completed'
            );
            refundedOrders = refundedReturns.length;
            totalRefund = refundedReturns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
        }

        return [
            {
                label: 'Total Returns',
                value: stats.total || returns.length || 0,
                icon: RotateCcw,
                color: 'purple'
            },
            {
                label: 'Pending',
                value: stats.pending || 0,
                icon: Clock,
                color: 'amber'
            },
            {
                label: 'Refund Processed',
                value: stats.refundProcessed || 0,
                icon: CheckCircle,
                color: 'emerald'
            },
            {
                label: 'Rejected',
                value: stats.rejected || 0,
                icon: XCircle,
                color: 'red'
            },
            {
                label: 'Total Refund',
                value: `₹${(totalRefund || 0).toLocaleString()}`,
                icon: Package,
                color: 'indigo',
                subtext: `${refundedOrders || 0} orders refunded`
            }
        ];
    }, [stats, returns]);

    const STATUS_CONFIG = {
        'pending': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200/80', dot: 'bg-amber-500', label: 'Pending' },
        'approved': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/80', dot: 'bg-blue-500', label: 'Approved' },
        'rejected': { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200/80', dot: 'bg-rose-500', label: 'Rejected' },
        'pickup_scheduled': { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200/80', dot: 'bg-indigo-500', label: 'Pickup Scheduled' },
        'picked_up': { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200/80', dot: 'bg-purple-500', label: 'Picked Up' },
        'quality_inspection': { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200/80', dot: 'bg-orange-500', label: 'Quality Inspection' },
        'refund_processed': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/80', dot: 'bg-emerald-500', label: 'Refund Processed' },
        'completed': { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200/80', dot: 'bg-green-500', label: 'Completed' }
    };

    const statusFilters = ['All', 'Pending', 'Approved', 'Rejected', 'Pickup Scheduled', 'Picked Up', 'Quality Inspection', 'Refund Processed', 'Completed'];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusDisplay = (status) => {
        return STATUS_CONFIG[status]?.label || status?.replace('_', ' ') || 'Unknown';
    };

    const getStatusBadge = (status) => {
        const config = STATUS_CONFIG[status];
        if (!config) return 'bg-gray-50 text-gray-700 border-gray-200';
        return `${config.bg} ${config.color} ${config.border}`;
    };

    if (loading && returns.length === 0) {
        return (
            <div className="h-screen flex flex-col bg-slate-50">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                        <p className="mt-4 text-slate-600 font-medium">Loading returns...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-slate-50/60 font-sans text-slate-800 overflow-hidden">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    activeTab="Shipping Dashboard"
                    onSelectTab={(tab) => {
                        if (tab === 'Dashboard' || tab === 'Shipping Dashboard') {
                            navigate('/shipping-dashboard');
                        }
                    }}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex-1 overflow-y-auto">
                    <main className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

                        {/* PAGE HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 sm:pb-5">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <button
                                    onClick={() => navigate('/shipping-dashboard')}
                                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all shrink-0"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="min-w-0">
                                    <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">Returns Management</h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">Track customer returns, reverse logistics, and pending refunds.</p>
                                </div>
                            </div>
                            <button
                                onClick={fetchReturns}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e2356] text-white text-sm rounded-lg hover:bg-[#1e2356]/90 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>

                        {/* Error/Success Messages */}
                        {error && !isServerDown && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg border border-green-200 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Server Down */}
                        {isServerDown && (
                            <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={fetchReturns}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {/* STATS CARDS */}
                        {stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                                {statsCards.map((stat, index) => {
                                    const Icon = stat.icon;
                                    const colorMap = {
                                        purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
                                        amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
                                        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
                                        red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
                                        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' }
                                    };
                                    const colors = colorMap[stat.color] || colorMap.purple;

                                    return (
                                        <div key={index} className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xs transition-shadow">
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">{stat.value}</p>
                                                {stat.subtext && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{stat.subtext}</p>
                                                )}
                                            </div>
                                            <div className={`mt-2 sm:mt-0 p-2.5 sm:p-3 rounded-lg sm:rounded-xl ring-1 ${colors.ring} ${colors.bg} ${colors.text} inline-block`}>
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* RETURNS CONTAINER */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">

                            {/* SEARCH & FILTER BAR */}
                            <div className="p-3.5 sm:p-5 border-b border-slate-200/80 space-y-3 sm:space-y-4">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Return ID, Order, Customer, Product..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 pl-10 pr-9 py-2 sm:py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
                                        Showing <span className="font-bold text-slate-800">{filteredReturns.length}</span> returns
                                    </div>
                                </div>

                                {/* STATUS FILTER PILLS */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 pl-1 shrink-0">
                                        <Filter className="w-3.5 h-3.5" /> Filter:
                                    </span>
                                    {statusFilters.map((status) => {
                                        const count = status === 'All'
                                            ? stats?.total || 0
                                            : stats?.[status.toLowerCase().replace(' ', '_')] || 0;
                                        const isActive = filterStatus === status;

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${isActive
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                                    }`}
                                            >
                                                <span>{status}</span>
                                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-200/70 text-slate-700'
                                                    }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* MOBILE CARD LIST VIEW */}
                            <div className="block md:hidden divide-y divide-slate-100">
                                {filteredReturns.length > 0 ? (
                                    filteredReturns.map((ret) => {
                                        const statusLabel = getStatusDisplay(ret.status);
                                        const statusStyle = STATUS_CONFIG[ret.status] || STATUS_CONFIG['pending'];

                                        return (
                                            <div key={ret._id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="font-semibold text-sm text-slate-900">{ret.returnId}</span>
                                                        <span className="text-xs text-slate-400 ml-2">({ret.orderNumber})</span>
                                                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(ret.createdAt)}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border} shrink-0`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                                                        {statusLabel}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-slate-600 shrink-0">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-slate-800 truncate">
                                                            {ret.productName || ret.items?.[0]?.productName || 'Multiple Items'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 truncate">
                                                            {ret.itemCount || ret.items?.length || 0} items • {ret.reason?.replace('_', ' ') || 'No reason'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs pt-1">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{ret.customerId?.username || 'Unknown'}</p>
                                                        <p className="text-[11px] text-slate-400">{ret.refundMethod?.replace('_', ' ') || 'N/A'}</p>
                                                    </div>
                                                    <div className="text-right flex items-center gap-3">
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900">{formatCurrency(ret.refundAmount)}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedReturn(ret);
                                                                setShowActionModal(true);
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95"
                                                        >
                                                            Manage
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 text-center text-slate-400">
                                        <RotateCcw className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                                        <p className="text-sm font-medium text-slate-600 mt-2">No returns found</p>
                                        <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
                                    </div>
                                )}
                            </div>

                            {/* DESKTOP TABLE VIEW */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                                            <th className="py-3.5 px-4 sm:px-6">Return Info</th>
                                            <th className="py-3.5 px-4">Product</th>
                                            <th className="py-3.5 px-4">Customer</th>
                                            <th className="py-3.5 px-4">Reason</th>
                                            <th className="py-3.5 px-4">Refund Amount</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredReturns.length > 0 ? (
                                            filteredReturns.map((ret) => {
                                                const statusLabel = getStatusDisplay(ret.status);
                                                const statusStyle = STATUS_CONFIG[ret.status] || STATUS_CONFIG['pending'];

                                                return (
                                                    <tr key={ret._id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="py-4 px-4 sm:px-6">
                                                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                {ret.returnId}
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                                <span>{ret.orderNumber}</span>
                                                                <span>•</span>
                                                                <span>{formatDate(ret.createdAt)}</span>
                                                            </div>
                                                        </td>

                                                        <td className="py-4 px-4 max-w-[200px]">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                                                                    <Package className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="font-medium text-slate-800 truncate block" title={ret.productName || ret.items?.[0]?.productName}>
                                                                        {ret.productName || ret.items?.[0]?.productName || 'Unknown Product'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        {ret.itemCount || ret.items?.length || 0} items
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <div className="font-medium text-slate-800">{ret.customerId?.username || 'Unknown'}</div>
                                                            <div className="text-xs text-slate-400">{ret.customerId?.email || 'No email'}</div>
                                                        </td>

                                                        <td className="py-4 px-4 text-slate-600 max-w-[180px]">
                                                            <span className="inline-block truncate max-w-full" title={ret.reason?.replace('_', ' ') || ''}>
                                                                {ret.reason?.replace('_', ' ') || 'N/A'}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                                                            {formatCurrency(ret.refundAmount)}
                                                        </td>

                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                                                                {statusLabel}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReturn(ret);
                                                                    setShowActionModal(true);
                                                                }}
                                                                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-xs"
                                                            >
                                                                Manage
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="py-12 text-center text-slate-400">
                                                    <div className="max-w-xs mx-auto space-y-2">
                                                        <RotateCcw className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                                                        <p className="text-sm font-medium text-slate-600">No returns found</p>
                                                        <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* TABLE FOOTER */}
                            <div className="p-3.5 sm:p-4 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
                                <span>Showing {filteredReturns.length} active records</span>
                                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Refund Processed
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Rejected
                                    </span>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* ACTION MODAL */}
            {showActionModal && selectedReturn && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">

                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Manage Return</h3>
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-md">
                                        {selectedReturn.returnId}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Order: <span className="font-semibold text-slate-700">{selectedReturn.orderNumber}</span></p>
                            </div>
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                            <div className="p-3 sm:p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-slate-700 shadow-xs shrink-0">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Product Item</p>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                        {selectedReturn.productName || selectedReturn.items?.[0]?.productName || 'Multiple Items'}
                                    </p>
                                    <p className="text-xs text-slate-500">Qty: {selectedReturn.itemCount || selectedReturn.items?.length || 0}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Refund</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900">{formatCurrency(selectedReturn.refundAmount)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Customer</p>
                                    <p className="font-medium text-slate-800 text-xs sm:text-sm mt-0.5 truncate">
                                        {selectedReturn.customerId?.username || 'Unknown'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedReturn.customerId?.email}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Refund Method</p>
                                    <p className="font-medium text-slate-800 text-xs sm:text-sm mt-0.5 truncate">
                                        {selectedReturn.refundMethod?.replace('_', ' ') || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 sm:p-4 text-xs text-amber-900 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-950">Return Reason</p>
                                    <p className="mt-0.5 text-amber-800">{selectedReturn.reason?.replace('_', ' ') || 'N/A'}</p>
                                    {selectedReturn.reasonDescription && (
                                        <p className="mt-1 text-amber-700 text-[11px]">{selectedReturn.reasonDescription}</p>
                                    )}
                                </div>
                            </div>

                            {/* Status Update */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Update Status</label>
                                <select
                                    onChange={(e) => {
                                        const newStatus = e.target.value;
                                        setSelectedReturn({ ...selectedReturn, status: newStatus });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    {statusFilters.filter(s => s !== 'All').map(status => (
                                        <option key={status} value={status.toLowerCase().replace(' ', '_')}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-end gap-2.5 shrink-0">
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to reject this return?')) {
                                        updateReturnStatus(selectedReturn._id, 'rejected', 'Rejected by admin');
                                    }
                                }}
                                disabled={actionLoading}
                                className="w-full sm:w-auto px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject Return'}
                            </button>
                            <button
                                onClick={() => {
                                    const currentStatus = selectedReturn.status;
                                    let nextStatus = '';
                                    const statusFlow = ['pending', 'approved', 'pickup_scheduled', 'picked_up', 'quality_inspection', 'refund_processed', 'completed'];
                                    const currentIndex = statusFlow.indexOf(currentStatus);
                                    if (currentIndex < statusFlow.length - 1) {
                                        nextStatus = statusFlow[currentIndex + 1];
                                    } else {
                                        nextStatus = 'completed';
                                    }
                                    updateReturnStatus(selectedReturn._id, nextStatus, `Status updated to ${nextStatus}`);
                                }}
                                disabled={actionLoading}
                                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve & Next Step'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingReturns;