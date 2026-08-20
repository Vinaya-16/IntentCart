import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, User, ChevronDown, Menu, LogOut, Settings, Shield, LayoutDashboard } from "lucide-react";

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const API_BASE_URI = import.meta.env.VITE_APP_URL;
  const API_URL = `${API_BASE_URI}/admin` || 'http://localhost:5000/api/admin';

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

  // Check if admin is logged in
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'admin') {
          setIsLoggedIn(true);
          setAdmin(parsedUser);
          fetchNotificationCount();
        } else {
          // If user is not admin, redirect to home
          setIsLoggedIn(false);
          setAdmin(null);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoggedIn(false);
        setAdmin(null);
      }
    } else {
      setIsLoggedIn(false);
      setAdmin(null);
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
    setAdmin(null);
    setIsDropdownOpen(false);
    navigate('/intentCart-auth');
  };

  // Get admin initials
  const getInitials = () => {
    if (!admin) return 'A';
    const name = admin.username || admin.name || 'Admin';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get admin display name
  const getDisplayName = () => {
    if (!admin) return 'Admin';
    return admin.username || admin.name || 'Admin';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // If not logged in as admin, redirect
  if (!isLoggedIn || !admin) {
    return (
      <header className="bg-[#1e2356] text-white h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 border-b border-slate-700/50 w-full">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-[#252c6a] transition-colors lg:hidden text-gray-200 cursor-pointer"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-lg font-bold">Admin Panel</span>
        </div>
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
    <header className="bg-[#1e2356] text-white h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 border-b border-slate-700/50 w-full">
      
      {/* Left side: Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-[#252c6a] transition-colors lg:hidden text-gray-200 cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="text-lg font-bold hidden sm:block">Admin Panel</span>
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notification Link */}
        <Link
          to="/admin-notifications"
          className="p-2 rounded-full hover:bg-[#252c6a] transition-colors relative cursor-pointer flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-200" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#1e2356]">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </Link>

        {/* Admin Profile Dropdown */}
        <div className="relative dropdown-container">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 py-1 px-2 rounded-lg hover:bg-[#252c6a] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-white/20 shrink-0">
              {admin.avatarUrl ? (
                <img 
                  src={admin.avatarUrl} 
                  alt={getDisplayName()} 
                  className="w-full h-full rounded-full object-cover"
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
            <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                <span className="inline-block mt-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Administrator
                </span>
              </div>

              {/* <Link
                to="/admin-dashboard"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4 text-gray-500" />
                Dashboard
              </Link> */}

              {/* <Link
                to="/admin-profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <User className="w-4 h-4 text-gray-500" />
                Profile Settings
              </Link> */}

              {/* <Link
                to="/admin-notifications"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Bell className="w-4 h-4 text-gray-500" />
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                    {notificationCount}
                  </span>
                )}
              </Link> */}

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
      </div>
    </header>
  );
};

export default Header;