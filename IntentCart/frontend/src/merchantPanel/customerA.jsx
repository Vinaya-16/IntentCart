import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    User, 
    ChevronDown, 
    Search, 
    Loader2, 
    WifiOff, 
    RefreshCw,
    Eye,
    TrendingUp,
    Users,
    IndianRupee,
    UserPlus,
    ChevronRight,
    X,
    Filter
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx'; 
import Header from './components/Header.jsx';

const API_URL = 'http://localhost:5000/api/merchant';

const CustomerAnalysis = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [stats, setStats] = useState({
        totalCustomers: 0,
        avgLifetimeValue: 0,
        newCustomers: 0,
        segmentBreakdown: {
            'Top Tier': 0,
            'Middle Tier': 0,
            'Bottom Tier': 0
        }
    });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const getToken = () => localStorage.getItem('token');

    // Fetch customers
    const fetchCustomers = async () => {
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

            const url = selectedSegment === 'all' 
                ? `${API_URL}/customers${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`
                : `${API_URL}/customers?segment=${selectedSegment}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;

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
                throw new Error('Failed to fetch customers');
            }

            const data = await response.json();
            if (data.success) {
                setCustomers(data.customers || []);
                setStats({
                    totalCustomers: data.stats.totalCustomers || 0,
                    avgLifetimeValue: data.stats.avgLifetimeValue || 0,
                    newCustomers: data.stats.newCustomers || 0,
                    segmentBreakdown: data.stats.segmentBreakdown || {
                        'Top Tier': 0,
                        'Middle Tier': 0,
                        'Bottom Tier': 0
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
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

    // Fetch customer details
    const fetchCustomerDetails = async (customerId) => {
        try {
            setDetailsLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setDetailsLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/customers/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch customer details');
            }

            const data = await response.json();
            if (data.success) {
                setCustomerDetails(data.customer);
                setShowCustomerModal(true);
            }
        } catch (err) {
            console.error('Error fetching customer details:', err);
            setError(err.message);
        } finally {
            setDetailsLoading(false);
        }
    };

    // View customer details
    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        fetchCustomerDetails(customer.customerId);
    };

    useEffect(() => {
        fetchCustomers();
    }, [selectedSegment, searchTerm]);

    // Segment styling
    const getSegmentStyle = (segment) => {
        switch (segment) {
            case 'Top Tier':
                return 'text-emerald-500 font-bold';
            case 'Middle Tier':
                return 'text-amber-500 font-bold';
            case 'Bottom Tier':
                return 'text-red-500 font-bold';
            default:
                return 'text-slate-600 font-semibold';
        }
    };

    // Segment badge color
    const getSegmentBadgeColor = (segment) => {
        switch (segment) {
            case 'Top Tier':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Middle Tier':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Bottom Tier':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
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

                        {/* Server Down */}
                        {isServerDown && (
                            <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={fetchCustomers}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Total Customers</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">
                                            {stats.totalCustomers.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <IndianRupee className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Avg Customer LTV</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">
                                            {formatCurrency(stats.avgLifetimeValue)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <UserPlus className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">New Customers (30d)</h3>
                                        <p className="text-2xl font-extrabold text-[#1e3a6a]">
                                            {stats.newCustomers}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-600 text-sm font-medium">Top Tier Customers</h3>
                                        <p className="text-2xl font-extrabold text-emerald-600">
                                            {stats.segmentBreakdown['Top Tier']}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PAGE TITLE */}
                        <h1 className="text-2xl font-bold text-[#1e3a6a] mb-6">Customer Analysis</h1>

                        {/* SEARCH & FILTERS */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="relative w-full sm:w-96">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedSegment}
                                    onChange={(e) => setSelectedSegment(e.target.value)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
                                >
                                    <option value="all">All Segments</option>
                                    <option value="Top Tier">Top Tier</option>
                                    <option value="Middle Tier">Middle Tier</option>
                                    <option value="Bottom Tier">Bottom Tier</option>
                                </select>
                                <button 
                                    onClick={fetchCustomers}
                                    className="bg-[#0b2b61] hover:bg-blue-900 text-white font-medium px-4 py-2 rounded-lg text-sm shadow transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* CUSTOMER TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#a8c5da] text-[#1e3a6a] text-xs font-bold uppercase tracking-wider">
                                            <th className="py-3.5 px-4">Customer ID</th>
                                            <th className="py-3.5 px-4">Customer Name</th>
                                            <th className="py-3.5 px-4">Email</th>
                                            <th className="py-3.5 px-4 text-center">Total Orders</th>
                                            <th className="py-3.5 px-4 text-center">Lifetime Value</th>
                                            <th className="py-3.5 px-4 text-center">Last Purchase</th>
                                            <th className="py-3.5 px-4 text-center">Segment</th>
                                            <th className="py-3.5 px-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {customers.length > 0 ? (
                                            customers.map((customer, index) => (
                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-4 font-bold text-slate-800">
                                                        #{customer.id}
                                                    </td>
                                                    <td className="py-4 px-4 font-bold text-slate-800">
                                                        {customer.name}
                                                    </td>
                                                    <td className="py-4 px-4 font-medium text-slate-800">
                                                        {customer.email}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                        {customer.totalOrders}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-slate-800">
                                                        {formatCurrency(customer.lifetimeValue)}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-slate-800">
                                                        {new Date(customer.lastPurchase).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSegmentBadgeColor(customer.segment)}`}>
                                                            {customer.segment}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            onClick={() => handleViewCustomer(customer)}
                                                            className="text-[#1e3a6a] hover:text-blue-700 transition-colors"
                                                            title="View Customer Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-6 text-slate-500">
                                                    No customers found matching your criteria
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
                                Showing {customers.length} customers
                            </span>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Top Tier: {stats.segmentBreakdown['Top Tier']}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Middle Tier: {stats.segmentBreakdown['Middle Tier']}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Bottom Tier: {stats.segmentBreakdown['Bottom Tier']}
                                </span>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Customer Details Modal */}
            {showCustomerModal && customerDetails && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-[#1e3a6a]">Customer Details</h2>
                                <p className="text-sm text-gray-500">#{customerDetails.id}</p>
                            </div>
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {detailsLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 text-[#1e3a6a] animate-spin" />
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Customer Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                                        <p className="font-medium">{customerDetails.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                                        <p className="font-medium">{customerDetails.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                                        <p className="font-medium">{customerDetails.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Member Since</p>
                                        <p className="font-medium">{new Date(customerDetails.joinedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Customer Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-gray-500">Total Orders</p>
                                        <p className="text-2xl font-bold text-[#1e3a6a]">{customerDetails.totalOrders}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-gray-500">Lifetime Value</p>
                                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(customerDetails.totalSpent)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-gray-500">Avg Order Value</p>
                                        <p className="text-2xl font-bold text-[#1e3a6a]">{formatCurrency(customerDetails.avgOrderValue)}</p>
                                    </div>
                                </div>

                                {/* Segment */}
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Segment:</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSegmentBadgeColor(customerDetails.segment)}`}>
                                        {customerDetails.segment}
                                    </span>
                                </div>

                                {/* Order History */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Order History</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {customerDetails.orders?.map((order, idx) => (
                                            <div key={idx} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-sm">#{order.orderId}</p>
                                                    <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-[#1e3a6a]">{formatCurrency(order.total)}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerAnalysis;