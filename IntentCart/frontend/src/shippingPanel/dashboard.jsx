import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Package,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    RefreshCw,
    Search,
    X,
    RotateCcw,
    Loader2,
    WifiOff,
    ShoppingBag
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/shipping';

// Backend valid statuses from your controller
const BACKEND_STATUSES = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'];

// UI Status mapping with display names and colors
const STATUS_CONFIG = {
    'pending': {
        display: 'Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        color: '#d97706'
    },
    'processing': {
        display: 'Processing',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        color: '#3b82f6'
    },
    'packed': {
        display: 'Packed',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        color: '#f59e0b'
    },
    'shipped': {
        display: 'Shipped',
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        color: '#6366f1'
    },
    'delivered': {
        display: 'Delivered',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        color: '#10b981'
    },
    'cancelled': {
        display: 'Cancelled',
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        color: '#ef4444'
    },
    'refunded': {
        display: 'Refunded',
        bg: 'bg-pink-100',
        text: 'text-pink-700',
        border: 'border-pink-200',
        color: '#ec4899'
    },
    'returned': {
        display: 'Returned',
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        border: 'border-rose-200',
        color: '#f43f5e'
    }
};

// Chart colors for pie chart
const CHART_COLORS = ['#3b82f6', '#f59e0b', '#6366f1', '#10b981', '#ef4444', '#f43f5e', '#ec4899'];

const ShippingDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Shipping Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data States
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    const getToken = () => localStorage.getItem('token');

    // Format order from backend
    const formatOrder = (order) => {
        const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];

        return {
            id: order.orderId || order.id?.slice(-6) || 'N/A',
            _id: order.id || order._id,
            customer: order.customer || 'Unknown Customer',
            product: order.product || 'Multiple Items',
            qty: order.quantity || order.items?.length || 1,
            address: order.address || 'No address provided',
            payment: order.payment || 'Not specified',
            status: order.status || 'pending',
            displayStatus: statusConfig.display,
            date: order.date || new Date().toLocaleDateString(),
            total: order.total || 0,
            trackingNumber: order.trackingNumber || '',
            isAssignedToMyDriver: order.isAssignedToMyDriver || false,
            assignedDriver: order.assignedDriver || null
        };
    };

    // Fetch data from backend
    const fetchData = useCallback(async () => {
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

            const [ordersRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/orders?limit=1000`, {
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

            if (ordersRes.status === 401 || statsRes.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/intentCart-auth');
                return;
            }

            if (!ordersRes.ok) {
                const errorData = await ordersRes.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch orders');
            }

            const ordersData = await ordersRes.json();
            if (ordersData.success) {
                const formattedOrders = ordersData.orders.map(formatOrder);
                setOrders(formattedOrders);
            } else {
                setOrders([]);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setStats(statsData.stats);
                } else {
                    setStats(null);
                }
            } else {
                setStats(null);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            if (err.message === 'Failed to fetch' || err.message.includes('ERR_CONNECTION_REFUSED')) {
                setIsServerDown(true);
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError(err.message || 'Failed to load data');
            }
            setOrders([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Update order status
    const updateOrderStatus = useCallback(async (orderId, newStatus) => {
        try {
            setActionLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update order status');
            }

            const data = await response.json();
            if (data.success) {
                setOrders(prev =>
                    prev.map(order =>
                        order._id === orderId
                            ? {
                                ...order,
                                status: newStatus,
                                displayStatus: STATUS_CONFIG[newStatus]?.display || newStatus
                            }
                            : order
                    )
                );
                setShowTrackingModal(false);
                setSelectedOrder(null);

                // Refresh stats
                try {
                    const token = getToken();
                    const statsRes = await fetch(`${API_URL}/stats`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (statsRes.ok) {
                        const statsData = await statsRes.json();
                        if (statsData.success) {
                            setStats(statsData.stats);
                        }
                    }
                } catch (statsErr) {
                    console.error('Error fetching stats:', statsErr);
                }
            }
        } catch (err) {
            console.error('Error updating status:', err);
            setError(err.message || 'Failed to update status');
            setTimeout(() => setError(''), 3000);
        } finally {
            setActionLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter orders
    const filteredOrders = useMemo(() => {
        let result = orders;

        if (filterStatus !== 'All') {
            result = result.filter(order => order.status === filterStatus.toLowerCase());
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(order =>
                (order.id?.toLowerCase().includes(query) || false) ||
                (order.customer?.toLowerCase().includes(query) || false) ||
                (order.product?.toLowerCase().includes(query) || false)
            );
        }

        return result;
    }, [orders, searchQuery, filterStatus]);

    // Prepare pie chart data - Only show important statuses
    const pieData = useMemo(() => {
        if (!stats) return [];

        const data = [
            { name: 'Processing', value: stats.processing || 0, color: CHART_COLORS[0] },
            { name: 'Shipped', value: stats.shipped || 0, color: CHART_COLORS[1] },
            { name: 'Delivered', value: stats.delivered || 0, color: CHART_COLORS[2] },
            { name: 'Cancelled', value: stats.cancelled || 0, color: CHART_COLORS[3] },
            { name: 'Returned', value: stats.returned || stats.totalReturned || 0, color: CHART_COLORS[4] },
        ].filter(item => item.value > 0);

        // If no data, show placeholder
        return data.length > 0 ? data : [
            { name: 'No Orders', value: 1, color: '#e5e7eb' }
        ];
    }, [stats]);

    // Generate status filters from actual orders
    const statusFilters = useMemo(() => {
        const filters = ['All'];
        const uniqueStatuses = new Set();
        orders.forEach(order => {
            if (order.status && BACKEND_STATUSES.includes(order.status)) {
                uniqueStatuses.add(order.status);
            }
        });

        const statusOrder = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'];
        const sortedStatuses = Array.from(uniqueStatuses).sort((a, b) => {
            return statusOrder.indexOf(a) - statusOrder.indexOf(b);
        });

        sortedStatuses.forEach(status => {
            const config = STATUS_CONFIG[status];
            if (config) {
                filters.push(config.display);
            } else {
                filters.push(status.charAt(0).toUpperCase() + status.slice(1));
            }
        });

        return filters;
    }, [orders]);

    // Get available statuses for modal
    const getAvailableStatuses = () => {
        return [
            { display: 'Processing', value: 'processing' },
            { display: 'Packed', value: 'packed' },
            { display: 'Shipped', value: 'shipped' },
            { display: 'Delivered', value: 'delivered' },
            { display: 'Cancelled', value: 'cancelled' },
            { display: 'Returned', value: 'returned' }
        ];
    };

    // Handle modal close
    const handleModalClose = () => {
        setShowTrackingModal(false);
        setSelectedOrder(null);
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col bg-slate-50">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-[#1e2356] mx-auto" />
                        <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex-1 overflow-y-auto">
                    <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">

                        {/* Error/Success Messages */}
                        {error && !isServerDown && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {isServerDown && (
                            <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={fetchData}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {/* HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-[#1e2356]">{activeTab}</h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage order fulfillment, tracking, and returns.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs sm:text-sm text-sky-700 font-medium bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* STATS CARDS - Only Most Important */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                            {/* Total Orders */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Total Orders</p>
                                    <p className="text-xl font-bold text-[#1e2356]">{stats?.total || 0}</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-100" style={{ color: '#1e2356' }}>
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Processing */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Processing</p>
                                    <p className="text-xl font-bold text-[#1e2356]">{stats?.processing || 0}</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-blue-50" style={{ color: '#3b82f6' }}>
                                    <Package className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Shipped */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Shipped</p>
                                    <p className="text-xl font-bold text-[#1e2356]">{stats?.shipped || 0}</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-indigo-50" style={{ color: '#6366f1' }}>
                                    <Truck className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Delivered */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Delivered</p>
                                    <p className="text-xl font-bold text-[#1e2356]">{stats?.delivered || 0}</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-emerald-50" style={{ color: '#10b981' }}>
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Returns */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Returns</p>
                                    <p className="text-xl font-bold text-[#1e2356]">{stats?.returned || stats?.totalReturned || 0}</p>
                                    {stats?.returns?.completed > 0 && (
                                        <p className="text-[10px] text-slate-400 mt-0.5">{stats.returns.completed} completed</p>
                                    )}
                                </div>
                                <div className="p-2.5 rounded-lg bg-rose-50" style={{ color: '#f43f5e' }}>
                                    <RotateCcw className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* PIE CHART - Only Important Statuses */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-8">
                            <div className="w-full lg:w-1/2 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">Order Status Distribution</h3>
                                <div className="h-52 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={85}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-medium text-slate-700 pt-4 border-t lg:border-t-0 lg:pt-0 border-slate-100">
                                {pieData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || CHART_COLORS[idx % CHART_COLORS.length] }} />
                                        <span className="truncate">{item.name}</span>
                                        <span className="text-slate-400 ml-auto font-semibold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ORDER TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Order ID, Customer, Product..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2356]/20 focus:border-[#1e2356] transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-thin">
                                    {statusFilters.length > 0 ? (
                                        statusFilters.map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${filterStatus === status
                                                    ? 'bg-[#1e2356] text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))
                                    ) : (
                                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1e2356] text-white shadow-sm">
                                            All
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                            <th className="py-3 px-4">Order ID</th>
                                            <th className="py-3 px-4">Customer</th>
                                            <th className="py-3 px-4">Product</th>
                                            <th className="py-3 px-4 text-center">Qty</th>
                                            <th className="py-3 px-4">Total</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order) => {
                                                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                                                return (
                                                    <tr key={order.id || order._id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3.5 px-4 font-semibold text-slate-800">{order.id}</td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="font-medium text-slate-800">{order.customer}</div>
                                                            <div className="text-xs text-slate-400">{order.address}</div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600">{order.product}</td>
                                                        <td className="py-3.5 px-4 text-center text-slate-600">{order.qty}</td>
                                                        <td className="py-3.5 px-4 font-semibold text-slate-800">Rs.{order.total.toLocaleString()}</td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                                {statusConfig.display}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-slate-400 text-sm">
                                                    {error ? 'Unable to load orders' : 'No orders found matching your search parameters.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                                <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Delivered</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Processing</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Cancelled</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Returned</span>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* MODAL: Shipment Management */}
            {showTrackingModal && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleModalClose}>
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-[#1e2356]">Update Shipment Status</h3>
                                <p className="text-xs text-slate-500">Order ID: <span className="font-semibold text-slate-800">{selectedOrder.id}</span></p>
                            </div>
                            <button
                                onClick={handleModalClose}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                                disabled={actionLoading}
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <label className="block font-semibold text-slate-500 mb-0.5">Customer</label>
                                    <p className="font-medium text-slate-800 text-sm">{selectedOrder.customer}</p>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-500 mb-0.5">Total Amount</label>
                                    <p className="font-medium text-slate-800 text-sm">Rs.{selectedOrder.total.toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block font-semibold text-slate-500 mb-0.5">Delivery Address</label>
                                    <p className="font-medium text-slate-800 text-sm">{selectedOrder.address}</p>
                                </div>
                                {selectedOrder.trackingNumber && (
                                    <div className="col-span-2">
                                        <label className="block font-semibold text-slate-500 mb-0.5">Tracking Number</label>
                                        <p className="font-medium text-slate-800 text-sm">{selectedOrder.trackingNumber}</p>
                                    </div>
                                )}
                                {selectedOrder.assignedDriver && (
                                    <div className="col-span-2">
                                        <label className="block font-semibold text-slate-500 mb-0.5">Assigned Driver</label>
                                        <p className="font-medium text-slate-800 text-sm">
                                            {selectedOrder.assignedDriver.name}
                                            {selectedOrder.assignedDriver.phone && ` (${selectedOrder.assignedDriver.phone})`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {actionLoading && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#1e2356]" />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-3">Select New Status</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {getAvailableStatuses().map((status) => {
                                        const config = STATUS_CONFIG[status.value];
                                        const isActive = selectedOrder.status === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                onClick={() => updateOrderStatus(selectedOrder._id, status.value)}
                                                disabled={actionLoading || isActive}
                                                className={`px-3 py-2.5 border rounded-lg text-xs font-medium transition-all ${isActive
                                                    ? 'bg-[#1e2356] text-white border-[#1e2356]'
                                                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {status.display}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingDashboard;