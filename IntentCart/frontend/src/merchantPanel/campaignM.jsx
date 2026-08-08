import React, { useState, useEffect } from 'react';
import { Bell, User, ChevronDown, Plus, Search, Filter, Calendar as CalendarIcon, Clock, Eye, Edit, Trash2, Play, Pause, CheckCircle, XCircle, Copy, RefreshCw, TrendingUp, Users, DollarSign, Tag, Percent, Gift, Truck, Zap } from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line,
    Legend
} from 'recharts';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';
import Modal from './components/Modal';
import CampaignForm from './components/CampaignForm';
import CouponValidator from './components/CouponValidator';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Color palette for charts
const COLORS = ['#2a1a6f', '#0284c7', '#38bdf8', '#64748b', '#f59e0b', '#10b981', '#ef4444'];

const CampaignManagement = () => {
    // State Management
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeCampaigns: 0,
        totalConversions: 0,
        totalRevenue: 0,
        typeDistribution: [],
        channelPerformance: []
    });
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        search: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [logs, setLogs] = useState([]);

    // Fetch campaigns on component mount and filter changes
    useEffect(() => {
        fetchCampaigns();
        fetchStats();
    }, [filters, currentPage]);

    // Fetch campaigns from API
    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: 10,
                ...(filters.status && { status: filters.status }),
                ...(filters.type && { type: filters.type })
            });

            const response = await axios.get(
                `${API_BASE_URL}/merchant/campaigns?${queryParams}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setCampaigns(response.data.campaigns);
                setTotalPages(response.data.pages);
                setCurrentPage(response.data.currentPage);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    // Fetch campaign statistics
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/merchant/campaigns/stats`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Fetch campaign logs
    const fetchCampaignLogs = async (campaignId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/merchant/campaigns/${campaignId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setLogs(response.data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    // Create new campaign
    const handleCreateCampaign = async (campaignData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/merchant/campaigns`,
                campaignData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('Campaign created successfully!');
                setIsModalOpen(false);
                fetchCampaigns();
                fetchStats();
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            toast.error(error.response?.data?.message || 'Failed to create campaign');
        }
    };

    // Update campaign
    const handleUpdateCampaign = async (id, campaignData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_BASE_URL}/merchant/campaigns/${id}`,
                campaignData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('Campaign updated successfully!');
                setIsModalOpen(false);
                fetchCampaigns();
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating campaign:', error);
            toast.error(error.response?.data?.message || 'Failed to update campaign');
        }
    };

    // Update campaign status
    const handleStatusChange = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_BASE_URL}/merchant/campaigns/${id}/status`,
                { status },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success(`Campaign ${status} successfully!`);
                fetchCampaigns();
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    // Delete campaign
    const handleDeleteCampaign = async (id) => {
        if (!window.confirm('Are you sure you want to delete this campaign?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_BASE_URL}/merchant/campaigns/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('Campaign deleted successfully!');
                fetchCampaigns();
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting campaign:', error);
            toast.error(error.response?.data?.message || 'Failed to delete campaign');
        }
    };

    // Validate coupon
    const handleValidateCoupon = async (couponData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/merchant/campaigns/validate-coupon`,
                couponData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('Coupon is valid!');
                return response.data.coupon;
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            toast.error(error.response?.data?.message || 'Invalid coupon');
            return null;
        }
    };

    // Apply coupon to order
    const handleApplyCoupon = async (couponData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/merchant/campaigns/apply-coupon`,
                couponData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('Coupon applied successfully!');
                fetchCampaigns();
                fetchStats();
                return response.data;
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            toast.error(error.response?.data?.message || 'Failed to apply coupon');
            return null;
        }
    };

    // View campaign details
    const handleViewCampaign = async (campaign) => {
        setSelectedCampaign(campaign);
        setModalType('view');
        setIsModalOpen(true);
        await fetchCampaignLogs(campaign._id);
    };

    // Edit campaign
    const handleEditCampaign = (campaign) => {
        setSelectedCampaign(campaign);
        setModalType('edit');
        setIsModalOpen(true);
    };

    // Render status badge
    const renderStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-gray-200 text-gray-700', icon: <Edit className="w-3 h-3" /> },
            scheduled: { color: 'bg-blue-100 text-blue-700', icon: <CalendarIcon className="w-3 h-3" /> },
            active: { color: 'bg-green-100 text-green-700', icon: <Play className="w-3 h-3" /> },
            paused: { color: 'bg-yellow-100 text-yellow-700', icon: <Pause className="w-3 h-3" /> },
            completed: { color: 'bg-purple-100 text-purple-700', icon: <CheckCircle className="w-3 h-3" /> },
            cancelled: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> }
        };

        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Get current date
    const getCurrentDate = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Prepare chart data from real stats
    const getChannelPerformanceData = () => {
        if (stats.channelPerformance && stats.channelPerformance.length > 0) {
            return stats.channelPerformance.map(item => ({
                metric: item._id || 'Unknown',
                count: item.count || 0,
                fill: COLORS[Math.floor(Math.random() * COLORS.length)]
            }));
        }
        // Fallback to sample data
        return [
            { metric: 'Open Rate', count: 350, fill: '#2a1a6f' },
            { metric: 'Click Rate', count: 220, fill: '#0284c7' },
            { metric: 'Conversion Rate', count: 50, fill: '#38bdf8' },
        ];
    };

    const getCampaignTypesData = () => {
        if (stats.typeDistribution && stats.typeDistribution.length > 0) {
            return stats.typeDistribution.map((item, index) => ({
                name: item._id.replace('_', ' ').toUpperCase(),
                value: item.count || 0,
                color: COLORS[index % COLORS.length]
            }));
        }
        // Fallback to sample data
        return [
            { name: 'Discount', value: 40, color: '#2a1a6f' },
            { name: 'Coupon', value: 25, color: '#0284c7' },
            { name: 'Free Shipping', value: 20, color: '#38bdf8' },
            { name: 'Loyalty Reward', value: 15, color: '#64748b' },
        ];
    };

    // Get recent logs from real data
    const getRecentLogs = () => {
        if (logs && logs.length > 0) {
            return logs.slice(0, 4).map(log => ({
                event: `${log.eventType} - ${log.couponCode || 'N/A'}`,
                time: new Date(log.createdAt).toLocaleString()
            }));
        }
        // Fallback to sample logs
        return [
            { event: 'Summer Sale Draft Saved', time: '1 today' },
            { event: 'Coupon Code Sent', time: '3 hours ago' },
            { event: 'Summer Sale Draft Sale', time: '3 hours ago' },
            { event: 'Coupon Code Sent', time: '2 hours ago' },
        ];
    };

    // Get active campaigns for calendar
    const getActiveCampaignsForCalendar = () => {
        return campaigns
            .filter(c => c.status === 'active' || c.status === 'scheduled')
            .slice(0, 3)
            .map((campaign, index) => ({
                name: campaign.name,
                status: campaign.status,
                color: ['#5b4da7', '#0284c7', '#38bdf8'][index % 3]
            }));
    };

    // Format date for display
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const activeCampaigns = getActiveCampaignsForCalendar();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Toaster position="top-right" />

            {/* 2. Header placed at the top (full width) */}
            <Header />

            {/* 3. Row layout below Header for Sidebar + Main Content */}
            <div className="flex flex-1 overflow-hidden">

                {/* 4. Sidebar pinned on the left */}
                <Sidebar />

                {/* 5. Main Content takes up remaining space */}
                <div className="flex-1 overflow-y-auto">
                    {/* DASHBOARD BODY */}
                    <main className="flex-1 p-8 overflow-y-auto space-y-6">

                        {/* STATS CARDS SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Active Campaigns</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">{stats.activeCampaigns || 0}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Conversions</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">{stats.totalConversions?.toLocaleString() || 0}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Promo Value</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">{formatCurrency(stats.totalRevenue || 0)}</p>
                            </div>
                        </div>

                        {/* HEADING & ACTION BAR */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Campaign Management</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-slate-600">{getCurrentDate()}</span>
                                <button
                                    onClick={() => {
                                        setSelectedCampaign(null);
                                        setModalType('create');
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-[#1e1b4b] hover:bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow transition-colors"
                                >
                                    Create New Campaign
                                </button>
                            </div>
                        </div>

                        {/* CAMPAIGN CALENDAR GRID */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-800">Campaign Calendar</h2>
                                {/* Legend */}
                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                                    {activeCampaigns.map((campaign, index) => (
                                        <div key={index} className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: campaign.color }} />
                                            <span>{campaign.name}</span>
                                        </div>
                                    ))}
                                    {activeCampaigns.length === 0 && (
                                        <span className="text-slate-400">No active campaigns</span>
                                    )}
                                </div>
                            </div>

                            {/* Calendar Table Container */}
                            <div className="border border-slate-200 rounded-lg overflow-x-auto">
                                <div className="min-w-[600px]">
                                    {/* Days Header */}
                                    <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50/50 text-center text-xs font-semibold text-slate-700 py-2">
                                        <div>Sun</div>
                                        <div>Mon</div>
                                        <div>Tue</div>
                                        <div>Wed</div>
                                        <div>Thu</div>
                                        <div>Fri</div>
                                    </div>

                                    {/* Timeline Tracks */}
                                    <div className="grid grid-cols-6 divide-x divide-slate-200 min-h-[140px] relative p-2 space-y-2">
                                        {loading ? (
                                            <div className="col-span-6 flex justify-center items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : activeCampaigns.length === 0 ? (
                                            <div className="col-span-6 text-center text-slate-400 py-4">
                                                No campaigns scheduled
                                            </div>
                                        ) : (
                                            activeCampaigns.map((campaign, index) => (
                                                <div
                                                    key={index}
                                                    className={`col-start-${index + 2} col-span-${4 - index} text-white text-xs px-3 py-1.5 rounded-md flex justify-between items-center shadow-sm font-medium`}
                                                    style={{ backgroundColor: campaign.color }}
                                                >
                                                    <span>{campaign.name}</span>
                                                    <span className="text-[10px] opacity-90 font-light">
                                                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM TRIPLE WIDGETS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* 1. RECENT CAMPAIGN LOGS */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <h3 className="text-sm font-bold text-slate-800 mb-3">Recent Campaign Logs</h3>
                                <div className="space-y-2.5">
                                    {loading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        getRecentLogs().map((log, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="font-semibold text-slate-800">{log.event}</span>
                                                <span className="text-slate-400 font-medium text-[11px]">{log.time}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* 2. CHANNEL PERFORMANCE BAR CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Channel Performance</h3>
                                <div className="h-40 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={getChannelPerformanceData()}
                                            margin={{ top: 10, right: 75, left: -25, bottom: 0 }}
                                        >
                                            <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="metric" hide />
                                            <YAxis domain={[0, 400]} ticks={[0, 100, 200, 300, 400]} axisLine={false} tickLine={false} />
                                            <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={24}>
                                                {getChannelPerformanceData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    {/* Custom Inline Label Legend on Right */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-1.5 text-[10px] font-semibold text-slate-700">
                                        {getChannelPerformanceData().map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <span>{item.metric}</span>
                                                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.fill }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. CAMPAIGN TYPES OVERVIEW DONUT CHART */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Campaign Types Overview</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-36 h-36">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={getCampaignTypesData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={32}
                                                    outerRadius={55}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                >
                                                    {getCampaignTypesData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Custom Legend */}
                                    <div className="space-y-1.5 text-[11px] font-semibold text-slate-700">
                                        {getCampaignTypesData().map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* CAMPAIGNS TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">All Campaigns</h3>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button
                                        onClick={fetchCampaigns}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                            </div>
                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : campaigns.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-400">No campaigns found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Name</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Type</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Status</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Budget</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Used</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Revenue</th>
                                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Date</th>
                                                <th className="text-right text-xs font-semibold text-slate-600 px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {campaigns.map((campaign) => (
                                                <tr key={campaign._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <div className="font-medium text-slate-800 text-sm">{campaign.name}</div>
                                                            {campaign.couponCode && (
                                                                <div className="text-xs font-mono text-blue-600 mt-0.5">
                                                                    {campaign.couponCode}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm capitalize">{campaign.type?.replace('_', ' ') || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {renderStatusBadge(campaign.status)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm">
                                                            {campaign.budget > 0 ? formatCurrency(campaign.budget) : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm">
                                                            {campaign.totalUses || 0}
                                                            {campaign.maxUses > 0 && (
                                                                <span className="text-xs text-slate-500"> / {campaign.maxUses}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-green-600">
                                                            {formatCurrency(campaign.totalRevenue || 0)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-xs">
                                                            <div>{formatDate(campaign.startDate)}</div>
                                                            <div className="text-slate-500">{formatDate(campaign.endDate)}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleViewCampaign(campaign)}
                                                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4 text-slate-500" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditCampaign(campaign)}
                                                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                                title="Edit"
                                                                disabled={campaign.status === 'active'}
                                                            >
                                                                <Edit className={`w-4 h-4 ${campaign.status === 'active' ? 'text-slate-300' : 'text-blue-500'}`} />
                                                            </button>
                                                            {campaign.status === 'draft' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(campaign._id, 'scheduled')}
                                                                    className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                                                                    title="Schedule"
                                                                >
                                                                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                                                                </button>
                                                            )}
                                                            {campaign.status === 'scheduled' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(campaign._id, 'active')}
                                                                    className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                                                                    title="Activate"
                                                                >
                                                                    <Play className="w-4 h-4 text-green-500" />
                                                                </button>
                                                            )}
                                                            {(campaign.status === 'active' || campaign.status === 'scheduled') && (
                                                                <button
                                                                    onClick={() => handleStatusChange(campaign._id, 'paused')}
                                                                    className="p-1.5 hover:bg-yellow-100 rounded-lg transition-colors"
                                                                    title="Pause"
                                                                >
                                                                    <Pause className="w-4 h-4 text-yellow-500" />
                                                                </button>
                                                            )}
                                                            {campaign.status === 'paused' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(campaign._id, 'active')}
                                                                    className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                                                                    title="Resume"
                                                                >
                                                                    <Play className="w-4 h-4 text-green-500" />
                                                                </button>
                                                            )}
                                                            {campaign.status !== 'active' && campaign.status !== 'completed' && (
                                                                <button
                                                                    onClick={() => handleDeleteCampaign(campaign._id)}
                                                                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                                    <div className="text-sm text-slate-500">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border border-slate-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 border border-slate-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </main>
                </div>
            </div>

            {/* Modal for Create/Edit/View */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCampaign(null);
                    setLogs([]);
                }}
                title={
                    modalType === 'create' ? 'Create New Campaign' :
                        modalType === 'edit' ? 'Edit Campaign' :
                            'Campaign Details'
                }
                size={modalType === 'view' ? 'large' : 'medium'}
            >
                {modalType === 'view' ? (
                    <div className="space-y-6">
                        {/* Campaign Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Name</h4>
                                <p className="text-sm font-semibold">{selectedCampaign?.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Type</h4>
                                <p className="text-sm font-semibold capitalize">{selectedCampaign?.type?.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Status</h4>
                                {renderStatusBadge(selectedCampaign?.status)}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Coupon Code</h4>
                                <p className="text-sm font-mono text-blue-600">{selectedCampaign?.couponCode || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Discount</h4>
                                <p className="text-sm font-semibold">
                                    {selectedCampaign?.discountType === 'percentage'
                                        ? `${selectedCampaign?.discountValue}%`
                                        : selectedCampaign?.discountType === 'fixed'
                                            ? formatCurrency(selectedCampaign?.discountValue)
                                            : 'Free Shipping'}
                                    {selectedCampaign?.maxDiscountAmount > 0 &&
                                        ` (Max ${formatCurrency(selectedCampaign?.maxDiscountAmount)})`
                                    }
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Min Order</h4>
                                <p className="text-sm font-semibold">
                                    {selectedCampaign?.minOrderAmount > 0
                                        ? formatCurrency(selectedCampaign?.minOrderAmount)
                                        : 'No minimum'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Budget</h4>
                                <p className="text-sm font-semibold">
                                    {selectedCampaign?.budget > 0
                                        ? formatCurrency(selectedCampaign?.budget)
                                        : 'Unlimited'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Used / Max</h4>
                                <p className="text-sm font-semibold">
                                    {selectedCampaign?.totalUses || 0}
                                    {selectedCampaign?.maxUses > 0 &&
                                        ` / ${selectedCampaign?.maxUses}`
                                    }
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Revenue Generated</h4>
                                <p className="text-sm font-semibold text-green-600">
                                    {formatCurrency(selectedCampaign?.totalRevenue || 0)}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-500">Date Range</h4>
                                <p className="text-sm">
                                    {selectedCampaign?.startDate && formatDate(selectedCampaign.startDate)}
                                    {' - '}
                                    {selectedCampaign?.endDate && formatDate(selectedCampaign.endDate)}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <h4 className="text-sm font-medium text-slate-500">Description</h4>
                                <p className="text-sm">{selectedCampaign?.description || 'No description'}</p>
                            </div>
                        </div>

                        {/* Campaign Logs */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-500 mb-3">Activity Log</h4>
                            {logs.length === 0 ? (
                                <p className="text-sm text-slate-400">No activity recorded yet</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {logs.map((log, index) => (
                                        <div key={index} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium capitalize">{log.eventType}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                {log.customerId && (
                                                    <div className="text-xs text-slate-500">
                                                        Customer: {log.customerId.name || log.customerId.email}
                                                    </div>
                                                )}
                                                {log.discountAmount > 0 && (
                                                    <div className="text-xs text-slate-500">
                                                        Discount: {formatCurrency(log.discountAmount)}
                                                    </div>
                                                )}
                                                {log.orderAmount > 0 && (
                                                    <div className="text-xs text-slate-500">
                                                        Order: {formatCurrency(log.orderAmount)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                            >
                                Close
                            </button>
                            {selectedCampaign?.couponCode && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedCampaign.couponCode);
                                        toast.success('Coupon code copied!');
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Coupon
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <CampaignForm
                        initialData={selectedCampaign}
                        onSubmit={modalType === 'create' ? handleCreateCampaign : handleUpdateCampaign}
                        onCancel={() => {
                            setIsModalOpen(false);
                            setSelectedCampaign(null);
                        }}
                        isEdit={modalType === 'edit'}
                    />
                )}
            </Modal>
        </div>
    );
};

export default CampaignManagement;