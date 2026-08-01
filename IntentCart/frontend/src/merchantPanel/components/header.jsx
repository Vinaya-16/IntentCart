import React from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-[#1e3a6a] text-white h-16 px-6 flex items-center justify-between border-b border-slate-700/30">
      {/* Title */}
      <h1 className="text-xl font-semibold tracking-wide">Merchant Dashboard</h1>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        <button 
          type="button" 
          aria-label="Notifications"
          className="relative hover:opacity-80 transition-opacity p-1 cursor-pointer"
        >
          <Bell className="w-5 h-5 text-gray-200" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium">Merchant S.</span>
          <ChevronDown className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </header>
  );
};

export default Header;