import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, UserCircle, LogOut, LayoutDashboard, Settings, Store } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/merchant';

const Header = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [merchant, setMerchant] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    checkAuthStatus();

    const handleStorageChange = () => {
      checkAuthStatus();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Check if merchant is logged in
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'merchant') {
          setIsLoggedIn(true);
          setMerchant(parsedUser);
          fetchNotificationCount();
          fetchMerchantProfile();
        } else {
          setIsLoggedIn(false);
          setMerchant(null);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoggedIn(false);
        setMerchant(null);
      }
    } else {
      setIsLoggedIn(false);
      setMerchant(null);
    }
    setLoading(false);
  };

  // Fetch merchant profile
  const fetchMerchantProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMerchant(prev => ({ ...prev, ...data.profile }));
        }
      }
    } catch (error) {
      console.error('Error fetching merchant profile:', error);
    }
  };

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setMerchant(null);
    setIsProfileOpen(false);
    navigate('/intentCart-auth');
  };

  // Get merchant initials
  const getInitials = () => {
    if (!merchant) return 'M';
    const name = merchant.businessName || merchant.username || 'Merchant';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get merchant display name
  const getDisplayName = () => {
    if (!merchant) return 'Merchant';
    return merchant.businessName || merchant.username || 'Merchant';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // If not logged in as merchant, show login prompt
  if (!loading && !isLoggedIn) {
    return (
      <header className="bg-[#1e3a6a] text-white h-16 px-6 flex items-center justify-between border-b border-slate-700/30">
        <h1 className="text-xl font-semibold tracking-wide">Merchant Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/intentCart-auth')}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors"
          >
            Login
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#1e3a6a] text-white h-16 px-6 flex items-center justify-between border-b border-slate-700/30">
      {/* Title */}
      <h1 className="text-xl font-semibold tracking-wide">Merchant Dashboard</h1>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Notifications Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative hover:opacity-80 transition-opacity p-1 cursor-pointer"
          onClick={() => navigate('/merchant-notifications')}
        >
          <Bell className="w-5 h-5 text-gray-200" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#1e3a6a]">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown Menu */}
        <div className="relative profile-dropdown">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 overflow-hidden">
              {merchant?.avatarUrl ? (
                <img
                  src={merchant.avatarUrl}
                  alt={getDisplayName()}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {getInitials()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium hidden sm:inline-block">
              {getDisplayName()}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Profile Dropdown Items */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1 z-20 animate-fadeIn">
              {/* Profile Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">{merchant?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {merchant?.merchantStatus === 'approved' ? 'Verified Merchant' : merchant?.merchantStatus === 'pending' ? 'Pending Approval' : 'Merchant'}
                </span>
              </div>

              {/* <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/merchant-dashboard');
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-600" />
                <span>Dashboard</span>
              </button> */}

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/merchant-profile');
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <UserCircle className="w-4 h-4 text-slate-600" />
                <span>Profile Settings</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;