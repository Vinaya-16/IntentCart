import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowRight,
    Loader2,
    WifiOff,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Calendar,
    IndianRupee,
    X,
    RotateCcw
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const API_BASE_URI = import.meta.env.VITE_APP_URL;

const API_URL = `${API_BASE_URI}/customer` || 'http://localhost:5000/api/customer';
const RETURN_API_URL = `${API_BASE_URI}/returns` || 'http://localhost:5000/api/returns';

export default function OrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [cancelling, setCancelling] = useState(null);
    const [returnStatuses, setReturnStatuses] = useState({});
    const [returnFilter, setReturnFilter] = useState('all');

    const getToken = () => localStorage.getItem('token');

    // Fetch orders
    const fetchOrders = async () => {
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

            const url = statusFilter === 'all'
                ? `${API_URL}/orders`
                : `${API_URL}/orders?status=${statusFilter}`;

            const response = await fetch(url, {
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
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();
            if (data.success) {
                setOrders(data.orders || []);
                if (data.orders && data.orders.length > 0) {
                    await fetchReturnStatuses(data.orders);
                }
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
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

    // Fetch return statuses
    const fetchReturnStatuses = async (ordersList) => {
        try {
            const token = getToken();
            if (!token) return;

            const statuses = {};

            for (const order of ordersList) {
                try {
                    const response = await fetch(`${RETURN_API_URL}/order/${order._id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.return) {
                            statuses[order._id] = data.return.status;
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching return for order ${order._id}:`, err);
                }
            }

            setReturnStatuses(statuses);
        } catch (err) {
            console.error('Error fetching return statuses:', err);
        }
    };

    // Cancel order
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        try {
            setCancelling(orderId);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setCancelling(null);
                return;
            }

            const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Customer requested cancellation' })
            });

            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }

            const data = await response.json();
            if (data.success) {
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order._id === orderId
                            ? { ...order, status: 'cancelled', cancelledAt: new Date() }
                            : order
                    )
                );
                alert('Order cancelled successfully');
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
            setError(err.message);
        } finally {
            setCancelling(null);
        }
    };

    // Check if order can be returned
    const canReturnOrder = (order) => {
        if (order.status !== 'delivered') return false;

        const returnStatus = returnStatuses[order._id];
        if (returnStatus && !['rejected', 'completed'].includes(returnStatus)) {
            return false;
        }

        if (order.deliveredAt) {
            const deliveredDate = new Date(order.deliveredAt);
            const now = new Date();
            const daysSinceDelivery = (now - deliveredDate) / (1000 * 60 * 60 * 24);
            return daysSinceDelivery <= 7;
        }

        return false;
    };

    // Get return status display
    const getReturnStatusDisplay = (orderId) => {
        const status = returnStatuses[orderId];
        if (!status) return null;

        const statusMap = {
            'pending': { label: 'Return Pending', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            'approved': { label: 'Approved', color: 'text-blue-600 bg-blue-50 border-blue-200' },
            'rejected': { label: 'Rejected', color: 'text-red-600 bg-red-50 border-red-200' },
            'pickup_scheduled': { label: 'Pickup Scheduled', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            'picked_up': { label: 'Picked Up', color: 'text-purple-600 bg-purple-50 border-purple-200' },
            'quality_inspection': { label: 'Quality Check', color: 'text-orange-600 bg-orange-50 border-orange-200' },
            'refund_processed': { label: 'Refund Processed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            'completed': { label: 'Completed', color: 'text-green-600 bg-green-50 border-green-200' }
        };

        return statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
    };

    // Navigate to return page
    const handleReturnOrder = (order) => {
        navigate(`/returns/create/${order._id}`, {
            state: { order }
        });
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    // Get status icon and color
    const getStatusInfo = (status) => {
        switch (status) {
            case 'delivered':
                return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' };
            case 'shipped':
                return { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Shipped' };
            case 'processing':
                return { icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Processing' };
            case 'pending':
                return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Pending' };
            case 'cancelled':
                return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' };
            default:
                return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50', label: status };
        }
    };

    // Get status badge color
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'shipped':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'processing':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'pending':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filters
    const statusFilters = [
        { value: 'all', label: 'All Orders' },
        { value: 'delivered', label: 'Completed' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'processing', label: 'Processing' },
        { value: 'pending', label: 'Pending' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const returnFilters = [
        { value: 'all', label: 'All' },
        { value: 'has_return', label: 'Has Return' },
        { value: 'can_return', label: 'Can Return' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'refund_processed', label: 'Refunded' },
        { value: 'completed', label: 'Completed' }
    ];

    // Filter orders by return status
    const filteredOrders = () => {
        if (returnFilter === 'all') return orders;

        return orders.filter(order => {
            const returnStatus = returnStatuses[order._id];

            if (returnFilter === 'has_return') return !!returnStatus;
            if (returnFilter === 'can_return') return canReturnOrder(order);

            return returnStatus === returnFilter;
        });
    };

    const displayOrders = filteredOrders();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/60">
                <Header />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Orders</h1>
                        <p className="text-sm text-slate-500 mt-1">Track and manage your orders</p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Error/Success Messages */}
                {error && !isServerDown && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                        <X className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {isServerDown && (
                    <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                        <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                        <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={fetchOrders}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry Connection
                        </button>
                    </div>
                )}

                {/* Order Status Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {statusFilters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${statusFilter === filter.value
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Return Status Filters */}
                <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-slate-200">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-1">
                        <RotateCcw className="w-3 h-3" /> Returns:
                    </span>
                    {returnFilters.map((filter) => {
                        const count = filter.value === 'all'
                            ? orders.length
                            : filter.value === 'has_return'
                                ? orders.filter(o => returnStatuses[o._id]).length
                                : filter.value === 'can_return'
                                    ? orders.filter(o => canReturnOrder(o)).length
                                    : orders.filter(o => returnStatuses[o._id] === filter.value).length;

                        return (
                            <button
                                key={filter.value}
                                onClick={() => setReturnFilter(filter.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${returnFilter === filter.value
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                            >
                                {filter.label}
                                {count > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${returnFilter === filter.value
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Orders List */}
                {displayOrders.length > 0 ? (
                    <div className="space-y-4">
                        {displayOrders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const StatusIcon = statusInfo.icon;
                            const isExpanded = expandedOrder === order._id;
                            const isCancelling = cancelling === order._id;
                            const canReturn = canReturnOrder(order);
                            const returnInfo = getReturnStatusDisplay(order._id);

                            return (
                                <div
                                    key={order._id}
                                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
                                >
                                    {/* Order Header */}
                                    <div
                                        className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${statusInfo.bg}`}>
                                                    <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-slate-900">#{order.orderId}</span>
                                                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadgeColor(order.status)}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                        {returnInfo && (
                                                            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${returnInfo.color}`}>
                                                                {returnInfo.label}
                                                            </span>
                                                        )}
                                                        {canReturn && (
                                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Return Available
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(order.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500">Total</p>
                                                    <p className="text-lg font-bold text-indigo-600">Rs.{order.total?.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500">Items</p>
                                                    <p className="text-sm font-semibold text-slate-900">{order.items?.length || 0}</p>
                                                </div>
                                                <button className="p-1 text-slate-400 hover:text-slate-600">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Details (Expanded) */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Items */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Items</h4>
                                                    <div className="space-y-3">
                                                        {order.items?.map((item, index) => (
                                                            <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                                                                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                                                    {item.image ? (
                                                                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                            <Package className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                                                                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                                </div>
                                                                <span className="text-sm font-semibold text-slate-900">Rs.{item.total?.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Order Info */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Order Details</h4>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Order ID</span>
                                                            <span className="font-medium text-slate-900">{order.orderId}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Payment Method</span>
                                                            <span className="font-medium text-slate-900 capitalize">{order.paymentMethod?.replace('_', ' ')}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Payment Status</span>
                                                            <span className={`font-medium capitalize ${order.paymentStatus === 'paid'
                                                                ? 'text-emerald-600'
                                                                : order.paymentStatus === 'failed'
                                                                    ? 'text-red-600'
                                                                    : 'text-amber-600'
                                                                }`}>
                                                                {order.paymentStatus === 'pending' && 'Pending'}
                                                                {order.paymentStatus === 'paid' && 'Paid'}
                                                                {order.paymentStatus === 'failed' && 'Failed'}
                                                                {order.paymentStatus === 'refunded' && 'Refunded'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Subtotal</span>
                                                            <span className="font-medium text-slate-900">Rs.{order.subtotal?.toLocaleString()}</span>
                                                        </div>
                                                        {order.shippingCost > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Shipping</span>
                                                                <span className="font-medium text-slate-900">Rs.{order.shippingCost}</span>
                                                            </div>
                                                        )}
                                                        {order.discount > 0 && (
                                                            <div className="flex justify-between text-emerald-600">
                                                                <span>Discount</span>
                                                                <span>-Rs.{order.discount}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between pt-2 border-t border-slate-100">
                                                            <span className="font-semibold text-slate-900">Total</span>
                                                            <span className="font-bold text-indigo-600">Rs.{order.total?.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Shipping Address */}
                                                    {order.shippingAddress && (
                                                        <div className="mt-3 bg-white p-4 rounded-xl border border-slate-100">
                                                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Shipping Address</h5>
                                                            <p className="text-sm text-slate-700">{order.shippingAddress.street}</p>
                                                            <p className="text-sm text-slate-700">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                                                            <p className="text-sm text-slate-700">{order.shippingAddress.country}</p>
                                                            <p className="text-sm text-slate-700">Phone: {order.shippingAddress.phone}</p>
                                                        </div>
                                                    )}

                                                    {/* Tracking Info */}
                                                    {order.trackingNumber && (
                                                        <div className="mt-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                            <p className="text-xs font-semibold text-blue-700">Tracking Number</p>
                                                            <p className="text-sm font-medium text-blue-900">{order.trackingNumber}</p>
                                                        </div>
                                                    )}

                                                    {/* Return Status */}
                                                    {returnInfo && (
                                                        <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Status</p>
                                                            <p className={`text-sm font-medium ${returnInfo.color.split(' ')[0]}`}>
                                                                {returnInfo.label}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        disabled={isCancelling}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition disabled:opacity-50"
                                                    >
                                                        {isCancelling ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4" />
                                                        )}
                                                        Cancel Order
                                                    </button>
                                                )}

                                                {canReturn && (
                                                    <button
                                                        onClick={() => handleReturnOrder(order)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        Request Return
                                                    </button>
                                                )}

                                                {order.status === 'delivered' && (
                                                    <Link
                                                        to={`/order/${order._id}/review`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                                                    >
                                                        Write a Review
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs max-w-lg mx-auto">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-indigo-50/50">
                            <Package className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Orders Found</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed max-w-xs mx-auto">
                            {returnFilter !== 'all'
                                ? 'No orders match the selected return filter.'
                                : "You haven't placed any orders yet. Start shopping!"}
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs tracking-wide uppercase hover:bg-indigo-700 transition shadow-sm"
                        >
                            Start Shopping <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* Order Count */}
                {displayOrders.length > 0 && (
                    <div className="mt-6 text-center text-sm text-slate-500">
                        Showing {displayOrders.length} {displayOrders.length === 1 ? 'order' : 'orders'}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}