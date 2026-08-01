import React, { useState, useMemo } from 'react';
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
  Search
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Merchant Signup',
    message: 'Vinaya P registered a new store account and requested verification.',
    time: '10 minutes ago',
    type: 'user',
    read: false,
    category: 'Under Review',
  },
  {
    id: 2,
    title: 'Product Flagged',
    message: 'Product "Flip P." was flagged for copyright compliance review.',
    time: '1 hour ago',
    type: 'alert',
    read: false,
    category: 'Alerts',
  },
  {
    id: 3,
    title: 'Payout Request',
    message: 'Mithila K requested a withdrawal of $12,850.',
    time: '3 hours ago',
    type: 'info',
    read: true,
    category: 'Updates',
  },
  {
    id: 4,
    title: 'Product Approved',
    message: 'Product "Urban M" was approved and is now live on the marketplace.',
    time: 'Yesterday',
    type: 'success',
    read: true,
    category: 'Updates',
  },
  {
    id: 5,
    title: 'System Maintenance Scheduled',
    message: 'System upgrade scheduled for Sunday at 02:00 AM IST.',
    time: '2 days ago',
    type: 'info',
    read: true,
    category: 'Alerts',
  },
];

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('Notifications');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

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

  // Actions
  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          setActiveTab={setActiveTab}
        />

        <main className="p-8 flex-1 bg-white space-y-6">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1e2356] flex items-center gap-2">
                Notifications
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Stay updated with platform alerts, user requests, and system events.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-[#1e2356] hover:text-indigo-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          </div>

          {/* Search & Filters */}
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
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List Card */}
          <div className="border border-gray-100 rounded-2xl bg-white shadow-xs divide-y divide-gray-100 overflow-hidden">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                    !notif.read ? 'bg-slate-50/80' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-gray-100 shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{notif.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Mark as Read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notif.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400 text-xs font-medium">
                No notifications found.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notifications;