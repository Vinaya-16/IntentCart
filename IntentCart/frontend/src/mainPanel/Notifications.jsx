import React, { useState, useEffect } from 'react';
import {
  Bell,
  Package,
  Tag,
  ShieldAlert,
  Trash2,
  Check,
  CheckCheck,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  Loader2,
  WifiOff,
  RefreshCw,
  X
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const API_BASE_URI = import.meta.env.VITE_APP_URL;
const API_URL = `${API_BASE_URI}/customer` || 'http://localhost:5000/api/customer';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [counts, setCounts] = useState({
    unread: 0,
    total: 0,
    order: 0,
    promo: 0
  });

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
        setNotifications(data.notifications || []);
        setCounts({
          unread: data.unreadCount || 0,
          total: data.total || 0,
          order: data.orderCount || 0,
          promo: data.promoCount || 0
        });
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
  const handleMarkAllRead = async () => {
    try {
      setActionLoading('all');
      setError('');

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

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      );
      setCounts(prev => ({ ...prev, unread: 0 }));

    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle read status
  const handleToggleRead = async (id, currentStatus) => {
    try {
      setActionLoading(id);
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setActionLoading(null);
        return;
      }

      const newStatus = !currentStatus;
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update notification');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === id ? { ...n, read: newStatus, readAt: newStatus ? new Date() : null } : n
        )
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        unread: newStatus ? prev.unread - 1 : prev.unread + 1
      }));

    } catch (err) {
      console.error('Error updating notification:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    try {
      setActionLoading(id);
      setError('');

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
        setCounts(prev => ({ ...prev, unread: prev.unread - 1 }));
      }

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

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'orders') return n.type === 'order';
    if (filter === 'promos') return n.type === 'promo' || n.type === 'price';
    return true;
  });

  const unreadCount = counts.unread;

  const getTypeConfig = (type) => {
    switch (type) {
      case 'order':
        return {
          icon: Package,
          bg: 'bg-emerald-50 text-emerald-600',
          badge: 'Orders & Shipping',
          border: 'hover:border-emerald-200'
        };
      case 'promo':
      case 'price':
        return {
          icon: Tag,
          bg: 'bg-amber-50 text-amber-600',
          badge: 'Offer',
          border: 'hover:border-amber-200'
        };
      case 'system':
        return {
          icon: ShieldAlert,
          bg: 'bg-rose-50 text-rose-600',
          badge: 'Security',
          border: 'hover:border-rose-200'
        };
      default:
        return {
          icon: Bell,
          bg: 'bg-indigo-50 text-indigo-600',
          badge: 'Update',
          border: 'hover:border-indigo-200'
        };
    }
  };

  const filterOptions = [
    { label: 'All Notifications', key: 'all', count: notifications.length },
    { label: 'Unread', key: 'unread', count: unreadCount },
    { label: 'Orders & Shipping', key: 'orders', count: counts.order },
    { label: 'Offers & Discounts', key: 'promos', count: counts.promo },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-200 animate-pulse" />
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Stay updated with your orders, price drops, and account alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading === 'all'}
                className="inline-flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'all' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
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
              onClick={fetchNotifications}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">

          {/* Mobile Horizontal Pill Filters & Desktop Sidebar */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                <span>Filter By</span>
              </div>

              <div className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {filterOptions.map((option) => {
                  const isActive = filter === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setFilter(option.key)}
                      className={`whitespace-nowrap flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                    >
                      <span>{option.label}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {option.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Notifications Feed */}
          <section className="md:col-span-3 space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const config = getTypeConfig(notification.type);
                const IconComponent = config.icon;

                return (
                  <div
                    key={notification._id}
                    className={`group relative flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${!notification.read
                      ? 'bg-white border-indigo-100 shadow-sm shadow-indigo-100/50'
                      : 'bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300/80'
                      }`}
                  >
                    {/* Unread Accent Bar */}
                    {!notification.read && (
                      <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-600 rounded-r-full" />
                    )}

                    {/* Notification Type Icon */}
                    <div className={`p-3 rounded-xl shrink-0 ${config.bg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0 pr-6 sm:pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className={`text-sm tracking-tight ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                          }`}>
                          {notification.title}
                        </h2>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3">
                        {notification.message}
                      </p>

                      {/* Meta Information & Primary CTA */}
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        <span>{new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString()}</span>
                        {notification.actionLink && (
                          <a
                            href={notification.actionLink}
                            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 gap-0.5 group-hover:translate-x-0.5 transition-transform"
                          >
                            View Details <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Quick Card Controls */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleRead(notification._id, notification.read)}
                        disabled={actionLoading === notification._id}
                        title={notification.read ? "Mark as unread" : "Mark as read"}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                      >
                        {actionLoading === notification._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className={`w-4 h-4 ${!notification.read ? 'text-indigo-600' : 'text-slate-400'}`} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        disabled={actionLoading === notification._id}
                        title="Delete notification"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Empty State */
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-semibold text-slate-800 text-base mb-1">No notifications found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You are all caught up! There are no updates under this filter category at the moment.
                </p>
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}