import React, { useState, useEffect } from 'react';
import { Search, User, ShoppingBag, Heart, LogOut, Bell, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);

    // Check authentication status on mount and when localStorage changes
    useEffect(() => {
        checkAuthStatus();

        // Listen for storage changes (if user logs in/out in another tab)
        const handleStorageChange = () => {
            checkAuthStatus();
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Check if user is logged in
    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setIsLoggedIn(true);
                setUser(parsedUser);
                // Fetch counts for cart, wishlist, notifications
                fetchCounts(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                setIsLoggedIn(false);
                setUser(null);
            }
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }
    };

    // Fetch cart, wishlist, and notification counts
    const fetchCounts = async (userData) => {
        try {
            const token = localStorage.getItem('token');

            setCartCount(0);
            setWishlistCount(0);
            setNotificationCount(0);
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        setIsDropdownOpen(false);
        navigate('/');
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user) return '';
        const name = user.username || user.name || '';
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get role-based dashboard link
    const getDashboardLink = () => {
        if (!user) return '/';
        switch (user.role) {
            case 'admin':
                return '/admin-dashboard';
            case 'merchant':
                return '/merchant-dashboard';
            case 'customer':
                return '/dashboard';
            default:
                return '/';
        }
    };

    // Get role-based profile link
    const getProfileLink = () => {
        if (!user) return '/';
        switch (user.role) {
            case 'admin':
                return '/admin-profile';
            case 'merchant':
                return '/merchant-profile';
            case 'customer':
                return '/profile';
            default:
                return '/';
        }
    };

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Brand Logo */}
                <Link to="/" className="text-2xl font-black text-indigo-700 tracking-tight hover:text-indigo-800 transition-colors">
                    Intent<span className="text-indigo-900">Cart</span>
                </Link>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="What are you looking for ?"
                        className="w-full bg-slate-100 border-none rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Action Buttons - Show different based on login status */}
                <div className="flex items-center gap-3">
                    {isLoggedIn && user ? (
                        // LOGGED IN: Show icons
                        <>
                            {/* Notification Bell */}
                            <Link
                                to="/notifications"
                                className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {notificationCount}
                                    </span>
                                )}
                            </Link>

                            {/* Wishlist */}
                            <Link
                                to="/wishlist"
                                className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            >
                                <Heart className="w-5 h-5" />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>

                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-indigo-50 transition-colors border-2 border-transparent hover:border-indigo-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.username}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getUserInitials()
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                        {user.username || user.name || 'User'}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {user.username || user.name || 'User'}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            <span className="inline-block mt-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
                                                {user.role || 'customer'}
                                            </span>
                                        </div>

                                        <Link
                                            to={getDashboardLink()}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            Dashboard
                                        </Link>

                                        <Link
                                            to={getProfileLink()}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            Profile Settings
                                        </Link>

                                        <hr className="my-1 border-gray-100" />

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // NOT LOGGED IN: Show Sign Up / Sign In buttons
                        <>
                            <Link
                                to="/intentCart-auth"
                                className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-5 py-2 rounded-md text-sm transition-colors"
                            >
                                Sign Up
                            </Link>
                            <Link
                                to="/intentCart-auth"
                                className="border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2 rounded-md text-sm transition-colors"
                            >
                                Sign In
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}