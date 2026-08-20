import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Check,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  UserPlus,
  ShoppingBag,
  Clock,
  Search,
  WifiOff,
  RefreshCw,
  Loader2,
  Cross,
  MoveRight
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_BASE_URI = import.meta.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URI}/admin` || 'http://localhost:5000/api/admin';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('Notifications');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

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
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
        setTotalCount(data.total || data.notifications.length);
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

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
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
        throw new Error('Failed to mark notification as read');
      }

      const data = await response.json();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      setSuccess('Notification marked as read');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking as read:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
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

  // Delete notification
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

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

      const data = await response.json();
      
      // Update local state
      const deleted = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setSuccess('Notification deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter tabs
  const filterTabs = ['All', 'Unread', 'Alerts'];

  // Live Filtering & Search
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesFilter =
        activeFilter === 'All'
          ? true
          : activeFilter === 'Unread'
          ? !notif.read
          : activeFilter === 'Alerts'
          ? notif.type === 'alert'
          : true;

      const matchesSearch =
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [notifications, activeFilter, searchQuery]);

  // Get icon based on type
  const getIcon = (type) => {
    switch (type) {
      case 'user':
        return <UserPlus className="w-5 h-5 text-sky-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Under Review':
        return 'bg-amber-100 text-amber-700';
      case 'Alerts':
        return 'bg-red-100 text-red-700';
      case 'Updates':
        return 'bg-blue-100 text-blue-700';
      case 'System':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format time
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-8 flex-1 bg-white space-y-6">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1e2356] flex items-center gap-2">
                <Bell className="w-6 h-6 text-[#1e2356]" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Stay updated with platform alerts, user requests, and system events.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchNotifications}
                className="p-2 text-gray-500 hover:text-[#1e2356] hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={actionLoading === 'all' || unreadCount === 0}
                className="text-xs font-semibold text-[#1e2356] hover:text-indigo-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'all' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Mark all as read
              </button>
            </div>
          </div>

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

          {/* Search & Filters */}
          {!isServerDown && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1d2258]/30"
                />
              </div>

              <div className="flex items-center gap-2">
                {filterTabs.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-[#1d2258] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                    {filter === 'Unread' && unreadCount > 0 && (
                      <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notifications List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e2356] border-t-transparent"></div>
            </div>
          ) : (
            !isServerDown && (
              <div className="border border-gray-100 rounded-2xl bg-white shadow-xs divide-y divide-gray-100 overflow-hidden">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                        !notif.read ? 'bg-slate-50/80' : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-gray-100 shrink-0 mt-0.5">
                          {getIcon(notif.type)}
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shrink-0" />
                            )}
                            {notif.category && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(notif.category)}`}>
                                {notif.category}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed break-words">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(notif.createdAt)}
                            </span>
                            {notif.read && (
                              <span className="text-emerald-500">Read</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notif._id)}
                            disabled={actionLoading === notif._id}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark as Read"
                          >
                            {actionLoading === notif._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(notif._id)}
                          disabled={actionLoading === notif._id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-500">No notifications found</p>
                    <p className="text-xs mt-1">When new notifications arrive, they will appear here.</p>
                  </div>
                )}
              </div>
            )
          )}

          {/* Footer with count */}
          {!loading && !isServerDown && notifications.length > 0 && (
            <div className="flex justify-between items-center text-xs text-gray-400 pt-2">
              <span>
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-indigo-600 font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;