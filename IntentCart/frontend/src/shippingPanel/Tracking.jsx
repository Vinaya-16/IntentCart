import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Truck,
    Package,
    CheckCircle2,
    MapPin,
    Clock,
    User,
    Phone,
    Edit3,
    Save,
    Building2,
    Calendar,
    ChevronRight,
    RefreshCw,
    Search,
    Loader2,
    AlertCircle,
    CreditCard,
    IndianRupee,
    Check,
    XCircle,
    Clock as ClockIcon,
    Lock
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/shipping';

const ShippingTracking = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [locationNote, setLocationNote] = useState('');
    const [toastMessage, setToastMessage] = useState(null);
    const [order, setOrder] = useState(null);
    const [trackingHistory, setTrackingHistory] = useState([]);

    // Search state
    const [searchOrderId, setSearchOrderId] = useState('');
    const [searching, setSearching] = useState(false);

    // Driver Assignment
    const [isAssigned, setIsAssigned] = useState(false);
    const [assignedDriver, setAssignedDriver] = useState(null);

    const getToken = () => localStorage.getItem('token');

    // Fetch order by ID
    const fetchOrderById = async (orderId) => {
        try {
            setLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            // console.log('Fetching order with ID:', orderId);

            const response = await fetch(`${API_URL}/orders/search/${orderId}`, {
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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Order not found');
            }

            const data = await response.json();
            // console.log('Order data received:', data);

            if (data.success) {
                const orderData = data.order;
                setOrder(orderData);

                // Set assignment status from backend
                const isAssignedToDriver = orderData.isAssignedToMyDriver || false;
                setIsAssigned(isAssignedToDriver);

                // console.log('Is Assigned to my driver:', isAssignedToDriver);
                // console.log('Assigned Driver:', orderData.assignedDriver);

                // Set assigned driver if available
                if (isAssignedToDriver && orderData.assignedDriver) {
                    setAssignedDriver({
                        id: orderData.assignedDriver.id,
                        name: orderData.assignedDriver.name || 'Unknown Driver',
                        phone: orderData.assignedDriver.phone || 'N/A',
                        vehicle: orderData.assignedDriver.vehicle || 'Not Assigned',
                        vehicleType: orderData.assignedDriver.vehicleType || 'Not Specified',
                        rating: orderData.assignedDriver.rating || 0,
                        totalDeliveries: orderData.assignedDriver.totalDeliveries || 0,
                        licenseNumber: orderData.assignedDriver.licenseNumber || 'N/A',
                        status: orderData.assignedDriver.status || 'offline',
                        experience: orderData.assignedDriver.experience || 0
                    });
                } else {
                    setAssignedDriver(null);
                }

                // Build tracking history
                const history = buildTrackingHistory(orderData);
                setTrackingHistory(history);

                const nextStatus = getNextStatus(history, orderData.status);
                setSelectedStatus(nextStatus);

                // Get location from shipping address
                const location = orderData.shippingAddress ?
                    `${orderData.shippingAddress.city || 'Unknown'}, ${orderData.shippingAddress.state || 'Unknown'}` :
                    'Unknown Location';

                const shipmentData = {
                    id: orderData.id,
                    orderId: orderData.orderId,
                    customer: orderData.customer,
                    carrier: getCarrierName(orderData),
                    trackingId: orderData.trackingNumber || 'Not assigned',
                    estimatedDelivery: orderData.estimatedDelivery || 'Pending',
                    status: orderData.status || 'pending',
                    paymentStatus: orderData.paymentStatus || 'pending',
                    paymentMethod: orderData.paymentMethod || 'Not specified',
                    total: orderData.total || 0,
                    subtotal: orderData.subtotal || 0,
                    paidAt: orderData.paidAt || null,
                    refundedAt: orderData.refundedAt || null,
                    refundAmount: orderData.refundAmount || 0,
                    history: history,
                    isAssignedToMyDriver: isAssignedToDriver,
                    agent: {
                        name: isAssignedToDriver && orderData.assignedDriver ?
                            orderData.assignedDriver.name : 'Not Assigned',
                        phone: isAssignedToDriver && orderData.assignedDriver ?
                            orderData.assignedDriver.phone : 'N/A',
                        currentLocation: location
                    }
                };
                setShipment(shipmentData);
                setSearchOrderId('');
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            setError(err.message || 'Order not found. Please check the Order ID.');
            setShipment(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch driver assigned to this order
    const fetchDriverForOrder = async (orderId) => {
        try {
            const token = getToken();
            if (!token) return;

            // Fetch drivers to find which one has this order assigned
            const response = await fetch(`${API_URL}/drivers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Find driver with this order assigned
                    const driver = data.drivers.find(d =>
                        d.assignedOrders && d.assignedOrders.some(o => o._id === orderId || o.id === orderId)
                    );
                    if (driver) {
                        setAssignedDriver({
                            id: driver.id,
                            name: driver.name,
                            phone: driver.phone,
                            vehicle: driver.vehicleNumber || 'Not Assigned',
                            vehicleType: driver.vehicleType || 'Not Specified',
                            rating: driver.rating || 0,
                            totalDeliveries: driver.totalDeliveries || 0
                        });
                    } else {
                        setAssignedDriver(null);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching driver for order:', error);
            setAssignedDriver(null);
        }
    };

    // Search orders by ID
    const searchOrders = async () => {
        if (!searchOrderId.trim()) {
            setError('Please enter an Order ID');
            return;
        }

        try {
            setSearching(true);
            setError('');
            await fetchOrderById(searchOrderId.trim());
        } catch (err) {
            console.error('Search error:', err);
            setError(`Order "${searchOrderId}" not found. Please check the ID and try again.`);
        } finally {
            setSearching(false);
        }
    };

    // Build tracking history
    const buildTrackingHistory = (orderData) => {
        const history = [];
        const status = orderData.status || 'pending';
        const createdAt = orderData.date || new Date().toLocaleDateString();

        const statusDisplayMap = {
            'pending': { label: 'Order Placed', location: 'Order Received' },
            'processing': { label: 'Processing', location: 'Warehouse' },
            'packed': { label: 'Packed', location: 'Warehouse' },
            'shipped': { label: 'Shipped', location: 'In Transit' },
            'delivered': { label: 'Delivered', location: 'Delivered to Customer' },
            'cancelled': { label: 'Cancelled', location: 'Order Cancelled' },
            'refunded': { label: 'Refunded', location: 'Order Refunded' }
        };

        const statusOrder = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];
        const currentIndex = statusOrder.indexOf(status);

        statusOrder.forEach((s, index) => {
            if (index <= currentIndex) {
                const display = statusDisplayMap[s] || { label: s.charAt(0).toUpperCase() + s.slice(1), location: 'Unknown' };
                const isCompleted = index < currentIndex || s === 'delivered' || s === 'cancelled' || s === 'refunded';
                const isCurrent = index === currentIndex && !isCompleted;

                let date = createdAt;
                if (isCurrent && !isCompleted) {
                    date = 'In Progress';
                } else if (isCompleted && s === 'delivered' && orderData.deliveredAt) {
                    date = orderData.deliveredAt;
                } else if (isCompleted) {
                    date = createdAt;
                } else {
                    date = 'Pending';
                }

                history.push({
                    status: display.label,
                    location: display.location,
                    date: date,
                    completed: isCompleted || (s === 'delivered') || (s === 'cancelled') || (s === 'refunded')
                });
            }
        });

        if (history.length === 0) {
            history.push({
                status: 'Order Placed',
                location: 'Order Received',
                date: createdAt,
                completed: false
            });
        }

        return history;
    };

    const getNextStatus = (history, currentStatus) => {
        const statusFlow = ['pending', 'processing', 'packed', 'shipped', 'delivered'];
        const currentIndex = statusFlow.indexOf(currentStatus);

        if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) {
            return currentStatus;
        }

        return statusFlow[currentIndex + 1] || currentStatus;
    };

    const getCarrierName = (orderData) => {
        const carriers = {
            'blue_dart': 'Blue Dart',
            'delhivery': 'Delhivery',
            'xpressbees': 'XpressBees',
            'ekart': 'Ekart',
            'shadowfax': 'Shadowfax',
            'standard': 'Standard Shipping'
        };
        return carriers[orderData.carrier] || 'Standard Shipping';
    };

    const getCurrentLocation = (orderData) => {
        if (orderData.shippingAddress) {
            return `${orderData.shippingAddress.city || 'Unknown'}, ${orderData.shippingAddress.state || 'Unknown'}`;
        }
        return 'Unknown Location';
    };

    const handleUpdateStatus = async () => {
        // Check if we have a status to update to
        if (!selectedStatus || selectedStatus === shipment?.status) {
            setError('No status change selected');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            setIsUpdating(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setIsUpdating(false);
                return;
            }

            // Get the correct order ID
            const orderId = order?.id || shipment?.id || id;

            // Map status to valid backend statuses
            const statusMap = {
                'pending': 'pending',
                'processing': 'processing',
                'packed': 'processing',
                'shipped': 'shipped',
                'delivered': 'delivered',
                'cancelled': 'cancelled',
                'refunded': 'refunded'
            };

            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
            let statusToSend = selectedStatus.toLowerCase();

            // Map the status if needed
            if (statusMap[statusToSend]) {
                statusToSend = statusMap[statusToSend];
            }

            // Validate the status
            if (!validStatuses.includes(statusToSend)) {
                throw new Error(`Invalid status: ${statusToSend}. Valid: ${validStatuses.join(', ')}`);
            }

            // console.log('Updating status:', {
            //     orderId: orderId,
            //     selectedStatus: selectedStatus,
            //     mappedStatus: statusToSend,
            //     currentStatus: shipment?.status
            // });

            const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: statusToSend,
                    notes: locationNote || ''
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Status update error:', errorData);
                throw new Error(errorData.message || 'Failed to update order status');
            }

            const data = await response.json();

            if (data.success) {
                // Refresh order data using the orderId
                await fetchOrderById(order.orderId || shipment.orderId);
                setLocationNote('');
                setToastMessage(`Order status updated to "${statusToSend}"`);
                setTimeout(() => setToastMessage(null), 4000);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle Enter key press for search
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchOrders();
        }
    };

    // If ID is provided in URL, fetch it on load
    useEffect(() => {
        if (id && id !== 'undefined' && id !== 'null') {
            fetchOrderById(id);
        }
    }, [id]);

    const STATUS_CONFIG = {
        'Order Placed': { icon: Package, badge: 'bg-slate-100 text-slate-700 border-slate-200', accent: 'bg-slate-500', iconColor: 'text-slate-600' },
        'Processing': { icon: RefreshCw, badge: 'bg-blue-50 text-blue-700 border-blue-200', accent: 'bg-blue-600', iconColor: 'text-blue-600' },
        'Packed': { icon: Package, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: 'bg-indigo-600', iconColor: 'text-indigo-600' },
        'Shipped': { icon: Truck, badge: 'bg-purple-50 text-purple-700 border-purple-200', accent: 'bg-purple-600', iconColor: 'text-purple-600' },
        'Delivered': { icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: 'bg-emerald-600', iconColor: 'text-emerald-600' },
        'Cancelled': { icon: AlertCircle, badge: 'bg-red-50 text-red-700 border-red-200', accent: 'bg-red-600', iconColor: 'text-red-600' },
        'Refunded': { icon: AlertCircle, badge: 'bg-gray-50 text-gray-700 border-gray-200', accent: 'bg-gray-600', iconColor: 'text-gray-600' }
    };

    const getStatusConfig = (status) => {
        const statusKey = Object.keys(STATUS_CONFIG).find(
            key => key.toLowerCase() === status?.toLowerCase()
        );
        return STATUS_CONFIG[statusKey] || STATUS_CONFIG['Order Placed'];
    };

    // Get payment status badge
    const getPaymentBadge = (paymentStatus) => {
        const badges = {
            'paid': { label: 'Paid', color: 'bg-green-50 text-green-700 border-green-200', icon: Check },
            'pending': { label: 'Pending ⏳', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: ClockIcon },
            'failed': { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
            'refunded': { label: 'Refunded', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: XCircle }
        };
        return badges[paymentStatus] || badges['pending'];
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col bg-slate-50">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                        <p className="mt-4 text-slate-600 font-medium">Loading shipment details...</p>
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
                    activeTab="Shipping Dashboard"
                    onSelectTab={(tab) => {
                        if (tab === 'Dashboard' || tab === 'Shipping Dashboard') {
                            navigate('/shipping-dashboard');
                        }
                    }}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* Toast Notification */}
                            {toastMessage && (
                                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                        <p className="text-sm font-medium">{toastMessage}</p>
                                    </div>
                                    <button
                                        onClick={() => setToastMessage(null)}
                                        className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold uppercase tracking-wider ml-4"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {/* Search Bar */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Search Order by ID
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={searchOrderId}
                                                    onChange={(e) => setSearchOrderId(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    placeholder="Enter Order ID (e.g., ORD-10245)"
                                                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                            <button
                                                onClick={searchOrders}
                                                disabled={searching || !searchOrderId.trim()}
                                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {searching ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Searching...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="w-4 h-4" />
                                                        Track
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1.5">
                                            Enter the Order ID from your order management to track shipment
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipment Details */}
                            {!loading && shipment && (
                                <>
                                    {/* Breadcrumb & Page Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    setShipment(null);
                                                    setOrder(null);
                                                    setSearchOrderId('');
                                                    navigate('/shipping-dashboard');
                                                }}
                                                className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-sm transition-all"
                                                title="Back to Dashboard"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                                                    <span>Shipping</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span>Tracking</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="text-slate-800 font-semibold">{shipment.orderId}</span>
                                                </div>
                                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shipment Details</h1>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusConfig(shipment.status).badge}`}>
                                                <span className={`w-2 h-2 rounded-full ${getStatusConfig(shipment.status).accent} animate-pulse`} />
                                                {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Metric Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                                <Truck className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Carrier</p>
                                                <p className="text-sm font-semibold text-slate-900 truncate">{shipment.carrier}</p>
                                            </div>
                                        </div>

                                        {/* <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tracking ID</p>
                                                <p className="text-sm font-semibold text-slate-900 truncate font-mono">{shipment.name}</p>
                                            </div>
                                        </div> */}

                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                                {(() => {
                                                    const Icon = getStatusConfig(shipment.status).icon;
                                                    return <Icon className="w-5 h-5" />;
                                                })()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Status</p>
                                                <p className="text-sm font-semibold text-slate-900 truncate">{shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Payment</p>
                                                <p className={`text-sm font-semibold truncate ${shipment.paymentStatus === 'paid' ? 'text-green-600' :
                                                    shipment.paymentStatus === 'pending' ? 'text-yellow-600' :
                                                        shipment.paymentStatus === 'failed' ? 'text-red-600' :
                                                            shipment.paymentStatus === 'refunded' ? 'text-gray-600' : 'text-slate-900'
                                                    }`}>
                                                    {shipment.paymentStatus?.charAt(0).toUpperCase() + shipment.paymentStatus?.slice(1) || 'Pending'}
                                                </p>
                                                {shipment.paidAt && (
                                                    <p className="text-[10px] text-slate-400">Paid: {new Date(shipment.paidAt).toLocaleDateString()}</p>
                                                )}
                                                {shipment.refundedAt && (
                                                    <p className="text-[10px] text-slate-400">Refunded: {new Date(shipment.refundedAt).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                        {/* Timeline */}
                                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                        <MapPin className="w-5 h-5 text-indigo-600" />
                                                        Tracking Timeline
                                                    </h3>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {trackingHistory.filter(h => h.completed).length} of {trackingHistory.length} Steps
                                                    </span>
                                                </div>

                                                <div className="relative pl-8 space-y-8 my-2">
                                                    {trackingHistory.map((step, index) => {
                                                        const Config = getStatusConfig(step.status);
                                                        const Icon = Config.icon;
                                                        const isCompleted = step.completed;
                                                        const isCurrent = index === trackingHistory.length - 1 && !isCompleted;
                                                        const isPending = !isCompleted && index > trackingHistory.length - 1;
                                                        const isLast = index === trackingHistory.length - 1;

                                                        return (
                                                            <div key={index} className="relative group">
                                                                {!isLast && (
                                                                    <div
                                                                        className={`absolute left-[-20px] top-6 bottom-[-32px] w-0.5 transition-colors ${isCompleted && trackingHistory[index + 1]?.completed
                                                                            ? 'bg-emerald-500'
                                                                            : 'bg-slate-200'
                                                                            }`}
                                                                    />
                                                                )}

                                                                <div className={`absolute left-[-28px] top-0.5 w-4 h-4 rounded-full border-2 border-white ring-2 transition-all ${isCompleted
                                                                    ? 'ring-emerald-500 bg-emerald-500'
                                                                    : isCurrent
                                                                        ? 'ring-indigo-600 bg-indigo-600 scale-110'
                                                                        : 'ring-slate-300 bg-slate-100'
                                                                    }`}>
                                                                    {isCompleted && (
                                                                        <div className="w-full h-full flex items-center justify-center text-white">
                                                                            <span className="block w-1.5 h-1.5 bg-white rounded-full" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className={`rounded-lg p-3 transition-colors ${isCurrent ? 'bg-slate-50 border border-slate-200' : ''}`}>
                                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon className={`w-4 h-4 ${isPending ? 'text-slate-400' : Config.iconColor}`} />
                                                                            <h4 className={`text-sm font-semibold ${isPending ? 'text-slate-400' : 'text-slate-900'}`}>
                                                                                {step.status}
                                                                            </h4>
                                                                        </div>
                                                                        {isCurrent && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                                                Current Step
                                                                            </span>
                                                                        )}
                                                                        {isCompleted && !isCurrent && (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                        )}
                                                                    </div>

                                                                    <p className={`text-xs ${isPending ? 'text-slate-400' : 'text-slate-600'} font-medium`}>
                                                                        {step.location}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {step.date}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Panel */}
                                        <div className="space-y-6">

                                            {/* Payment Details Card */}
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                                                    <CreditCard className="w-5 h-5 text-purple-600" />
                                                    Payment Details
                                                </h3>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-xs text-slate-500">Payment Status</span>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${shipment.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            shipment.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                shipment.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    shipment.paymentStatus === 'refunded' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                                                        'bg-slate-50 text-slate-700 border-slate-200'
                                                            }`}>
                                                            {shipment.paymentStatus?.charAt(0).toUpperCase() + shipment.paymentStatus?.slice(1) || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-xs text-slate-500">Payment Method</span>
                                                        <span className="text-xs font-semibold text-slate-800">
                                                            {shipment.paymentMethod?.replace('_', ' ').toUpperCase() || 'Not specified'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                        <span className="text-xs text-slate-500">Total Amount</span>
                                                        <span className="text-sm font-bold text-[#1e2356]">
                                                            Rs.{shipment.total?.toLocaleString() || 0}
                                                        </span>
                                                    </div>
                                                    {shipment.paidAt && (
                                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                            <span className="text-xs text-slate-500">Paid On</span>
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {new Date(shipment.paidAt).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {shipment.refundedAt && (
                                                        <div className="flex justify-between items-center py-2">
                                                            <span className="text-xs text-slate-500">Refunded On</span>
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {new Date(shipment.refundedAt).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Update Status */}
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                                                    <Edit3 className="w-5 h-5 text-indigo-600" />
                                                    Update Status
                                                    {!isAssigned && (
                                                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                                            <Lock /> Read Only
                                                        </span>
                                                    )}
                                                </h3>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                                            Select New Status
                                                        </label>
                                                        <select
                                                            value={selectedStatus}
                                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                                                            disabled={!isAssigned || shipment.status === 'delivered' || shipment.status === 'cancelled' || shipment.status === 'refunded'}
                                                        >
                                                            {trackingHistory.map((h, idx) => {
                                                                const statusKey = h.status.toLowerCase();
                                                                const completedCount = trackingHistory.filter(s => s.completed).length;
                                                                const isDisabled = idx < completedCount || shipment.status === 'delivered' || shipment.status === 'cancelled' || shipment.status === 'refunded';
                                                                if (statusKey === 'packed') return null;
                                                                return (
                                                                    <option key={idx} value={statusKey} disabled={isDisabled}>
                                                                        {h.status} {isDisabled && idx < completedCount ? '✓' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                        {!isAssigned && (
                                                            <p className="text-xs text-amber-600 mt-1.5">
                                                                This order is not assigned to your drivers. Status cannot be changed.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                                            Location / Note (Optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={locationNote}
                                                            onChange={(e) => setLocationNote(e.target.value)}
                                                            placeholder="e.g. Arrived at Regional Hub"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                                                            disabled={!isAssigned || shipment.status === 'delivered' || shipment.status === 'cancelled' || shipment.status === 'refunded'}
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={handleUpdateStatus}
                                                        disabled={!isAssigned || isUpdating || selectedStatus === shipment.status || shipment.status === 'delivered' || shipment.status === 'cancelled' || shipment.status === 'refunded'}
                                                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow ${isAssigned ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {isUpdating ? (
                                                            <>
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                                Updating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="w-4 h-4" />
                                                                {isAssigned ? 'Save Update' : 'Read Only'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Assigned Delivery Agent / Driver */}
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                                                    <User className="w-5 h-5 text-indigo-600" />
                                                    {isAssigned && assignedDriver ? 'Assigned Driver' : 'Delivery Agent'}
                                                    {!isAssigned && (
                                                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                                            Not Assigned
                                                        </span>
                                                    )}
                                                </h3>

                                                {isAssigned && assignedDriver ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-indigo-100">
                                                                {assignedDriver.name?.split(' ').map(n => n[0]).join('') || 'D'}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-slate-900 text-sm">{assignedDriver.name}</p>
                                                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                                                    <span className="flex items-center gap-1">
                                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                                        {assignedDriver.phone || 'N/A'}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            {assignedDriver.rating > 0 && (
                                                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                                                    {assignedDriver.rating}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                                                    Vehicle
                                                                </p>
                                                                <p className="text-xs font-semibold text-slate-700">
                                                                    {assignedDriver.vehicle || 'Not Assigned'}
                                                                </p>
                                                                {assignedDriver.vehicleType && (
                                                                    <p className="text-[10px] text-slate-400 capitalize">{assignedDriver.vehicleType}</p>
                                                                )}
                                                            </div>
                                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                                                    Total Deliveries
                                                                </p>
                                                                <p className="text-xs font-semibold text-slate-700">
                                                                    {assignedDriver.totalDeliveries || 0}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                                                Status
                                                            </p>
                                                            <p className="text-xs font-semibold text-slate-700 capitalize">
                                                                {assignedDriver.status || 'Offline'}
                                                            </p>
                                                        </div>

                                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                                                Last Known Location
                                                            </p>
                                                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                                                {shipment?.agent?.currentLocation || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6">
                                                        <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500">No driver assigned to this order</p>
                                                        <p className="text-xs text-slate-400 mt-1">This order is not assigned to any driver</p>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                </>
                            )}

                            {/* No Shipment Found */}
                            {!loading && !shipment && !error && (
                                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-600">Enter an Order ID to track</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Search for an order using the Order ID from your order management
                                    </p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ShippingTracking;