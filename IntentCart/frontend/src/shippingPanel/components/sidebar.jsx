import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    MapPin,
    RotateCcw,
    Users,
    LogOut,
    Truck,
    X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Mapping menu items directly to route paths
    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/shipping-dashboard',
            icon: LayoutDashboard
        },
        {
            id: 'orders',
            label: 'Order Details',
            path: '/shipping-OrderM',
            icon: Package
        },
        {
            id: 'tracking',
            label: 'Shipment Tracking',
            path: '/shipping-tracking',
            icon: MapPin
        },
        {
            id: 'returns',
            label: 'Returns Management',
            path: '/shipping-returns',
            icon: RotateCcw
        },
        {
            id: 'drivers',
            label: 'Driver Management',
            path: '/shipping-drivers',
            icon: Users
        },
    ];

    // Prevent background scrolling on mobile when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleNavigation = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile Backdrop Overlay with Fade Transition */}
            <div
                className={`
                    fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden 
                    transition-opacity duration-300 ease-in-out
                    ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar Drawer Container */}
            <aside
                className={`
                    fixed lg:static top-0 left-0 z-50 h-full w-64 bg-[#1e2356] text-white 
                    flex-shrink-0 flex flex-col shadow-xl lg:shadow-none
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Brand Header */}
                <div className="p-5 flex items-center justify-between border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight leading-tight">Shipping Panel</h1>
                            <p className="text-[11px] text-white/60">Fulfillment Center</p>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.path)}
                                className={`
                                    w-full flex items-center gap-3 px-3.5 py-3 rounded-xl 
                                    transition-all duration-150 text-sm font-medium text-left
                                    min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white/30
                                    ${isActive
                                        ? 'bg-white text-[#1e2356] shadow-md font-semibold'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1e2356]' : 'text-white/70'}`} />
                                <span className="truncate">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / Logout Button */}
                <div className="p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={() => {
                            if (onClose) onClose();
                            navigate('/intentCart-auth');
                        }}
                        className="flex items-center gap-3 px-3.5 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl w-full transition-all text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                        <LogOut className="w-5 h-5 shrink-0 text-white/70" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;