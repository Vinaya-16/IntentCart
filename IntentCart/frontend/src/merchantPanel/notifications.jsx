import React, { useState, useEffect, useMemo } from 'react';
import {
    Bell,
    User,
    ChevronDown,
    Search,
    CheckCheck,
    Trash2,
    ShoppingBag,
    AlertCircle,
    Package,
    Megaphone,
    Loader2,
    WifiOff,
    RefreshCw,
    XCircle,
    CheckCircle,
    Clock,
    Cross,
    MoveRight
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/merchant';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const getToken = () => localStorage.getItem('token');

    // Fetch notifications
    const fetchNotifications = async () => {
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

            const response = await fetch(`${API_URL}/notifications`, {
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
            // console.log('Notifications fetched:', data);

            if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
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

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            setActionLoading('all');
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to mark all as read');
            }

            const data = await response.json();

            // Update local state
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true, readAt: new Date() }))
            );
            setUnreadCount(0);

            setSuccess('All notifications marked as read');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error marking all as read:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Clear all notifications
    const clearAll = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications?')) {
            return;
        }

        try {
            setActionLoading('clear');
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            // Delete all notifications one by one
            for (const notif of notifications) {
                await fetch(`${API_URL}/notifications/${notif._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            setNotifications([]);
            setUnreadCount(0);
            setSuccess('All notifications cleared');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error clearing notifications:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Delete single notification
    const deleteNotification = async (id) => {
        try {
            setActionLoading(id);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }

            // Update local state
            const deleted = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (deleted && !deleted.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            setSuccess('Notification deleted');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting notification:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Mark single notification as read
    const markAsRead = async (id) => {
        try {
            setActionLoading(id);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to mark as read');
            }

            // Update local state
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            setSuccess('Marked as read');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error marking as read:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const matchesFilter = filter === 'all'
                ? true
                : filter === 'unread'
                    ? !n.read
                    : n.type === filter;
            const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.message.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [notifications, filter, searchTerm]);

    // Get icon based on type
    const getIcon = (type) => {
        switch (type) {
            case 'order': return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
            case 'system': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'campaign': return <Megaphone className="w-5 h-5 text-blue-600" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
            case 'alert': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Package className="w-5 h-5 text-slate-600" />;
        }
    };

    // Get category color
    const getCategoryColor = (category) => {
        switch (category) {
            case 'Orders': return 'bg-emerald-100 text-emerald-700';
            case 'Products': return 'bg-blue-100 text-blue-700';
            case 'Alerts': return 'bg-red-100 text-red-700';
            case 'Updates': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Format time
    const formatTime = (date) => {
        if (!date) return 'Just now';
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const filterTabs = ['all', 'unread', 'order', 'system', 'campaign'];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 p-8 overflow-y-auto space-y-6">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                                <Cross /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                                <MoveRight /> {success}
                            </div>
                        )}

                        {/* Server Down */}
                        {isServerDown && (
                            <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={fetchNotifications}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-[#1e3a6a]">Notifications</h1>
                                {unreadCount > 0 && (
                                    <span className="text-xs bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={fetchNotifications}
                                    className="p-2 text-gray-500 hover:text-[#1e3a6a] hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={markAllAsRead}
                                    disabled={actionLoading === 'all' || unreadCount === 0}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#1e3a6a] bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === 'all' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCheck className="w-4 h-4" />
                                    )}
                                    Mark all as read
                                </button>
                                <button
                                    onClick={clearAll}
                                    disabled={actionLoading === 'clear' || notifications.length === 0}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-white border border-slate-300 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === 'clear' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Clear all
                                </button>
                            </div>
                        </div>

                        {/* Filter Tabs & Search */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 md:pb-0 md:border-none">
                                {filterTabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFilter(tab)}
                                        className={`capitalize px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === tab
                                            ? 'bg-[#1e3a6a] text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-200/60'
                                            }`}
                                    >
                                        {tab}
                                        {tab === 'unread' && unreadCount > 0 && (
                                            <span className="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full md:w-72">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                />
                            </div>
                        </div>

                        {/* Notification List */}
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e3a6a] border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                                {filteredNotifications.length > 0 ? (
                                    filteredNotifications.map((n) => (
                                        <div
                                            key={n._id}
                                            className={`p-4 flex items-start gap-4 transition-colors hover:bg-slate-50 ${!n.read ? 'bg-blue-50/40' : ''
                                                }`}
                                        >
                                            <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                                                        {n.category && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(n.category)}`}>
                                                                {n.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                        {formatTime(n.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                                                {n.actionLink && n.actionLabel && (
                                                    <a
                                                        href={n.actionLink}
                                                        className="text-xs text-blue-600 hover:underline font-medium mt-1 inline-block"
                                                    >
                                                        {n.actionLabel} →
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 self-start">
                                                {!n.read && (
                                                    <button
                                                        onClick={() => markAsRead(n._id)}
                                                        disabled={actionLoading === n._id}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                        title="Mark as read"
                                                    >
                                                        {actionLoading === n._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CheckCheck className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(n._id)}
                                                    disabled={actionLoading === n._id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="font-medium">No notifications</p>
                                        <p className="text-xs mt-1">When you receive notifications, they will appear here.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer with count */}
                        {!loading && notifications.length > 0 && (
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>
                                    Showing {filteredNotifications.length} of {notifications.length} notifications
                                </span>
                                {unreadCount > 0 && (
                                    <span className="text-blue-600 font-semibold">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Notifications;