import React, { useState, useMemo } from 'react';
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
    Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// INITIAL MOCK DATA
const INITIAL_DRIVERS = [
    {
        id: 'DRV-001',
        name: 'Ravi Kumar',
        phone: '+91 98765 43210',
        zone: 'Mumbai Zone 1',
        status: 'Active',
        currentLoad: 4,
        maxCapacity: 10,
        assignedOrders: ['ORD-10245', 'ORD-10248', 'ORD-10250'],
        vehicle: 'Bike - Activa'
    },
    {
        id: 'DRV-002',
        name: 'Neha Patel',
        phone: '+91 99887 66554',
        zone: 'Delhi Zone 2',
        status: 'On Route',
        currentLoad: 6,
        maxCapacity: 8,
        assignedOrders: ['ORD-10246', 'ORD-10247'],
        vehicle: 'Truck - Tata Ace'
    },
    {
        id: 'DRV-003',
        name: 'Amit Singh',
        phone: '+91 77665 44332',
        zone: 'Bangalore Zone 1',
        status: 'Active',
        currentLoad: 2,
        maxCapacity: 15,
        assignedOrders: ['ORD-10249'],
        vehicle: 'Van - Maruti Eeco'
    },
    {
        id: 'DRV-004',
        name: 'Priya Sharma',
        phone: '+91 99887 11223',
        zone: 'Pune Zone 1',
        status: 'Offline',
        currentLoad: 0,
        maxCapacity: 10,
        assignedOrders: [],
        vehicle: 'Bike - Hero Splendor'
    }
];

const AVAILABLE_UNASSIGNED_ORDERS = [
    { id: 'ORD-10251', type: 'Standard Delivery', location: 'Mumbai' },
    { id: 'ORD-10252', type: 'Express Delivery', location: 'Mumbai' },
    { id: 'ORD-10253', type: 'Same Day Delivery', location: 'Delhi' }
];

const STATUS_CONFIG = {
    'Active': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle },
    'On Route': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/80', dot: 'bg-blue-500', icon: Truck },
    'Offline': { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200/80', dot: 'bg-slate-400', icon: XCircle }
};

const ShippingDrivers = () => {
    const navigate = useNavigate();

    // Drivers State
    const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
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
        name: '',
        phone: '',
        zone: 'Mumbai Zone 1',
        vehicle: 'Bike - Activa',
        maxCapacity: 10,
        status: 'Active'
    });

    const [editDriverData, setEditDriverData] = useState(null);
    const [selectedOrdersToAssign, setSelectedOrdersToAssign] = useState([]);

    // Driver Search & Filter Logic
    const filteredDrivers = useMemo(() => {
        return drivers.filter(driver => {
            const matchesStatus = filterStatus === 'All' ? true : driver.status === filterStatus;
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
        { label: 'Active / On Route', value: drivers.filter(d => d.status !== 'Offline').length, icon: Truck, color: 'emerald' },
        { label: 'Offline', value: drivers.filter(d => d.status === 'Offline').length, icon: XCircle, color: 'red' },
        { label: 'Active Deliveries', value: drivers.reduce((sum, d) => sum + d.currentLoad, 0), icon: Package, color: 'purple' }
    ], [drivers]);

    const statusFilters = ['All', 'Active', 'On Route', 'Offline'];

    // CRUD Handlers
    const handleAddDriver = (e) => {
        e.preventDefault();
        if (!newDriver.name || !newDriver.phone) return;

        const newId = `DRV-00${drivers.length + 1}`;
        const createdDriver = {
            id: newId,
            ...newDriver,
            maxCapacity: Number(newDriver.maxCapacity),
            currentLoad: 0,
            assignedOrders: []
        };

        setDrivers(prev => [createdDriver, ...prev]);
        setShowAddDriverModal(false);
        setNewDriver({
            name: '',
            phone: '',
            zone: 'Mumbai Zone 1',
            vehicle: 'Bike - Activa',
            maxCapacity: 10,
            status: 'Active'
        });
    };

    const handleEditDriverSave = (e) => {
        e.preventDefault();
        if (!editDriverData) return;
        setDrivers(prev => prev.map(d => d.id === editDriverData.id ? editDriverData : d));
        setShowEditDriverModal(false);
        setEditDriverData(null);
    };

    const handleDeleteDriver = (driverId) => {
        if (window.confirm('Are you sure you want to remove this driver?')) {
            setDrivers(prev => prev.filter(d => d.id !== driverId));
        }
    };

    const handleAssignOrdersSubmit = () => {
        if (!selectedDriver || selectedOrdersToAssign.length === 0) return;

        setDrivers(prev => prev.map(d => {
            if (d.id === selectedDriver.id) {
                return {
                    ...d,
                    assignedOrders: [...d.assignedOrders, ...selectedOrdersToAssign],
                    currentLoad: d.currentLoad + selectedOrdersToAssign.length,
                    status: d.status === 'Offline' ? 'Active' : d.status
                };
            }
            return d;
        }));

        setShowAssignModal(false);
        setSelectedOrdersToAssign([]);
        setSelectedDriver(null);
    };

    const toggleOrderSelection = (orderId) => {
        setSelectedOrdersToAssign(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    // Mobile responsive table row renderer
    const renderMobileDriverCard = (driver) => {
        const statusStyle = STATUS_CONFIG[driver.status] || {
            color: 'text-slate-700',
            bg: 'bg-slate-50',
            border: 'border-slate-200/80',
            dot: 'bg-slate-400'
        };
        const loadPercentage = Math.min(100, Math.round((driver.currentLoad / driver.maxCapacity) * 100));

        return (
            <div key={driver.id} className="bg-white border border-slate-200/80 rounded-xl p-4 mb-3 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="font-semibold text-slate-900 text-sm">{driver.id}</div>
                        <div className="font-medium text-slate-800 text-base mt-0.5">{driver.name}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {driver.status}
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
                                className={`h-full rounded-full transition-all ${loadPercentage >= 90 ? 'bg-rose-500' : loadPercentage >= 60 ? 'bg-amber-500' : 'bg-indigo-600'
                                    }`}
                                style={{ width: `${loadPercentage}%` }}
                            />
                        </div>
                    </div>
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

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50/60 font-sans text-slate-800 overflow-hidden">
            <Header className="shrink-0" />

            <div className="flex flex-1 w-full overflow-hidden relative">
                {/* Mobile Hamburger Menu Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-5 h-5 text-slate-700" />
                </button>

                <Sidebar activeTab="Shipping Dashboard" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

                <div className="flex-1 min-w-0 h-full overflow-y-auto">
                    <main className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

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
                                                const statusStyle = STATUS_CONFIG[driver.status] || {
                                                    color: 'text-slate-700',
                                                    bg: 'bg-slate-50',
                                                    border: 'border-slate-200/80',
                                                    dot: 'bg-slate-400'
                                                };
                                                const loadPercentage = Math.min(100, Math.round((driver.currentLoad / driver.maxCapacity) * 100));

                                                return (
                                                    <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900">{driver.id}</td>
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
                                                                        className={`h-full rounded-full transition-all ${loadPercentage >= 90 ? 'bg-rose-500' : loadPercentage >= 60 ? 'bg-amber-500' : 'bg-indigo-600'
                                                                            }`}
                                                                        style={{ width: `${loadPercentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 sm:px-6 text-slate-600 font-medium">{driver.vehicle}</td>
                                                        <td className="py-4 px-4 sm:px-6">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                                                {driver.status}
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
                                <p className="text-xs text-slate-500 mt-0.5">Driver: <span className="font-semibold text-slate-800">{selectedDriver.name}</span></p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Orders for Pickup</p>
                            <div className="space-y-2">
                                {AVAILABLE_UNASSIGNED_ORDERS.map((order) => (
                                    <label key={order.id} className="flex items-start sm:items-center gap-3 p-3 border border-slate-200/80 rounded-xl hover:bg-slate-50/80 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrdersToAssign.includes(order.id)}
                                            onChange={() => toggleOrderSelection(order.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 sm:mt-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-slate-800 block">{order.id}</span>
                                            <span className="text-xs text-slate-400">{order.type} • {order.location}</span>
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex-shrink-0">
                                            Unassigned
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2 bg-slate-50/50">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-sm font-medium transition"
                            >
                                Cancel
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
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newDriver.name}
                                    onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                                    placeholder="e.g. Rahul Sharma"
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    value={newDriver.phone}
                                    onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Zone</label>
                                <input
                                    type="text"
                                    value={newDriver.zone}
                                    onChange={e => setNewDriver({ ...newDriver, zone: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle</label>
                                    <input
                                        type="text"
                                        value={newDriver.vehicle}
                                        onChange={e => setNewDriver({ ...newDriver, vehicle: e.target.value })}
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
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                                <select
                                    value={newDriver.status}
                                    onChange={e => setNewDriver({ ...newDriver, status: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Route">On Route</option>
                                    <option value="Offline">Offline</option>
                                </select>
                            </div>
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
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                                >
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
                            <h3 className="text-lg font-bold text-slate-900">Edit Driver ({editDriverData.id})</h3>
                            <button onClick={() => setShowEditDriverModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditDriverSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editDriverData.name}
                                    onChange={e => setEditDriverData({ ...editDriverData, name: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    value={editDriverData.phone}
                                    onChange={e => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Zone</label>
                                <input
                                    type="text"
                                    value={editDriverData.zone}
                                    onChange={e => setEditDriverData({ ...editDriverData, zone: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle</label>
                                    <input
                                        type="text"
                                        value={editDriverData.vehicle}
                                        onChange={e => setEditDriverData({ ...editDriverData, vehicle: e.target.value })}
                                        className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editDriverData.maxCapacity}
                                        onChange={e => setEditDriverData({ ...editDriverData, maxCapacity: Number(e.target.value) })}
                                        className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                                <select
                                    value={editDriverData.status}
                                    onChange={e => setEditDriverData({ ...editDriverData, status: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-sm text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Route">On Route</option>
                                    <option value="Offline">Offline</option>
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