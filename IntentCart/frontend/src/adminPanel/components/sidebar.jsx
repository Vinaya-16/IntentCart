import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Box,
  FileCheck,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';

const Sidebar = ({
  activeTab = 'Dashboard',
  setActiveTab,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Internal state fallback if isOpen props aren't provided by parent
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  // Navigation Items - Simplified
  const navItems = [
    { name: 'Dashboard', icon: LayoutGrid, path: '/admin-dashboard' },
    { name: 'User Management', icon: Box, path: '/admin-userM' },
    { name: 'Merchant Verification', icon: FileCheck, path: '/admin-merchantV' },
    { name: 'Product Moderation', icon: Users, path: '/admin-productM' },
    { name: 'Risk Management', icon: Shield, path: '/risk' },
    { name: 'Profile', icon: UserCheck, path: '/admin-profile' },
  ];

  const handleNavigation = (item) => {
    // Close mobile menu
    setIsOpen(false);
    
    // Navigate to the path
    if (item.path) {
      navigate(item.path);
    }
    
    // Update active tab if setActiveTab is provided
    if (setActiveTab) {
      setActiveTab(item.name);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    localStorage.removeItem('token');
    navigate('/intentcart-auth');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Floating Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 rounded-lg bg-[#1e2356] text-white shadow-md lg:hidden hover:bg-[#252c6a] transition-colors cursor-pointer"
        aria-label="Open sidebar menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-[#1e2356] text-white flex flex-col justify-between py-6 px-4 shrink-0 h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="px-3 mb-8 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wide">
              Admin Panel{' '}
              <span className="block font-normal text-xs opacity-80 mt-0.5">
                Platform Administrator
              </span>
            </h1>

            {/* Close Button Inside Sidebar for Mobile */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-300 hover:text-white p-1 rounded-lg hover:bg-[#252c6a] transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActiveTab = activeTab === item.name || isActive(item.path);
              
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActiveTab
                      ? 'bg-[#2952a2] text-white shadow-md'
                      : 'text-gray-300 hover:bg-[#252c6a] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="px-3 pt-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#252c6a] rounded-lg transition-colors cursor-pointer"
          >
            <span>Logout</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;