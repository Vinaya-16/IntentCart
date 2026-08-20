import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, ChevronDown, LogOut, User, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URI = import.meta.env.VITE_APP_URL;
const API_URL = `${API_BASE_URI}/shipping` || 'http://localhost:5000/api/shipping';

const Header = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // Get token and user from localStorage
    const getToken = () => localStorage.getItem('token');
    const getUser = () => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        const userData = getUser();
        if (userData) {
            const name = userData.firstName || userData.username || 'User';
            return name.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getUserName = () => {
        const userData = getUser();
        if (userData) {
            return userData.firstName || userData.username || 'User';
        }
        return 'User';
    };

    const getUserRole = () => {
        const userData = getUser();
        if (userData) {
            return userData.role || 'User';
        }
        return 'User';
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications/shipper`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/intentCart-auth');
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
                    createdAt: notif.createdAt,
                    read: notif.read
                }));
                setNotifications(formattedNotifs);
                setUnreadCount(formattedNotifs.filter(n => n.isUnread).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get unread count
    const fetchUnreadCount = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/notifications/shipper/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUnreadCount(data.unreadCount);
                }
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
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

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === notifId ? { ...n, isUnread: false } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
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

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
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

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/intentCart-auth');
    };

    // Handle view all notifications
    const handleViewAllNotifications = () => {
        setShowNotifications(false);
        navigate('/shipping-notifications');
    };

    // Handle profile click
    const handleProfileClick = () => {
        setShowProfileMenu(false);
        navigate('/shipping-profile');
    };

    // Load notifications on mount and periodically
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Refresh notifications every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h2 className="hidden sm:block text-base font-semibold text-slate-800">
                    Shipping Dashboard
                </h2>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 sm:gap-6">
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (!showNotifications) {
                                fetchNotifications();
                            }
                        }}
                        className="p-2 text-slate-500 hover:text-[#1e2356] hover:bg-slate-100 rounded-full transition-colors relative"
                        aria-label="View notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                            <div className="px-4 py-2 border-b border-slate-100 font-semibold text-slate-800 flex justify-between items-center">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" />
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                                {loading ? (
                                    <div className="p-4 text-center text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        <p className="text-xs mt-1">Loading...</p>
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.slice(0, 5).map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${notif.isUnread ? 'bg-slate-50/80' : ''}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <p className={`text-xs font-medium ${notif.isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                                                    {notif.title}
                                                </p>
                                                {notif.isUnread && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1"></span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {notif.timestamp}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400">
                                        <Bell className="w-5 h-5 mx-auto text-slate-300" />
                                        <p className="text-xs mt-1">No notifications</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-2 border-t border-slate-100">
                                <button
                                    onClick={handleViewAllNotifications}
                                    className="w-full text-center text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                                >
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative pl-4 border-l border-slate-200" ref={profileRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 focus:outline-none"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e2356] to-sky-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {getUserInitials()}
                        </div>
                        <div className="hidden md:block text-left text-sm">
                            <p className="font-semibold text-slate-800 leading-tight">{getUserName()}</p>
                            <p className="text-[11px] text-slate-500 capitalize">{getUserRole()}</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="font-semibold text-slate-800">{getUserName()}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{getUserRole()}</p>
                            </div>
                            <button
                                onClick={handleProfileClick}
                                className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                            >
                                <User className="w-4 h-4 text-slate-500" /> Profile
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;