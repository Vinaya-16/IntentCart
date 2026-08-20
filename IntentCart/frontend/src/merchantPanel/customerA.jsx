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
    Filter,
    Zap,
    Target,
    ShoppingBag,
    DollarSign,
    Clock,
    Sparkles,
    Crown,
    Users as UsersIcon,
    Tag,
    Zap as ZapIcon,
    ShoppingCart,
    Calendar,
    Mail,
    Phone,
    Star,
    Award,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    ChevronDown as ChevronDownIcon,
    ChevronUp as ChevronUpIcon,
    Telescope,
    HeartHandshake
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_BASE_URI = import.meta.env.VITE_APP_URL;
const API_URL = `${API_BASE_URI}/merchant` || 'http://localhost:5000/api/merchant';

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const CustomerAnalysis = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [showSegmentationModal, setShowSegmentationModal] = useState(false);
    const [segmentationLoading, setSegmentationLoading] = useState(false);
    const [segmentationResults, setSegmentationResults] = useState(null);
    const [expandedSegments, setExpandedSegments] = useState({});
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
    const [customerOrders, setCustomerOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

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
                setCustomerOrders(data.customer.orders || []);
                setShowCustomerModal(true);
            }
        } catch (err) {
            console.error('Error fetching customer details:', err);
            setError(err.message);
        } finally {
            setDetailsLoading(false);
        }
    };

    // Run customer segmentation
    const runSegmentation = async () => {
        try {
            setSegmentationLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setSegmentationLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/customers/segment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to run customer segmentation');
            }

            const data = await response.json();
            // console.log('Segmentation API Response:', data);

            if (data.success) {
                // Log each segment's customer count
                // data.segments.segments.forEach(seg => {
                //     console.log(`${seg.name}: ${seg.count} customers, ${seg.customers?.length || 0} in list`);
                // });

                // Use the data directly from the API - NO additional mapping
                setSegmentationResults({
                    ...data.segments,
                    segments: data.segments.segments
                });
                setShowSegmentationModal(true);
                fetchCustomers();
            }
        } catch (err) {
            console.error('Error running segmentation:', err);
            setError(err.message);
        } finally {
            setSegmentationLoading(false);
        }
    };

    // Fetch all customers for segmentation
    const fetchAllCustomers = async () => {
        try {
            const token = getToken();
            if (!token) return [];

            const response = await fetch(`${API_URL}/customers?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return [];
            const data = await response.json();
            return data.customers || [];
        } catch (error) {
            console.error('Error fetching all customers:', error);
            return [];
        }
    };

    // View customer details
    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        fetchCustomerDetails(customer.customerId);
    };

    // Toggle segment expansion
    const toggleSegment = (segmentName) => {
        setExpandedSegments(prev => ({
            ...prev,
            [segmentName]: !prev[segmentName]
        }));
    };

    useEffect(() => {
        fetchCustomers();
    }, [selectedSegment, searchTerm]);

    // Segment styling
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

    // Get segment icon and color
    const getSegmentIcon = (segment) => {
        const icons = {
            'High Value Customers': { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100', emoji: <Crown /> },
            'Window Shoppers': { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-100', emoji: <Telescope /> },
            'Price Sensitive': { icon: Tag, color: 'text-orange-500', bg: 'bg-orange-100', emoji: <Tag /> },
            'Impulse Buyers': { icon: ZapIcon, color: 'text-purple-500', bg: 'bg-purple-100', emoji: <Zap /> },
            'Loyal Customers': { icon: UsersIcon, color: 'text-emerald-500', bg: 'bg-emerald-100', emoji: <HeartHandshake /> }
        };
        return icons[segment] || { icon: Users, color: 'text-gray-500', bg: 'bg-gray-100', emoji: <User /> };
    };

    // Get segment description
    const getSegmentDescription = (segment) => {
        const descriptions = {
            'High Value Customers': 'Top 20% of customers who contribute to 80% of revenue. These are your most valuable customers with high spending and frequency.',
            'Window Shoppers': 'Customers who browse frequently but rarely make purchases. They need targeted offers and incentives to convert.',
            'Price Sensitive': 'Customers who primarily purchase during sales or with discounts. They respond strongly to price drops and promotions.',
            'Impulse Buyers': 'Customers who make spontaneous, unplanned purchases. They respond well to limited-time offers and flash sales.',
            'Loyal Customers': 'Regular customers with high retention rates. They are brand advocates who consistently choose your store.'
        };
        return descriptions[segment] || 'Customer segment based on behavior and purchase patterns.';
    };

    // Get segment recommendation
    const getSegmentRecommendation = (segment) => {
        const recommendations = {
            'High Value Customers': 'Offer exclusive VIP perks, early access to sales, and personalized recommendations to maintain loyalty.',
            'Window Shoppers': 'Send targeted retargeting ads, offer first-purchase discounts, and showcase popular products to convert.',
            'Price Sensitive': 'Send price-drop alerts, create flash sale events, and bundle products for better value propositions.',
            'Impulse Buyers': 'Use limited-time offers, create urgency with countdown timers, and suggest complementary products.',
            'Loyal Customers': 'Reward with loyalty points, offer referral bonuses, and provide early access to new collections.'
        };
        return recommendations[segment] || 'Continue engaging this segment with targeted marketing campaigns.';
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

    // Get order status color
    const getOrderStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'bg-emerald-100 text-emerald-700';
            case 'completed':
                return 'bg-blue-100 text-blue-700';
            case 'pending':
                return 'bg-amber-100 text-amber-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            case 'processing':
                return 'bg-purple-100 text-purple-700';
            case 'shipped':
                return 'bg-cyan-100 text-cyan-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Prepare chart data for segment distribution
    const getSegmentChartData = () => {
        if (!segmentationResults) return [];
        return segmentationResults.segments.map(seg => ({
            name: seg.name,
            value: seg.count,
            color: COLORS[segmentationResults.segments.indexOf(seg) % COLORS.length]
        }));
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

                        {/* PAGE TITLE & SEGMENTATION BUTTON */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Customer Analysis</h1>
                            <button
                                onClick={runSegmentation}
                                disabled={segmentationLoading}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-black font-medium px-5 py-2.5 rounded-lg text-sm shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {segmentationLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Segmenting...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                        AI Customer Segmentation
                                    </>
                                )}
                            </button>
                        </div>

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
                                            <th className="py-3.5 px-4">Customer</th>
                                            <th className="py-3.5 px-4">Email</th>
                                            <th className="py-3.5 px-4 text-center">Orders</th>
                                            <th className="py-3.5 px-4 text-center">Lifetime Value</th>
                                            <th className="py-3.5 px-4 text-center">Last Purchase</th>
                                            <th className="py-3.5 px-4 text-center">Segment</th>
                                            <th className="py-3.5 px-4 text-center">Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {customers.length > 0 ? (
                                            customers.map((customer, index) => (
                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{customer.name}</p>
                                                            <p className="text-xs text-gray-400">#{customer.id}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-600">
                                                        {customer.email}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                        {customer.totalOrders}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-emerald-600">
                                                        {formatCurrency(customer.lifetimeValue)}
                                                    </td>
                                                    <td className="py-4 px-4 text-center text-slate-600">
                                                        {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'}
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
                                                <td colSpan="7" className="text-center py-6 text-slate-500">
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

            {/* Customer Segmentation Modal - With Customer Lists */}
            {showSegmentationModal && segmentationResults && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-[#1e3a6a] flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    AI Customer Segmentation
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {segmentationResults.totalCustomers} customers segmented into {segmentationResults.segments.length} groups based on behavior and purchase patterns
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSegmentationModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Segment Distribution Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Segment Distribution</h4>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={getSegmentChartData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {getSegmentChartData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Segment Insights</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {segmentationResults.segments.map((seg, idx) => {
                                            const Icon = getSegmentIcon(seg.name).icon;
                                            const iconColor = getSegmentIcon(seg.name).color;
                                            const iconBg = getSegmentIcon(seg.name).bg;
                                            return (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                                    <div className={`p-1.5 rounded-lg ${iconBg}`}>
                                                        <Icon className={`w-4 h-4 ${iconColor}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold text-slate-800">{seg.name}</p>
                                                        <p className="text-xs text-gray-500">{seg.count} customers</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-[#1e3a6a]">{seg.conversionRate}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Segment Cards with Customer Lists */}
                            <div className="grid grid-cols-1 gap-4">
                                {segmentationResults.segments.map((segment, index) => {
                                    const SegmentIcon = getSegmentIcon(segment.name).icon;
                                    const iconColor = getSegmentIcon(segment.name).color;
                                    const iconBg = getSegmentIcon(segment.name).bg;
                                    const isExpanded = expandedSegments[segment.name] || false;

                                    // Get customers - try multiple sources
                                    let segmentCustomers = [];

                                    // Check if segment has customers array
                                    if (segment.customers && Array.isArray(segment.customers) && segment.customers.length > 0) {
                                        segmentCustomers = segment.customers;
                                    }
                                    // Fallback: Try to get customers from the main customers list
                                    else if (segment.count > 0) {
                                        // Try to find customers for this segment from the main list
                                        const segmentName = segment.name;
                                        const matchingCustomers = customers.filter(c => {
                                            if (segmentName === 'High Value Customers' && c.segment === 'Top Tier') return true;
                                            if (segmentName === 'Loyal Customers' && c.totalOrders >= 3 && c.lifetimeValue >= 10000) return true;
                                            if (segmentName === 'Price Sensitive' && c.totalOrders >= 2 && c.lifetimeValue < 5000) return true;
                                            if (segmentName === 'Impulse Buyers' && c.totalOrders <= 2 && c.lifetimeValue >= 5000) return true;
                                            if (segmentName === 'Window Shoppers' && c.totalOrders <= 2 && c.lifetimeValue < 10000) return true;
                                            return false;
                                        });
                                        segmentCustomers = matchingCustomers;
                                    }

                                    // If still no customers but count > 0, use the main customers list filtered by segment
                                    if (segmentCustomers.length === 0 && segment.count > 0) {
                                        const segmentName = segment.name;
                                        segmentCustomers = customers.filter(c => {
                                            if (segmentName === 'High Value Customers' && c.segment === 'Top Tier') return true;
                                            if (segmentName === 'Loyal Customers' && c.segment === 'Middle Tier' && c.totalOrders >= 3) return true;
                                            if (segmentName === 'Price Sensitive' && c.segment === 'Bottom Tier' && c.totalOrders >= 2) return true;
                                            if (segmentName === 'Impulse Buyers' && c.totalOrders <= 2 && c.lifetimeValue >= 5000) return true;
                                            if (segmentName === 'Window Shoppers' && c.totalOrders <= 2) return true;
                                            return false;
                                        });
                                    }

                                    const hasCustomers = segmentCustomers.length > 0;

                                    return (
                                        <div key={index} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                            {/* Segment Header - Clickable to expand */}
                                            <div
                                                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => toggleSegment(segment.name)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-xl ${iconBg}`}>
                                                        <SegmentIcon className={`w-6 h-6 ${iconColor}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="font-bold text-slate-800">{segment.name}</h3>
                                                                <p className="text-xs text-gray-500 mt-0.5">{segment.count} customers</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <ShoppingBag className="w-3 h-3" />
                                                                        Avg Orders: {segment.avgOrders || 'N/A'}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <DollarSign className="w-3 h-3" />
                                                                        Avg Spend: {formatCurrency(segment.avgSpend || 0)}
                                                                    </span>
                                                                </div>
                                                                {isExpanded ? (
                                                                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                                                                ) : (
                                                                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">{getSegmentDescription(segment.name)}</p>
                                                        <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                                                            <p className="text-xs text-purple-700">
                                                                {getSegmentRecommendation(segment.name)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expandable Customer List */}
                                            {isExpanded && (
                                                <div className="border-t border-slate-200 p-4 bg-slate-50/50">
                                                    {hasCustomers ? (
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                                                                Customers in this segment ({segmentCustomers.length})
                                                            </p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {segmentCustomers.slice(0, 10).map((customer, idx) => (
                                                                    <div
                                                                        key={customer.customerId || idx}
                                                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                                                                        onClick={() => {
                                                                            setShowSegmentationModal(false);
                                                                            handleViewCustomer(customer);
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                                                                                {customer.name?.charAt(0).toUpperCase() || 'U'}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-slate-800">{customer.name}</p>
                                                                                <p className="text-xs text-gray-400">{customer.email}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-xs font-semibold text-emerald-600">
                                                                                {formatCurrency(customer.lifetimeValue || customer.totalSpent || 0)}
                                                                            </p>
                                                                            <p className="text-xs text-gray-400">{customer.totalOrders || 0} orders</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {segmentCustomers.length < segment.count && (
                                                                <p className="text-xs text-gray-400 mt-2 text-center">
                                                                    Showing {segmentCustomers.length} of {segment.count} customers
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-400 text-sm">
                                                            No customers in this segment yet
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Segmentation Summary */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    Segmentation Summary
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Total Customers</p>
                                        <p className="text-lg font-bold text-[#1e3a6a]">{segmentationResults.totalCustomers}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Segments Found</p>
                                        <p className="text-lg font-bold text-[#1e3a6a]">{segmentationResults.segments.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Top Segment</p>
                                        <p className="text-lg font-bold text-emerald-600">{segmentationResults.topSegment}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Method</p>
                                        <p className="text-lg font-bold text-purple-600">Rule-Based</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3">
                                    * Currently using rule-based segmentation. AI-powered K-Means clustering will be available in the next update.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Details Modal - Same as before */}
            {showCustomerModal && customerDetails && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                    {customerDetails.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#1e3a6a]">{customerDetails.name}</h2>
                                    <p className="text-sm text-gray-500">Customer since {new Date(customerDetails.joinedAt).toLocaleDateString()}</p>
                                </div>
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
                                {/* Tabs */}
                                <div className="flex gap-2 border-b border-slate-200">
                                    {['overview', 'orders', 'activity'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                                                ? 'border-[#1e3a6a] text-[#1e3a6a]'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-xl text-center">
                                                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                    <ShoppingBag className="w-3 h-3" />
                                                    Total Orders
                                                </p>
                                                <p className="text-2xl font-bold text-[#1e3a6a]">{customerDetails.totalOrders}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl text-center">
                                                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    Lifetime Value
                                                </p>
                                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(customerDetails.totalSpent)}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl text-center">
                                                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                    <ShoppingCart className="w-3 h-3" />
                                                    Avg Order Value
                                                </p>
                                                <p className="text-2xl font-bold text-[#1e3a6a]">{formatCurrency(customerDetails.avgOrderValue)}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl text-center">
                                                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Last Purchase
                                                </p>
                                                <p className="text-sm font-semibold text-[#1e3a6a]">
                                                    {customerDetails.lastPurchase ? new Date(customerDetails.lastPurchase).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl text-center">
                                                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    Email
                                                </p>
                                                <p className="text-sm font-semibold text-[#1e3a6a] truncate">{customerDetails.email}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl text-center">
                                                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    Phone
                                                </p>
                                                <p className="text-sm font-semibold text-[#1e3a6a]">{customerDetails.phone || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 justify-center">
                                            <p className="text-sm text-gray-500">Segment:</p>
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getSegmentBadgeColor(customerDetails.segment)}`}>
                                                {customerDetails.segment}
                                            </span>
                                        </div>

                                        {/* <div className="flex gap-2 justify-center">
                                            <button className="px-4 py-2 bg-[#1e3a6a] text-white rounded-lg text-sm hover:bg-blue-800 transition">
                                                Send Offer
                                            </button>
                                            <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition">
                                                View Analytics
                                            </button>
                                            <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition">
                                                Export Data
                                            </button>
                                        </div> */}
                                    </div>
                                )}

                                {activeTab === 'orders' && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Order History</h4>
                                        {customerOrders.length > 0 ? (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {customerOrders.map((order, idx) => (
                                                    <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium text-sm text-[#1e3a6a]">#{order.orderId}</p>
                                                                <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-[#1e3a6a]">{formatCurrency(order.total)}</p>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(order.status)}`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {order.items && order.items.length > 0 && (
                                                            <div className="mt-2 pt-2 border-t border-slate-100">
                                                                <p className="text-xs text-gray-500 mb-1">Items ({order.items.length})</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {order.items.slice(0, 3).map((item, i) => (
                                                                        <span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                                                            {item.productId?.name || 'Product'} x {item.quantity || 1}
                                                                        </span>
                                                                    ))}
                                                                    {order.items.length > 3 && (
                                                                        <span className="text-xs text-gray-400">+{order.items.length - 3} more</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">No orders found for this customer</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Customer Activity</h4>
                                        <div className="space-y-3">
                                            <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
                                                <div className="p-2 bg-emerald-100 rounded-lg">
                                                    <UserPlus className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-800">Joined</p>
                                                    <p className="text-xs text-gray-500">{new Date(customerDetails.joinedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            {customerDetails.totalOrders > 0 && (
                                                <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-slate-800">First Order</p>
                                                        <p className="text-xs text-gray-500">
                                                            {customerOrders.length > 0 ? new Date(customerOrders[customerOrders.length - 1].date).toLocaleString() : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {customerDetails.lastPurchase && (
                                                <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                        <Clock className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-slate-800">Last Activity</p>
                                                        <p className="text-xs text-gray-500">{new Date(customerDetails.lastPurchase).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerAnalysis;