import React, { useState, useEffect } from 'react';
import {
    Bell,
    User,
    ChevronDown,
    Search,
    Plus,
    Eye,
    Printer,
    Loader2,
    WifiOff,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    Package,
    X,
    FileText,
    Mail,
    Check
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/merchant';

const OrderManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        avgOrderValue: 0,
        totalRevenue: 0
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

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

            const response = await fetch(`${API_URL}/orders`, {
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
                setStats({
                    totalOrders: data.total || 0,
                    pendingOrders: data.pendingOrders || 0,
                    completedOrders: data.completedOrders || 0,
                    avgOrderValue: data.avgOrderValue || 0,
                    totalRevenue: data.totalRevenue || 0
                });
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

    // Fetch single order details
    const fetchOrderDetails = async (orderId) => {
        try {
            setActionLoading(orderId);
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            const data = await response.json();
            if (data.success) {
                setSelectedOrder(data.order);
                setShowOrderModal(true);
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Update order status
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            setActionLoading(orderId);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
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
                throw new Error('Failed to update order status');
            }

            const data = await response.json();
            if (data.success) {
                setOrders(prev =>
                    prev.map(order =>
                        order._id === orderId ? { ...order, status: newStatus } : order
                    )
                );
                setSuccess(`Order status updated to ${newStatus}`);
                setTimeout(() => setSuccess(''), 3000);
                fetchStats();
            }
        } catch (err) {
            console.error('Error updating order:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Print invoice
    const handlePrintInvoice = (order) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to print invoices');
            return;
        }

        const itemsHtml = order.items?.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName || item.productId?.name || 'Product'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rs. ${item.price}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rs. ${item.total}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${order.orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #1e3a6a; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { color: #1e3a6a; margin: 0; }
                    .order-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .order-info div { font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #1e3a6a; color: white; padding: 10px; text-align: left; }
                    .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
                    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .status-delivered { background: #d1fae5; color: #065f46; }
                    .status-shipped { background: #dbeafe; color: #1e40af; }
                    .status-processing { background: #fef3c7; color: #92400e; }
                    .status-pending { background: #f3f4f6; color: #4b5563; }
                    .status-cancelled { background: #fee2e2; color: #991b1b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>IntentCart</h1>
                    <p>Invoice #${order.orderId}</p>
                </div>

                <div class="order-info">
                    <div>
                        <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
                        <strong>Order Status:</strong> <span class="status status-${order.status}">${order.status.toUpperCase()}</span>
                    </div>
                    <div>
                        <strong>Customer:</strong> ${order.customerId?.name || order.customerId?.username || 'Unknown'}<br>
                        <strong>Email:</strong> ${order.customerId?.email || 'N/A'}
                    </div>
                </div>

                <h3>Order Items</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total">
                    <p>Subtotal: Rs. ${order.subtotal?.toLocaleString()}</p>
                    ${order.discount > 0 ? `<p>Discount: -Rs. ${order.discount}</p>` : ''}
                    ${order.shippingCost > 0 ? `<p>Shipping: Rs. ${order.shippingCost}</p>` : ''}
                    <p style="font-size: 24px; color: #1e3a6a;">Total: Rs. ${order.total?.toLocaleString()}</p>
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>${order.shippingAddress?.street ? `Shipping to: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}` : ''}</p>
                    <p>© ${new Date().getFullYear()} IntentCart. All rights reserved.</p>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/orders/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json();
            if (data.success) {
                setStats({
                    totalOrders: data.stats.totalOrders || 0,
                    pendingOrders: data.stats.pendingOrders || 0,
                    completedOrders: data.stats.deliveredOrders || 0,
                    avgOrderValue: data.stats.avgOrderValue || 0,
                    totalRevenue: data.stats.totalRevenue || 0
                });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filter orders
    const filteredOrders = orders.filter(o =>
        o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get status styles
    const getStatusBadge = (status) => {
        switch (status) {
            case 'delivered':
                return <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs"><CheckCircle className="w-3 h-3" /> Delivered</span>;
            case 'shipped':
                return <span className="inline-flex items-center gap-1 text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full text-xs"><Truck className="w-3 h-3" /> Shipped</span>;
            case 'processing':
                return <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs"><Package className="w-3 h-3" /> Processing</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 px-2.5 py-0.5 rounded-full text-xs"><Clock className="w-3 h-3" /> Pending</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full text-xs"><XCircle className="w-3 h-3" /> Cancelled</span>;
            default:
                return <span className="text-gray-500">{status}</span>;
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
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 p-8 overflow-y-auto">

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                                <X /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                                <Check /> {success}
                            </div>
                        )}

                        {/* Server Down */}
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

                        {/* // STATS CARDS - Updated to show correct revenue */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Orders</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">{stats.totalOrders}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Pending Orders</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">{stats.pendingOrders}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Completed Orders</h3>
                                <p className="text-3xl font-extrabold text-emerald-600">{stats.completedOrders}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Revenue</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">Rs. {stats.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* PAGE TITLE */}
                        <h1 className="text-2xl font-bold text-[#1e3a6a] mb-6">Order Management</h1>

                        {/* SEARCH & ACTIONS BAR */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="relative w-full sm:w-96">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID or Customer Name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                />
                            </div>
                        </div>

                        {/* ORDERS TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#a8c5da] text-[#1e3a6a] text-xs font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4">Order ID</th>
                                            <th className="py-3 px-4">Customer</th>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-center">Items</th>
                                            <th className="py-3 px-4 text-center">Amount</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order) => (
                                                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-4 font-semibold text-slate-800">
                                                        {order.orderId}
                                                    </td>
                                                    <td className="py-4 px-4 font-semibold text-slate-800">
                                                        {order.customerId?.name || order.customerId?.username || 'Unknown'}
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-700 font-medium">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                        {order.items?.length || 0}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-slate-800">
                                                        Rs. {order.total?.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {getStatusBadge(order.status)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* Status Update Dropdown */}
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                                disabled={actionLoading === order._id}
                                                                className="text-xs border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="processing">Processing</option>
                                                                <option value="shipped">Shipped</option>
                                                                <option value="delivered">Delivered</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>

                                                            {/* View Button */}
                                                            <button
                                                                onClick={() => fetchOrderDetails(order._id)}
                                                                disabled={actionLoading === order._id}
                                                                className="text-[#1e3a6a] hover:text-blue-700 transition-opacity disabled:opacity-50"
                                                                title="View Order Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {/* Print Button */}
                                                            <button
                                                                onClick={() => handlePrintInvoice(order)}
                                                                className="text-[#1e3a6a] hover:text-blue-700 transition-opacity"
                                                                title="Print Invoice"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-6 text-slate-500">
                                                    No orders found matching "{searchTerm}"
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                            <span>
                                Showing {filteredOrders.length} of {orders.length} orders
                            </span>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Completed: {orders.filter(o => o.status === 'delivered').length}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Processing: {orders.filter(o => o.status === 'processing' || o.status === 'shipped').length}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                    Pending: {orders.filter(o => o.status === 'pending').length}
                                </span>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-[#1e3a6a]">Order Details</h2>
                                <p className="text-sm text-gray-500">Order #{selectedOrder.orderId}</p>
                            </div>
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Customer</p>
                                    <p className="font-medium">{selectedOrder.customerId?.name || selectedOrder.customerId?.username || 'Unknown'}</p>
                                    <p className="text-sm text-gray-500">{selectedOrder.customerId?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Order Date</p>
                                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.shippingAddress && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Shipping Address</p>
                                    <p className="text-sm">{selectedOrder.shippingAddress.street}</p>
                                    <p className="text-sm">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                                    <p className="text-sm">{selectedOrder.shippingAddress.country}</p>
                                    <p className="text-sm">Phone: {selectedOrder.shippingAddress.phone}</p>
                                </div>
                            )}

                            {/* Order Items */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Order Items</p>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Product</th>
                                                <th className="px-4 py-2 text-center">Qty</th>
                                                <th className="px-4 py-2 text-right">Price</th>
                                                <th className="px-4 py-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedOrder.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">{item.productName || item.productId?.name || 'Product'}</td>
                                                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-right">Rs. {item.price}</td>
                                                    <td className="px-4 py-2 text-right font-medium">Rs. {item.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-medium">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-2 text-right">Subtotal:</td>
                                                <td className="px-4 py-2 text-right">Rs. {selectedOrder.subtotal?.toLocaleString()}</td>
                                            </tr>
                                            {selectedOrder.discount > 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-2 text-right text-emerald-600">Discount:</td>
                                                    <td className="px-4 py-2 text-right text-emerald-600">-Rs. {selectedOrder.discount}</td>
                                                </tr>
                                            )}
                                            {selectedOrder.shippingCost > 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-2 text-right">Shipping:</td>
                                                    <td className="px-4 py-2 text-right">Rs. {selectedOrder.shippingCost}</td>
                                                </tr>
                                            )}
                                            <tr className="text-[#1e3a6a]">
                                                <td colSpan="3" className="px-4 py-2 text-right text-lg">Total:</td>
                                                <td className="px-4 py-2 text-right text-lg font-bold">Rs. {selectedOrder.total?.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => handlePrintInvoice(selectedOrder)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a6a] text-white rounded-lg hover:bg-blue-900 transition"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Invoice
                                </button>
                                {/* <button
                                    onClick={() => {
                                        window.location.href = `mailto:${selectedOrder.customerId?.email}?subject=Order ${selectedOrder.orderId} Update`;
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                >
                                    <Mail className="w-4 h-4" />
                                    Email Customer
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;