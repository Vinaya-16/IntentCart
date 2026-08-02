import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Package,
  ClipboardList,
  Users,
  History,
  Megaphone,
  Menu,
  X,
  LogOut
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/merchant-dashboard', icon: LayoutGrid },
  { id: 'product', label: 'Product Management', path: '/merchant-productM', icon: Package },
  { id: 'order', label: 'Order Management', path: '/merchant-orderM', icon: ClipboardList },
  { id: 'customer', label: 'Customer Analysis', path: '/merchant-customerA', icon: Users },
  { id: 'recovery', label: 'Recovery Dashboard', path: '/merchant-recoveryD', icon: History },
  { id: 'campaign', label: 'Campaign Management', path: '/merchant-campM', icon: Megaphone },
];

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* ---------------- MOBILE TOGGLE BUTTON ---------------- */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-[#1e3a6a] text-white rounded-md shadow-md focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ---------------- MOBILE BACKDROP ---------------- */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
        />
      )}

      {/* ---------------- SIDEBAR CONTAINER ---------------- */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 bg-[#1e3a6a] min-h-screen pt-6 pr-4 shrink-0 w-64 transition-transform duration-300 flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* NAVIGATION LINKS */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 rounded-r-full font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#1e3a6a] shadow-md font-semibold'
                      : 'text-gray-200 hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* LOGOUT SECTION */}
        <div className="px-3 pt-4 border-t border-slate-700/50">
          <NavLink
            to="/intentcart-auth"
            onClick={() => setIsMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#252c6a] rounded-lg transition-colors cursor-pointer"
          >
            <span>Logout</span>
            <LogOut className="w-4 h-4" />
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;