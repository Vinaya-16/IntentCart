import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag, Heart, LogOut, Bell, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function Header() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef(null);

    // Check authentication status on mount and when localStorage changes
    useEffect(() => {
        checkAuthStatus();

        const handleStorageChange = () => {
            checkAuthStatus();
        };
        window.addEventListener('storage', handleStorageChange);

        // Click outside to close search results
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('mousedown', handleClickOutside);
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
            if (!token) return;

            // Fetch cart count
            try {
                const cartRes = await fetch(`${API_URL}/customer/cart`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (cartRes.ok) {
                    const cartData = await cartRes.json();
                    const items = cartData.cart?.items || [];
                    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                    setCartCount(totalItems);
                }
            } catch (e) { }

            // Fetch wishlist count
            try {
                const wishRes = await fetch(`${API_URL}/customer/wishlist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (wishRes.ok) {
                    const wishData = await wishRes.json();
                    setWishlistCount(wishData.wishlist?.products?.length || 0);
                }
            } catch (e) { }

            // Fetch notification count
            try {
                const notifRes = await fetch(`${API_URL}/customer/notifications/unread-count`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (notifRes.ok) {
                    const notifData = await notifRes.json();
                    setNotificationCount(notifData.unreadCount || 0);
                }
            } catch (e) { }
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    };

    // Search function - uses /api/product/search
    const handleSearch = async (query) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        setShowSearchResults(true);

        try {
            // Use /product/search endpoint
            const response = await fetch(`${API_URL}/product/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setSearchResults(data.products || []);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle search input change with debounce
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                handleSearch(searchQuery);
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Handle search submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowSearchResults(false);
        }
    };

    // Handle product click from search results
    const handleProductClick = (slug) => {
        navigate(`/product/${slug}`);
        setShowSearchResults(false);
        setSearchQuery('');
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
                return '/main-profile';
            default:
                return '/';
        }
    };

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Brand Logo */}
                <Link to="/" className="text-2xl font-black text-indigo-700 tracking-tight hover:text-indigo-800 transition-colors whitespace-nowrap">
                    Intent<span className="text-indigo-900">Cart</span>
                </Link>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl relative" ref={searchRef}>
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="What are you looking for ?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) {
                                    setShowSearchResults(true);
                                }
                            }}
                            className="w-full bg-slate-100 border-none rounded-md pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setShowSearchResults(false);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </form>

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                            {isSearching ? (
                                <div className="p-4 text-center text-gray-500">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
                                    <p className="text-xs mt-2">Searching...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <>
                                    <div className="p-2 border-b border-gray-100">
                                        <span className="text-xs font-semibold text-gray-500">
                                            {searchResults.length} results found
                                        </span>
                                    </div>
                                    {searchResults.map((product) => (
                                        <button
                                            key={product._id}
                                            onClick={() => handleProductClick(product.slug)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                        >
                                            <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                {product.images && product.images.length > 0 ? (
                                                    <img
                                                        src={product.images[0].url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400"><ShoppingBag className="w-5 h-5" /></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                        <ShoppingBag className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Rs. {product.price}
                                                    {product.categoryId?.name && (
                                                        <span className="ml-2 text-gray-400">
                                                            • {product.categoryId.name}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                    <div className="p-2 border-t border-gray-100">
                                        <button
                                            onClick={handleSearchSubmit}
                                            className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            View all results for "{searchQuery}"
                                        </button>
                                    </div>
                                </>
                            ) : searchQuery.length >= 2 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm">No products found for "{searchQuery}"</p>
                                    <p className="text-xs text-gray-400 mt-1">Try searching with different keywords</p>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Action Buttons - Show different based on login status */}
                <div className="flex items-center gap-3">
                    {isLoggedIn && user ? (
                        // LOGGED IN: Show icons
                        <>
                            {/* Notification Bell */}
                            <Link
                                to="/main-notifications"
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
                                to="/main-wishlist"
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
                                to="/main-cart"
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

                                        {/* <Link
                                            to={getDashboardLink()}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            Dashboard
                                        </Link> */}

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