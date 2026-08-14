import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, ChevronDown, LogOut, Settings, User } from 'lucide-react';

const Header = ({ onMenuClick }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const notifRef = useRef(null);
    const profileRef = useRef(null);

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
                    Operations Dashboard
                </h2>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 sm:gap-6">
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-500 hover:text-[#1e2356] hover:bg-slate-100 rounded-full transition-colors relative"
                        aria-label="View notifications"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                            <div className="px-4 py-2 border-b border-slate-100 font-semibold text-slate-800 flex justify-between">
                                <span>Notifications</span>
                                <span className="text-sky-600 cursor-pointer">Mark all read</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                                <div className="p-3 hover:bg-slate-50 transition-colors">
                                    <p className="font-medium text-slate-800">Shipment Delayed</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">Order #ORD-10251 is delayed in Jaipur.</p>
                                </div>
                                <div className="p-3 hover:bg-slate-50 transition-colors">
                                    <p className="font-medium text-slate-800">New Return Request</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">Order #ORD-10252 requested a return.</p>
                                </div>
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
                            VP
                        </div>
                        <div className="hidden md:block text-left text-sm">
                            <p className="font-semibold text-slate-800 leading-tight">VP</p>
                            <p className="text-[11px] text-slate-500">Shipping Manager</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700">
                            <button className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors">
                                <User className="w-4 h-4 text-slate-500" /> Account Profile
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors">
                                <Settings className="w-4 h-4 text-slate-500" /> Dashboard Settings
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">
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