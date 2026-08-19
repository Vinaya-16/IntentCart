import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Truck,
    Search,
    X,
    Package,
    Filter,
    Menu,
    AlertCircle,
    Trash2,
    ShieldAlert,
    Check,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/shipping';

const ShippingNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    // Get token from localStorage
    const getToken = () => localStorage.getItem('token');

    // Fetch notifications from backend
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/notifications/shipper`, {
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
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();

            if (data.success) {
                const formattedNotifs = data.notifications.map(notif => ({
                    id: notif._id,
                    title: notif.title,
                    message: notif.message,
                    category: notif.category || 'General',
                    type: notif.type || 'Info',
                    isUnread: !notif.read,
                    timestamp: formatTime(notif.createdAt),
                    orderId: notif.metadata?.orderId || 'N/A',
                    carrier: notif.metadata?.carrier || 'N/A',
                    createdAt: notif.createdAt,
                    read: notif.read
                }));
                setNotifications(formattedNotifs);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Format time
    const formatTime = (date) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000);

        if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
        return new Date(date).toLocaleDateString();
    };

    // Mark notification as read
    const markAsRead = async (notifId) => {
        try {
            setActionLoading(notifId);

            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications/shipper/${notifId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to mark as read');
            }

            setNotifications(prev =>
                prev.map(n => n.id === notifId ? { ...n, isUnread: false } : n)
            );

        } catch (err) {
            console.error('Error marking as read:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications/shipper/mark-all-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to mark all as read');
            }

            setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
            setSuccess('All notifications marked as read');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error marking all as read:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Delete notification
    const handleDeleteNotif = async (id, e) => {
        e.stopPropagation();

        try {
            setActionLoading(id);

            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications/shipper/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }

            setNotifications(prev => prev.filter(n => n.id !== id));
            if (selectedNotif?.id === id) setSelectedNotif(null);
            setSuccess('Notification deleted');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error deleting notification:', err);
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle select notification
    const handleSelectNotification = async (notif) => {
        if (notif.isUnread) {
            await markAsRead(notif.id);
        }
        setSelectedNotif(notif);
    };

    // Load notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Filter Logic
    const filteredNotifs = useMemo(() => {
        let result = notifications;

        if (filterCategory === 'Unread') {
            result = result.filter(n => n.isUnread);
        } else if (filterCategory !== 'All') {
            result = result.filter(n => n.category === filterCategory);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(notif =>
                notif.title.toLowerCase().includes(query) ||
                notif.message.toLowerCase().includes(query) ||
                notif.orderId.toLowerCase().includes(query) ||
                notif.carrier.toLowerCase().includes(query)
            );
        }

        return result;
    }, [notifications, searchQuery, filterCategory]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => n.isUnread).length;
    }, [notifications]);

    const NOTIF_CONFIG = {
        'Urgent': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', dot: 'bg-rose-500', icon: AlertCircle },
        'Critical': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', dot: 'bg-amber-500', icon: ShieldAlert },
        'alert': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', dot: 'bg-amber-500', icon: ShieldAlert },
        'Warning': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/80', dot: 'bg-orange-500', icon: AlertTriangle },
        'Success': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle2 },
        'success': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle2 },
        'Info': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500', icon: Clock },
        'info': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500', icon: Clock },
        'order': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80', dot: 'bg-purple-500', icon: Package },
        'payment': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle2 },
        'system': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200/80', dot: 'bg-slate-500', icon: Bell },
        'product': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/80', dot: 'bg-indigo-500', icon: Package },
        'recovery': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200/80', dot: 'bg-teal-500', icon: AlertCircle }
    };

    const categories = ['All', 'Unread', 'Logistics', 'Returns', 'System', 'Fulfillment', 'Orders', 'Products', 'Payments'];

    const getConfig = (notif) => {
        return NOTIF_CONFIG[notif.type] || NOTIF_CONFIG[notif.category] || NOTIF_CONFIG.Info;
    };

    if (loading) {
        return (
            <div className="h-screen h-dvh flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-[#1e2356] mx-auto" />
                    <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen h-dvh w-full flex flex-col bg-slate-50/60 font-sans text-slate-800 overflow-hidden select-none sm:select-auto">

            {/* FIXED HEADER */}
            <Header className="shrink-0 z-30 border-b border-slate-200/80 bg-white" onMenuClick={() => setIsSidebarOpen(true)} />

            {/* MAIN APP SHELL CONTENT */}
            <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">

                {/* MOBILE OVERLAY BACKDROP */}
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                    />
                )}

                {/* SIDEBAR */}
                <aside
                    className={`fixed lg:static inset-y-0 left-0 z-50 h-full w-64 shrink-0 bg-white border-r border-slate-200/80 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                        }`}
                >
                    <Sidebar activeTab="Shipping Dashboard" onClose={() => setIsSidebarOpen(false)} />
                </aside>

                {/* CONTENT BODY */}
                <div className="flex-1 min-w-0 h-full overflow-y-auto">
                    <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs sm:text-sm rounded-xl border border-red-200 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-50 text-green-600 text-xs sm:text-sm rounded-xl border border-green-200 flex items-center gap-2">
                                <Check className="w-4 h-4 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* PAGE HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 sm:pb-5">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                {/* <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl lg:hidden transition-all shrink-0 active:scale-95"
                                    title="Open Menu"
                                >
                                    <Menu className="w-5 h-5" />
                                </button> */}

                                <button
                                    onClick={() => navigate('/shipping-dashboard')}
                                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all shrink-0 active:scale-95"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight truncate">Logistics Alerts</h1>
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-0.5 text-[11px] sm:text-xs font-bold bg-rose-500 text-white rounded-full shrink-0">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">Real-time system updates & carrier alerts.</p>
                                </div>
                            </div>

                            {/* Header Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center w-full sm:w-auto justify-end">
                                <button
                                    onClick={fetchNotifications}
                                    className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                    title="Refresh"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="sm:hidden lg:inline">Refresh</span>
                                </button>

                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="px-3 py-2 sm:px-3.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="truncate">Mark all read</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* NOTIFICATIONS CONTAINER */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">

                            {/* SEARCH & CATEGORY BAR */}
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md p-3 sm:p-5 border-b border-slate-200/80 space-y-3 sm:space-y-4">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search title, carrier, or order ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 pl-10 pr-9 py-2 sm:py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-500 font-medium self-end sm:self-center shrink-0">
                                        Showing <span className="font-bold text-slate-800">{filteredNotifs.length}</span> alerts
                                    </div>
                                </div>

                                {/* CATEGORY PILLS */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100 touch-pan-x">
                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 pl-0.5 shrink-0">
                                        <Filter className="w-3.5 h-3.5" /> Filter:
                                    </span>
                                    {categories.map((cat) => {
                                        const count = cat === 'All'
                                            ? notifications.length
                                            : cat === 'Unread'
                                                ? unreadCount
                                                : notifications.filter(n => n.category === cat).length;
                                        const isActive = filterCategory === cat;

                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setFilterCategory(cat)}
                                                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-95 ${isActive
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-slate-50 sm:bg-transparent'
                                                    }`}
                                            >
                                                <span>{cat}</span>
                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-200/70 text-slate-700'
                                                    }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* NOTIFICATION LIST */}
                            <div className="divide-y divide-slate-100">
                                {filteredNotifs.length > 0 ? (
                                    filteredNotifs.map((notif) => {
                                        const config = getConfig(notif);
                                        const IconComponent = config.icon;
                                        const isActionLoading = actionLoading === notif.id;

                                        return (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleSelectNotification(notif)}
                                                className={`p-3.5 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group relative ${notif.isUnread ? 'bg-slate-50/60' : 'bg-white'
                                                    }`}
                                            >
                                                {/* Left Unread Indicator Dot */}
                                                {notif.isUnread && (
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2.5 sm:mt-3" title="Unread"></span>
                                                )}

                                                {/* Category Icon */}
                                                <div className={`p-2 sm:p-3 rounded-xl ${config.bg} ${config.text} border ${config.border} shrink-0 mt-0.5`}>
                                                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>

                                                {/* Content Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                            <h3 className={`text-xs sm:text-sm ${notif.isUnread ? 'text-slate-900 font-bold' : 'text-slate-800 font-semibold'} truncate max-w-full`}>
                                                                {notif.title}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border} shrink-0`}>
                                                                {notif.type}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0">
                                                            {notif.timestamp}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                        {notif.message}
                                                    </p>

                                                    <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[11px] text-slate-400 font-medium flex-wrap">
                                                        <span className="flex items-center gap-1 shrink-0">
                                                            <Package className="w-3.5 h-3.5 text-slate-400" />
                                                            {notif.orderId}
                                                        </span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="flex items-center gap-1 shrink-0">
                                                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                                                            {notif.carrier}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Delete Button (Always accessible on touch devices) */}
                                                <button
                                                    onClick={(e) => handleDeleteNotif(notif.id, e)}
                                                    disabled={isActionLoading}
                                                    className="p-2 text-slate-400 sm:text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0 self-center disabled:opacity-50 active:scale-95"
                                                    title="Dismiss Alert"
                                                >
                                                    {isActionLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 sm:py-16 text-center text-slate-400 px-4">
                                        <Bell className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-slate-300 stroke-[1.5]" />
                                        <p className="text-sm font-medium text-slate-600 mt-3">No notifications found</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try clearing your filters or changing your search terms.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* DETAIL MODAL / MOBILE BOTTOM SHEET */}
            {selectedNotif && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
                    <div className="bg-white rounded-t-2xl sm:rounded-3xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-2 rounded-xl shrink-0 ${NOTIF_CONFIG[selectedNotif.type]?.bg || 'bg-slate-50'} ${NOTIF_CONFIG[selectedNotif.type]?.text || 'text-slate-700'}`}>
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Alert Details</h3>
                                    <p className="text-[11px] text-slate-400">{selectedNotif.timestamp}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNotif(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all shrink-0 active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{selectedNotif.title}</h2>
                                <p className="text-slate-600 mt-2 leading-relaxed">{selectedNotif.message}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reference ID</span>
                                    <p className="font-bold text-slate-800 mt-0.5 truncate">{selectedNotif.orderId}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Logistics Partner</span>
                                    <p className="font-bold text-slate-800 mt-0.5 truncate">{selectedNotif.carrier}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-2 shrink-0">
                            <button
                                onClick={() => setSelectedNotif(null)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingNotifications;