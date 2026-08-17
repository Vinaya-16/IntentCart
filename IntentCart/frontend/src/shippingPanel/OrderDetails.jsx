import React, { useState, useEffect, useMemo } from 'react';
import {
    Truck,
    Package,
    Clock,
    CheckCircle,
    AlertCircle,
    Search,
    Eye,
    RefreshCw,
    Loader2,
    User,
    Calendar,
    IndianRupee,
    Box,
    ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/shipping';

const ShippingDashboard = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [stats, setStats] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const getToken = () => localStorage.getItem('token');

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

            // Get ALL orders
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
                window.location.href = '/intentCart-auth';
                return;
            }

            if (!ordersRes.ok) {
                throw new Error('Failed to fetch orders');
            }

            const ordersData = await ordersRes.json();
            // console.log('Full orders response:', ordersData); // 

            // Check where the orders are in the response
            let ordersList = [];
            if (ordersData.success) {
                // Try different possible locations of the orders array
                ordersList = ordersData.orders || ordersData.data || ordersData.result || [];

                // If orders is an object with items, get the items
                if (ordersList.items && Array.isArray(ordersList.items)) {
                    ordersList = ordersList.items;
                }

                // If it's paginated with data property
                if (ordersList.data && Array.isArray(ordersList.data)) {
                    ordersList = ordersList.data;
                }

                // console.log('Extracted orders:', ordersList);
                // console.log('Orders count:', ordersList.length);

                setOrders(ordersList);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setStats(statsData.stats);
                    // console.log('Stats:', statsData.stats);
                }
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Update order status
    const updateOrderStatus = async (orderId, status) => {
        try {
            setActionLoading(orderId);

            const token = getToken();
            if (!token) {
                setError('Please login first');
                return;
            }

            const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            const data = await response.json();

            if (data.success) {
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        (order.id === orderId || order._id === orderId)
                            ? { ...order, status: status }
                            : order
                    )
                );
                setSuccess(`Order status updated to ${status}`);
                setTimeout(() => setSuccess(''), 3000);
                fetchStats();
            }
        } catch (err) {
            console.error('Error updating order:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setActionLoading(null);
        }
    };

    const fetchStats = async () => {
        try {
            const token = getToken();
            if (!token) return;

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
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Get order status
    const getOrderStatus = (order) => {
        return (order.status || order.shippingStatus || '').toLowerCase().trim();
    };

    // Check if order matches filter
    const matchesStatus = (order, filter) => {
        if (filter === 'all') return true;
        const status = getOrderStatus(order);
        return status === filter.toLowerCase();
    };

    // Filter orders
    const filteredOrders = useMemo(() => {
        let result = orders;

        // Status filter
        if (filterStatus !== 'all') {
            result = result.filter(order => matchesStatus(order, filterStatus));
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(order =>
                (order.orderId || order.id || '').toLowerCase().includes(query) ||
                (order.customer || '').toLowerCase().includes(query) ||
                (order.email || '').toLowerCase().includes(query) ||
                (order.product || '').toLowerCase().includes(query)
            );
        }

        return result;
    }, [orders, filterStatus, searchQuery]);

    const statusOptions = [
        { value: 'all', label: 'All Orders', icon: ClipboardList },
        { value: 'pending', label: 'Pending', icon: Clock },
        { value: 'processing', label: 'Processing', icon: Package },
        { value: 'shipped', label: 'Shipped', icon: Truck },
        { value: 'delivered', label: 'Delivered', icon: CheckCircle },
        { value: 'cancelled', label: 'Cancelled', icon: AlertCircle }
    ];

    const getStatusBadge = (status) => {
        const statusStr = (status || '').toLowerCase().trim();
        const badges = {
            'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'processing': 'bg-blue-50 text-blue-700 border-blue-200',
            'shipped': 'bg-purple-50 text-purple-700 border-purple-200',
            'delivered': 'bg-green-50 text-green-700 border-green-200',
            'cancelled': 'bg-red-50 text-red-700 border-red-200',
            'refunded': 'bg-gray-50 text-gray-700 border-gray-200'
        };
        return badges[statusStr] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getStatusIcon = (status) => {
        const statusStr = (status || '').toLowerCase().trim();
        const icons = {
            'pending': Clock,
            'processing': Package,
            'shipped': Truck,
            'delivered': CheckCircle,
            'cancelled': AlertCircle,
            'refunded': AlertCircle
        };
        return icons[statusStr] || Clock;
    };

    // Use stats for counts if available, otherwise calculate from orders
    const getStatusCount = (status) => {
        if (status === 'all') {
            // Use stats total if available, otherwise use orders length
            return stats?.total || orders.length;
        }
        // Use stats for individual status counts
        if (stats && stats[status] !== undefined) {
            return stats[status] || 0;
        }
        // Fallback to counting from orders
        return orders.filter(order => matchesStatus(order, status)).length;
    };

    const handleViewOrder = (order) => {
        const orderId = order.id || order._id;
        if (orderId) {
            navigate(`/shipping/order/${orderId}`, {
                state: {
                    orderId: orderId,
                    order: order
                }
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#1e2356] mx-auto" />
                    <p className="mt-4 text-slate-600 font-medium">Loading shipping dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
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
                    <main className="p-4 sm:p-8 flex-1 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#1e2356] flex items-center gap-2">
                                    <Truck className="w-7 h-7 text-[#1e2356]" />
                                    Order Management
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Manage and track all orders</p>
                            </div>
                            <button
                                onClick={fetchData}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e2356] text-white text-sm rounded-lg hover:bg-[#1e2356]/90 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg border border-green-200 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Total</p>
                                            <p className="text-xl font-bold text-[#1e2356]">{stats.total || 0}</p>
                                        </div>
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <ClipboardList className="w-5 h-5 text-slate-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Pending</p>
                                            <p className="text-xl font-bold text-yellow-600">{stats.pending || 0}</p>
                                        </div>
                                        <div className="p-2 bg-yellow-50 rounded-lg">
                                            <Clock className="w-5 h-5 text-yellow-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Processing</p>
                                            <p className="text-xl font-bold text-blue-600">{stats.processing || 0}</p>
                                        </div>
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Package className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Shipped</p>
                                            <p className="text-xl font-bold text-purple-600">{stats.shipped || 0}</p>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <Truck className="w-5 h-5 text-purple-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Delivered</p>
                                            <p className="text-xl font-bold text-green-600">{stats.delivered || 0}</p>
                                        </div>
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">Revenue</p>
                                            <p className="text-xl font-bold text-[#1e2356]">
                                                ₹{stats.revenue?.total?.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <IndianRupee className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search orders by ID, customer, email, or product..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2356]/20 focus:border-[#1e2356] transition-all"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {statusOptions.map((option) => {
                                    const Icon = option.icon;
                                    const count = getStatusCount(option.value);
                                    const isActive = filterStatus === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => setFilterStatus(option.value)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${isActive
                                                ? 'bg-[#1e2356] text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {option.label}
                                            {count > 0 && (
                                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Orders Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-16">
                                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-600">No orders found</h3>
                                    <p className="text-sm text-slate-400">
                                        {searchQuery || filterStatus !== 'all'
                                            ? 'Try adjusting your filters or search query'
                                            : 'All orders will appear here'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#1e2356] text-white text-xs font-semibold uppercase tracking-wider">
                                                <th className="py-3.5 px-4">Order ID</th>
                                                <th className="py-3.5 px-4">Customer</th>
                                                <th className="py-3.5 px-4">Product</th>
                                                <th className="py-3.5 px-4">Amount</th>
                                                <th className="py-3.5 px-4">Payment</th>
                                                <th className="py-3.5 px-4">Status</th>
                                                <th className="py-3.5 px-4">Date</th>
                                                <th className="py-3.5 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-sm bg-white">
                                            {filteredOrders.map((order) => {
                                                const orderStatus = getOrderStatus(order);
                                                const StatusIcon = getStatusIcon(orderStatus);
                                                const orderId = order.id || order._id;
                                                const isActionLoading = actionLoading === orderId;

                                                return (
                                                    <tr key={orderId} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                                                            {order.orderId || orderId?.slice(-6)}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{order.customer}</p>
                                                                    <p className="text-xs text-slate-400">{order.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <Package className="w-4 h-4 text-slate-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-800 truncate max-w-[150px]">
                                                                        {order.product}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400">Qty: {order.quantity || 1}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 font-bold text-[#1e2356]">
                                                            ₹{order.total?.toLocaleString() || 0}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${order.paymentStatus === 'paid'
                                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                                : order.paymentStatus === 'pending'
                                                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                                                }`}>
                                                                {order.paymentStatus || 'pending'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(orderStatus)}`}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1) || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {order.date}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {orderStatus === 'pending' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (orderId) updateOrderStatus(orderId, 'processing');
                                                                        }}
                                                                        disabled={isActionLoading}
                                                                        className="p-1.5 rounded-md text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                                        title="Start Processing"
                                                                    >
                                                                        {isActionLoading ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Package className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}

                                                                {orderStatus === 'processing' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (orderId) updateOrderStatus(orderId, 'shipped');
                                                                        }}
                                                                        disabled={isActionLoading}
                                                                        className="p-1.5 rounded-md text-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                                                                        title="Mark as Shipped"
                                                                    >
                                                                        {isActionLoading ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Truck className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}

                                                                {orderStatus === 'shipped' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (orderId) updateOrderStatus(orderId, 'delivered');
                                                                        }}
                                                                        disabled={isActionLoading}
                                                                        className="p-1.5 rounded-md text-green-500 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                                                                        title="Mark as Delivered"
                                                                    >
                                                                        {isActionLoading ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}

                                                                {!['delivered', 'cancelled', 'refunded'].includes(orderStatus) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (window.confirm('Are you sure you want to cancel this order?')) {
                                                                                if (orderId) updateOrderStatus(orderId, 'cancelled');
                                                                            }
                                                                        }}
                                                                        disabled={isActionLoading}
                                                                        className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                        title="Cancel Order"
                                                                    >
                                                                        {isActionLoading ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <AlertCircle className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                            <span>
                                Showing {filteredOrders.length} of {orders.length} orders
                            </span>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    Pending: {getStatusCount('pending')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Processing: {getStatusCount('processing')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    Shipped: {getStatusCount('shipped')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Delivered: {getStatusCount('delivered')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Cancelled: {getStatusCount('cancelled')}
                                </span>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ShippingDashboard;