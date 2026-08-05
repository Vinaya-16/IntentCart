import React, { useState } from 'react';
import { 
  Bell, 
  Package, 
  Tag, 
  ShieldAlert, 
  Trash2, 
  Check, 
  ChevronRight,
  ChevronDown,
  Filter
} from 'lucide-react';

import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      title: 'Order Delivered',
      message: 'Your order #ORD-84920 for "Titan Premium Watch" has been successfully delivered.',
      time: '10 mins ago',
      unread: true,
      actionUrl: '/orders/84920'
    },
    {
      id: 2,
      type: 'promo',
      title: 'Exclusive EOSS Discount Unlocked!',
      message: 'Extra 10% OFF applied to your cart! Complete your purchase before the offer expires.',
      time: '2 hours ago',
      unread: true,
      actionUrl: '/cart'
    },
    {
      id: 3,
      type: 'price',
      title: 'Price Drop Alert',
      message: 'An item in your wishlist "Smart Watch Series 5" is now available at 30% OFF.',
      time: 'Yesterday',
      unread: false,
      actionUrl: '/product/smart-watch'
    },
    {
      id: 4,
      type: 'system',
      title: 'Security Update',
      message: 'Your account password was updated successfully. If you did not make this change, please contact support immediately.',
      time: '3 days ago',
      unread: false,
      actionUrl: '/profile'
    }
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'orders') return n.type === 'order';
    if (filter === 'promos') return n.type === 'promo' || n.type === 'price';
    return true;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <Package className="w-6 h-6 text-[#5c63f6]" />;
      case 'promo':
      case 'price':
        return <Tag className="w-6 h-6 text-amber-600" />;
      case 'system':
        return <ShieldAlert className="w-6 h-6 text-red-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const filterOptions = [
    { label: 'All Notifications', key: 'all', count: notifications.length },
    { label: 'Unread', key: 'unread', count: unreadCount },
    { label: 'Orders & Shipping', key: 'orders', count: notifications.filter((n) => n.type === 'order').length },
    { label: 'Offers & Discounts', key: 'promos', count: notifications.filter((n) => n.type === 'promo' || n.type === 'price').length },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      
      {/* Navigation Header */}
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b-2 border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-black tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-[#5c63f6] text-white text-sm font-black px-3 py-1 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-medium mt-1">
              Stay updated with your latest orders, discounts, and system alerts
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-sm font-bold text-[#5c63f6] hover:text-[#4853e8] transition self-start sm:self-auto bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Mark all as read
            </button>
          )}
        </div>

        {/* Layout with Left Filter Sidebar */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Sidebar Filter Section */}
          <aside className="w-full md:w-64 shrink-0 space-y-6">
            <div className="border border-gray-200 rounded-2xl p-5 bg-stone-50/50 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#5c63f6]" />
                  <h3 className="font-black text-base text-black">Filter By</h3>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 md:hidden" />
              </div>

              {/* Sidebar Navigation Pills */}
              <div className="space-y-1.5">
                {filterOptions.map((option) => {
                  const isActive = filter === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setFilter(option.key)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                        isActive
                          ? 'bg-[#5c63f6] text-white shadow-sm'
                          : 'text-gray-700 hover:bg-stone-200/60'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {option.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Notifications Listing Grid */}
          <main className="flex-1">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${
                      notification.unread
                        ? 'bg-indigo-50/30 border-indigo-200/80 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {notification.unread && (
                      <span className="absolute top-5 right-5 w-3 h-3 rounded-full bg-[#5c63f6] ring-4 ring-indigo-100" />
                    )}

                    {/* Left Icon */}
                    <div className={`p-3.5 rounded-2xl shrink-0 ${
                      notification.unread ? 'bg-white shadow-sm' : 'bg-stone-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className={`text-base mb-1 ${
                        notification.unread ? 'font-black text-black' : 'font-bold text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed mb-3">
                        {notification.message}
                      </p>
                      
                      {/* Meta & Link */}
                      <div className="flex items-center gap-5 text-xs font-bold text-gray-500">
                        <span>{notification.time}</span>
                        {notification.actionUrl && (
                          <a 
                            href={notification.actionUrl} 
                            className="text-[#5c63f6] hover:text-[#4853e8] hover:underline flex items-center font-black"
                          >
                            View Details <ChevronRight className="w-4 h-4 ml-0.5 stroke-[3]" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      aria-label="Delete notification"
                      className="text-gray-300 hover:text-red-500 transition p-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Notification View */
              <div className="text-center py-20 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                <div className="w-16 h-16 bg-stone-200/60 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="font-black text-xl text-black mb-1">No Notifications Found</h3>
                <p className="text-sm text-gray-500 font-medium">
                  There are no updates under this filter category right now.
                </p>
              </div>
            )}
          </main>

        </div>

      </main>

      {/* Footer Line */}
      <div className="border-t-4 border-[#5c63f6] mt-16">
        <Footer />
      </div>

    </div>
  );
}