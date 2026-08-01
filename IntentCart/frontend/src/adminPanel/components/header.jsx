import React from "react";
import { Bell, User, ChevronDown, Menu } from "lucide-react";

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-[#1e2356] text-white h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 border-b border-slate-700/50 w-full">
      
      {/* Left side: Optional Mobile Menu Toggle or Title */}
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
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notification Bell */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-[#252c6a] transition-colors relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-200" />
          {/* Notification Badge Dot */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Admin Profile Dropdown */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 py-1">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium hidden sm:inline-block">Admin</span>
          <ChevronDown className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </header>
  );
};

export default Header;