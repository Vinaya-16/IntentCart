import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, UserCircle, LogOut } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
          {/* Notification Badge Dot */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Profile Dropdown Menu */}
        <div className="relative">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium">Merchant S.</span>
            <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Profile Dropdown Items */}
          {isProfileOpen && (
            <>
              {/* Backdrop to close dropdown on click outside */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsProfileOpen(false)} 
              />

              <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200 py-1 z-20">
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
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/intentcart-auth');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;