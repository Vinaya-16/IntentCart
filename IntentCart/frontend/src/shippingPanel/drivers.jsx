import React, { useState, useMemo, useEffect } from 'react';
import {
    ArrowLeft,
    User,
    Truck,
    MapPin,
    Phone,
    CheckCircle,
    XCircle,
    Edit3,
    Trash2,
    Plus,
    Search,
    Package,
    X,
    Menu,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/shipping';

const ShippingDrivers = () => {
    const navigate = useNavigate();

    // Drivers State
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Modals & Selected Driver States
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showAddDriverModal, setShowAddDriverModal] = useState(false);
    const [showEditDriverModal, setShowEditDriverModal] = useState(false);

    // Form States
    const [newDriver, setNewDriver] = useState({
        username: '',
        email: '',
        phone: '',
        branch: 'Mumbai Zone 1',
        vehicleNumber: '',
        experience: 0,
        status: 'available'
    });

    const [editDriverData, setEditDriverData] = useState(null);
    const [selectedOrdersToAssign, setSelectedOrdersToAssign] = useState([]);
    const [availableOrders, setAvailableOrders] = useState([]);

    const getToken = () => localStorage.getItem('token');

    // Fetch drivers from backend
    const fetchDrivers = async () => {
        try {
            setLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            // Fetch all shippers (drivers)
            const response = await fetch(`${API_URL}/drivers`, {
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
                throw new Error('Failed to fetch drivers');
            }

            const data = await response.json();
            // console.log('Drivers data:', data); 

            if (data.success) {
                // Format drivers for display
                // Format drivers for display - Updated
                const formattedDrivers = (data.drivers || []).map(driver => ({
                    id: driver.id || driver._id,
                    driverId: driver.driverId || driver.id?.slice(-6),
                    name: driver.name || 'Unknown Driver',
                    phone: driver.phone || 'N/A',
                    zone: driver.zone || 'Not Assigned',
                    status: driver.status || 'offline',
                    currentLoad: driver.currentLoad || driver.assignedOrders?.length || 0,
                    maxCapacity: driver.maxCapacity || 10,
                    assignedOrders: driver.assignedOrders || [],
                    assignedOrdersCount: driver.assignedOrders?.length || 0,
                    vehicle: driver.vehicleNumber || 'Not Assigned',
                    vehicleType: driver.vehicleType || 'Not Specified',
                    rating: driver.rating || 0,
                    totalDeliveries: driver.totalDeliveries || 0,
                    experience: driver.experience || 0,
                    joinedAt: driver.createdAt,
                    licenseNumber: driver.licenseNumber || 'N/A',
                    isActive: driver.isActive
                }));
                setDrivers(formattedDrivers);
            }
        } catch (err) {
            console.error('Error fetching drivers:', err);
            setError(err.message || 'Failed to load drivers');
        } finally {
            setLoading(false);
        }
    };

    // Fetch available orders for assignment
    const fetchAvailableOrders = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/orders?status=pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const orders = data.orders.map(order => ({
                        id: order.id || order._id,
                        orderId: order.orderId,
                        type: 'Standard Delivery',
                        location: order.address || 'Unknown'
                    }));
                    setAvailableOrders(orders);
                }
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
    };

    // Add new driver (shipper)
    // Add new driver
    const handleAddDriver = async (e) => {
        e.preventDefault();

        // Use name instead of username
        if (!newDriver.name || !newDriver.email || !newDriver.phone) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            // Include all required fields including licenseExpiry
            const driverData = {
                name: newDriver.name,
                email: newDriver.email,
                phone: newDriver.phone,
                licenseNumber: newDriver.licenseNumber || 'DL-' + Date.now().toString().slice(-8),
                licenseExpiry: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
                vehicleType: newDriver.vehicleType || 'bike',
                vehicleNumber: newDriver.vehicleNumber || 'KA-01-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                maxCapacity: parseInt(newDriver.maxCapacity) || 10,
                address: {
                    city: newDriver.zone || 'Not Assigned',
                    state: 'State',
                    country: 'India'
                },
                status: 'available'
            };

            // console.log('Creating driver:', driverData);

            const response = await fetch(`${API_URL}/drivers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(driverData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add driver');
            }

            const data = await response.json();

            if (data.success) {
                setSuccess('Driver added successfully!');
                await fetchDrivers();
                setShowAddDriverModal(false);
                // Reset form with correct field names
                setNewDriver({
                    name: '',
                    email: '',
                    phone: '',
                    zone: 'Mumbai Zone 1',
                    vehicleNumber: '',
                    vehicleType: 'bike',
                    experience: 0,
                    maxCapacity: 10,
                    licenseNumber: '',
                    status: 'available'
                });
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error adding driver:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Update driver (shipper) status
    const updateDriverStatus = async (driverId, status) => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/drivers/${driverId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setDrivers(prev => prev.map(d =>
                    d.id === driverId ? { ...d, status: status } : d
                ));
                setSuccess('Driver status updated!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error updating driver status:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Delete driver (shipper) - Admin only
    const handleDeleteDriver = async (driverId) => {
        if (!window.confirm('Are you sure you want to remove this driver?')) return;

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            // Note: This requires admin permissions
            const response = await fetch(`${API_URL}/drivers/${driverId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete driver');
            }

            setSuccess('Driver removed successfully!');
            await fetchDrivers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting driver:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Assign order to driver - Updated
    const handleAssignOrdersSubmit = async () => {
        if (!selectedDriver || selectedOrdersToAssign.length === 0) return;

        try {
            setLoading(true);
            const token = getToken();
            if (!token) return;

            // Assign each order to the driver
            for (const orderId of selectedOrdersToAssign) {
                const response = await fetch(`${API_URL}/drivers/${selectedDriver.id}/assign-order`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ orderId })
                });

                if (!response.ok) {
                    throw new Error(`Failed to assign order ${orderId}`);
                }
            }

            setSuccess(`Assigned ${selectedOrdersToAssign.length} orders to ${selectedDriver.name}`);
            await fetchDrivers(); // Refresh drivers list
            await fetchAvailableOrders(); // Refresh available orders
            setShowAssignModal(false);
            setSelectedOrdersToAssign([]);
            setSelectedDriver(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error assigning orders:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderSelection = (orderId) => {
        setSelectedOrdersToAssign(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    // Load data on mount
    useEffect(() => {
        fetchDrivers();
        fetchAvailableOrders();
    }, []);

    // Driver Search & Filter Logic
    const filteredDrivers = useMemo(() => {
        return drivers.filter(driver => {
            const matchesStatus = filterStatus === 'All' ? true : driver.status.toLowerCase() === filterStatus.toLowerCase();
            const matchesSearch =
                driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                driver.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                driver.zone.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [drivers, searchQuery, filterStatus]);

    // Dynamic Summary Stats Calculation
    const stats = useMemo(() => [
        { label: 'Total Drivers', value: drivers.length, icon: User, color: 'blue' },
        { label: 'Active / On Route', value: drivers.filter(d => d.status !== 'offline' && d.status !== 'Offline').length, icon: Truck, color: 'emerald' },
        { label: 'Offline', value: drivers.filter(d => d.status === 'offline' || d.status === 'Offline').length, icon: XCircle, color: 'red' },
        { label: 'Total Deliveries', value: drivers.reduce((sum, d) => sum + (d.totalDeliveries || 0), 0), icon: Package, color: 'purple' }
    ], [drivers]);

    const statusFilters = ['All', 'Active', 'On Route', 'Offline'];

    const STATUS_CONFIG = {
        'Active': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle },
        'On Route': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/80', dot: 'bg-blue-500', icon: Truck },
        'Offline': { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200/80', dot: 'bg-slate-400', icon: XCircle },
        'available': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle },
        'busy': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/80', dot: 'bg-blue-500', icon: Truck },
        'offline': { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200/80', dot: 'bg-slate-400', icon: XCircle }
    };

    const getStatusDisplay = (status) => {
        const map = {
            'available': 'Active',
            'busy': 'On Route',
            'offline': 'Offline',
            'Active': 'Active',
            'On Route': 'On Route',
            'Offline': 'Offline'
        };
        return map[status] || status;
    };

    // Mobile responsive table row renderer
    const renderMobileDriverCard = (driver) => {
        const displayStatus = getStatusDisplay(driver.status);
        const statusStyle = STATUS_CONFIG[displayStatus] || STATUS_CONFIG['Offline'];
        const loadPercentage = Math.min(100, Math.round((driver.currentLoad / driver.maxCapacity) * 100));

        return (
            <div key={driver.id} className="bg-white border border-slate-200/80 rounded-xl p-4 mb-3 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="font-semibold text-slate-900 text-sm">{driver.id?.slice(-6)}</div>
                        <div className="font-medium text-slate-800 text-base mt-0.5">{driver.name}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {displayStatus}
                    </span>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{driver.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{driver.zone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{driver.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-700">{driver.currentLoad} / {driver.maxCapacity} Orders</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                                className={`h-full rounded-full transition-all ${loadPercentage >= 90 ? 'bg-rose-500' : loadPercentage >= 60 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                style={{ width: `${loadPercentage}%` }}
                            />
                        </div>
                    </div>
                    {driver.rating > 0 && (
                        <div className="text-xs text-amber-600">⭐ {driver.rating} / 5</div>
                    )}
                </div>

                <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-slate-200/60">
                    <button
                        onClick={() => {
                            setSelectedDriver(driver);
                            setSelectedOrdersToAssign([]);
                            setShowAssignModal(true);
                        }}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Assign Orders"
                    >
                        <Package className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setEditDriverData(driver);
                            setShowEditDriverModal(true);
                        }}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Driver"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Driver"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    if (loading && drivers.length === 0) {
        return (
            <div className="h-screen flex flex-col bg-slate-50">
                <Header onMenuClick={() => setMobileMenuOpen(true)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                        <p className="mt-4 text-slate-600 font-medium">Loading drivers...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50/60 font-sans text-slate-800 overflow-hidden">
            <Header className="shrink-0" onMenuClick={() => setMobileMenuOpen(true)} />

            <div className="flex flex-1 w-full overflow-hidden relative">
                <Sidebar activeTab="Shipping Dashboard" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

                <div className="flex-1 min-w-0 h-full overflow-y-auto">
                    <main className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg border border-green-200 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        {/* PAGE HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 sm:pb-5">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/shipping-dashboard')}
                                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Delivery Agent Management</h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden xs:block">Manage delivery agents, assign routes, and monitor performance.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddDriverModal(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden xs:inline">Add Driver</span>
                            </button>
                        </div>

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                const colorMap = {
                                    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
                                    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
                                    red: { bg: 'bg-rose-500/10', text: 'text-rose-600' },
                                    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600' }
                                };
                                return (
                                    <div key={index} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{stat.label}</p>
                                            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
                                        </div>
                                        <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${colorMap[stat.color].bg} ${colorMap[stat.color].text}`}>
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* DRIVER TABLE CONTAINER */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

                            {/* SEARCH & FILTERS ROW */}
                            <div className="p-3 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
                                <div className="relative flex-1 max-w-full md:max-w-md">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Driver..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-wrap">
                                    {statusFilters.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setFilterStatus(status)}
                                            className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${filterStatus === status
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* TABLE - Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                                            <th className="py-3.5 px-4 sm:px-6">Driver ID</th>
                                            <th className="py-3.5 px-4 sm:px-6">Name & Contact</th>
                                            <th className="py-3.5 px-4 sm:px-6">Zone</th>
                                            <th className="py-3.5 px-4 sm:px-6 text-center">Load Capacity</th>
                                            <th className="py-3.5 px-4 sm:px-6">Vehicle</th>
                                            <th className="py-3.5 px-4 sm:px-6">Status</th>
                                            <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200/60 text-sm">
                                        {filteredDrivers.length > 0 ? (
                                            filteredDrivers.map((driver) => {
                                                const displayStatus = getStatusDisplay(driver.status);
                                                const statusStyle = STATUS_CONFIG[displayStatus] || STATUS_CONFIG['Offline'];
                                                const loadPercentage = Math.min(100, Math.round((driver.currentLoad / driver.maxCapacity) * 100));

                                                return (
                                                    <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900">{driver.id?.slice(-6) || 'N/A'}</td>
                                                        <td className="py-4 px-4 sm:px-6">
                                                            <div className="font-semibold text-slate-800">{driver.name}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                                <Phone className="w-3 h-3 text-slate-400" /> {driver.phone}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 sm:px-6 text-slate-600">
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{driver.zone}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 sm:px-6 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span className="text-xs font-semibold text-slate-700">{driver.currentLoad} / {driver.maxCapacity} Orders</span>
                                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200/60">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${loadPercentage >= 90 ? 'bg-rose-500' : loadPercentage >= 60 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                                                        style={{ width: `${loadPercentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 sm:px-6 text-slate-600 font-medium">{driver.vehicle}</td>
                                                        <td className="py-4 px-4 sm:px-6">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                                                {displayStatus}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 sm:px-6 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedDriver(driver);
                                                                        setSelectedOrdersToAssign([]);
                                                                        setShowAssignModal(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                    title="Assign Orders"
                                                                >
                                                                    <Package className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditDriverData(driver);
                                                                        setShowEditDriverModal(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit Driver"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteDriver(driver.id)}
                                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Remove Driver"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="py-12 text-center text-slate-400 text-sm">
                                                    No drivers found matching your active filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE CARDS VIEW */}
                            <div className="md:hidden p-3 sm:p-4 space-y-3">
                                {filteredDrivers.length > 0 ? (
                                    filteredDrivers.map(driver => renderMobileDriverCard(driver))
                                ) : (
                                    <div className="py-12 text-center text-slate-400 text-sm">
                                        No drivers found matching your active filters.
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* MODAL: Assign Orders */}
            {showAssignModal && selectedDriver && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl border border-slate-100">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Assign Orders</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Driver: <span className="font-semibold text-slate-800">{selectedDriver.name}</span>
                                    <span className="ml-2 text-indigo-600">
                                        ({selectedDriver.currentLoad}/{selectedDriver.maxCapacity} orders assigned)
                                    </span>
                                </p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Show currently assigned orders */}
                            {selectedDriver.assignedOrders && selectedDriver.assignedOrders.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                        Currently Assigned Orders ({selectedDriver.assignedOrders.length})
                                    </p>
                                    <div className="space-y-2 mb-4">
                                        {selectedDriver.assignedOrders.map((order, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                                                <div>
                                                    <span className="text-sm font-medium text-slate-800">
                                                        {order.orderId || `ORD-${order._id?.slice(-6)}`}
                                                    </span>
                                                    <span className="text-xs text-slate-400 ml-2">
                                                        {order.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    Rs.{order.total?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available orders to assign */}
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Available Orders for Pickup
                            </p>
                            <div className="space-y-2">
                                {availableOrders.length > 0 ? (
                                    availableOrders.map((order) => (
                                        <label key={order.id} className="flex items-start sm:items-center gap-3 p-3 border border-slate-200/80 rounded-xl hover:bg-slate-50/80 cursor-pointer transition">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrdersToAssign.includes(order.id)}
                                                onChange={() => toggleOrderSelection(order.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 sm:mt-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-semibold text-slate-800 block">{order.orderId || order.id?.slice(-6)}</span>
                                                <span className="text-xs text-slate-400">{order.type} • {order.location}</span>
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex-shrink-0">
                                                Unassigned
                                            </span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-400 text-sm py-4">No orders available for assignment</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2 bg-slate-50/50">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-sm font-medium transition"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleAssignOrdersSubmit}
                                disabled={selectedOrdersToAssign.length === 0}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                            >
                                Assign Selected ({selectedOrdersToAssign.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Add Driver */}
            {showAddDriverModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl border border-slate-100">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Add New Driver</h3>
                            <button onClick={() => setShowAddDriverModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddDriver} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newDriver.name}
                                    onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                                    placeholder="e.g. Rahul Sharma"
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={newDriver.email}
                                    onChange={e => setNewDriver({ ...newDriver, email: e.target.value })}
                                    placeholder="driver@example.com"
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={newDriver.phone}
                                    onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* License Number */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">License Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={newDriver.licenseNumber}
                                    onChange={e => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
                                    placeholder="DL-1234567890"
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Zone */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Zone</label>
                                <input
                                    type="text"
                                    value={newDriver.zone}
                                    onChange={e => setNewDriver({ ...newDriver, zone: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Vehicle Type & Number */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type</label>
                                    <select
                                        value={newDriver.vehicleType}
                                        onChange={e => setNewDriver({ ...newDriver, vehicleType: e.target.value })}
                                        className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                        <option value="bike">Bike</option>
                                        <option value="scooter">Scooter</option>
                                        <option value="car">Car</option>
                                        <option value="van">Van</option>
                                        <option value="truck">Truck</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Number</label>
                                    <input
                                        type="text"
                                        value={newDriver.vehicleNumber}
                                        onChange={e => setNewDriver({ ...newDriver, vehicleNumber: e.target.value })}
                                        placeholder="KA-01-AB-1234"
                                        className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Experience & Max Capacity */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newDriver.experience}
                                        onChange={e => setNewDriver({ ...newDriver, experience: e.target.value })}
                                        className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newDriver.maxCapacity}
                                        onChange={e => setNewDriver({ ...newDriver, maxCapacity: e.target.value })}
                                        className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddDriverModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-sm font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Add Driver
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Edit Driver */}
            {showEditDriverModal && editDriverData && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl border border-slate-100">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Edit Driver</h3>
                            <button onClick={() => setShowEditDriverModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); setShowEditDriverModal(false); }} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editDriverData.name}
                                    onChange={e => setEditDriverData({ ...editDriverData, name: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={editDriverData.phone}
                                    onChange={e => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Zone</label>
                                <input
                                    type="text"
                                    value={editDriverData.zone}
                                    onChange={e => setEditDriverData({ ...editDriverData, zone: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                                <select
                                    value={editDriverData.status}
                                    onChange={e => setEditDriverData({ ...editDriverData, status: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="available">Active</option>
                                    <option value="busy">On Route</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditDriverModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-sm font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingDrivers;