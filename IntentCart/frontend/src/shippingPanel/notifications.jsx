import React, { useState, useMemo } from 'react';
import { 
    ArrowLeft, 
    Bell, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Truck, 
    Search, 
    X, 
    Package, 
    Filter, 
    Menu, 
    AlertCircle, 
    Trash2, 
    ExternalLink, 
    ShieldAlert, 
    Check 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// MOCK NOTIFICATIONS DATA
const MOCK_NOTIFICATIONS = [
    {
        id: 'NOTIF-101',
        title: 'Shipment Delay Alert',
        message: 'Order #ORD-10252 to Delhi is delayed due to weather disruption at the Indira Gandhi Airport hub.',
        category: 'Logistics',
        type: 'Warning',
        isUnread: true,
        timestamp: '10 mins ago',
        orderId: 'ORD-10252',
        carrier: 'Blue Dart'
    },
    {
        id: 'NOTIF-102',
        title: 'High Priority Return Request',
        message: 'Customer requested an immediate pickup approval for damaged item: Nike Air Max 270.',
        category: 'Returns',
        type: 'Urgent',
        isUnread: true,
        timestamp: '25 mins ago',
        orderId: 'ORD-10245',
        carrier: 'Delhivery'
    },
    {
        id: 'NOTIF-103',
        title: 'Courier Integration Error',
        message: 'API Sync failed with XpressBees. 14 orders failed to generate shipping labels.',
        category: 'System',
        type: 'Critical',
        isUnread: true,
        timestamp: '1 hour ago',
        orderId: 'N/A',
        carrier: 'XpressBees'
    },
    {
        id: 'NOTIF-104',
        title: 'Dispatch Batch Completed',
        message: 'Batch #420 (85 orders) successfully packed and assigned for morning pickup.',
        category: 'Fulfillment',
        type: 'Success',
        isUnread: false,
        timestamp: '3 hours ago',
        orderId: 'BATCH-420',
        carrier: 'Ekart'
    },
    {
        id: 'NOTIF-105',
        title: 'Address Verification Failed',
        message: 'Pincode 400001 delivery rejected by system. Missing apartment number in user shipping detail.',
        category: 'Address Risk',
        type: 'Info',
        isUnread: false,
        timestamp: '5 hours ago',
        orderId: 'ORD-10230',
        carrier: 'Shadowfax'
    }
];

const NOTIF_CONFIG = {
    Urgent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', dot: 'bg-rose-500', icon: AlertCircle },
    Critical: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', dot: 'bg-amber-500', icon: ShieldAlert },
    Warning: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/80', dot: 'bg-orange-500', icon: AlertTriangle },
    Success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle2 },
    Info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500', icon: Clock }
};

const ShippingNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter Logic
    const filteredNotifs = useMemo(() => {
        return notifications.filter(notif => {
            const matchesCat = 
                filterCategory === 'All' ? true :
                filterCategory === 'Unread' ? notif.isUnread :
                notif.category === filterCategory;

            const matchesSearch = 
                notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.carrier.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCat && matchesSearch;
        });
    }, [notifications, searchQuery, filterCategory]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => n.isUnread).length;
    }, [notifications]);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    };

    const handleSelectNotification = (notif) => {
        // Mark individual as read on click
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isUnread: false } : n));
        setSelectedNotif(notif);
    };

    const handleDeleteNotif = (id, e) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (selectedNotif?.id === id) setSelectedNotif(null);
    };

    const categories = ['All', 'Unread', 'Logistics', 'Returns', 'System', 'Fulfillment'];

    return (
        <div className="h-dscreen w-full flex flex-col bg-slate-50/60 font-sans text-slate-800 overflow-hidden">
            
            {/* Header pinned at top */}
            <Header className="shrink-0 z-30" onMenuClick={() => setIsSidebarOpen(true)} />
            
            {/* Main Flex Wrapper */}
            <div className="flex flex-1 w-full overflow-hidden relative">
                
                {/* MOBILE OVERLAY BACKDROP */}
                {isSidebarOpen && (
                    <div 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                    />
                )}

                {/* RESPONSIVE SIDEBAR WRAPPER */}
                <aside 
                    className={`fixed lg:static inset-y-0 left-0 z-50 h-full bg-white shrink-0 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                        isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                    }`}
                >
                    <Sidebar activeTab="Shipping Dashboard" onClose={() => setIsSidebarOpen(false)} />
                </aside>
                
                {/* SCROLLABLE MAIN CONTENT */}
                <div className="flex-1 min-w-0 h-full overflow-y-auto">
                    <main className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                        
                        {/* PAGE HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 sm:pb-5">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl lg:hidden transition-all shrink-0"
                                    title="Open Menu"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>

                                <button 
                                    onClick={() => navigate('/shipping-dashboard')}
                                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all shrink-0"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">Logistics Alerts</h1>
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">Real-time system updates, carrier exceptions, and fulfillment alerts.</p>
                                </div>
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="self-start sm:self-center px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                                >
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* NOTIFICATIONS CONTAINER */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                            
                            {/* SEARCH & CATEGORY BAR */}
                            <div className="p-3.5 sm:p-5 border-b border-slate-200/80 space-y-3 sm:space-y-4">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search title, carrier, or order ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 pl-10 pr-9 py-2 sm:py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
                                        Showing <span className="font-bold text-slate-800">{filteredNotifs.length}</span> alerts
                                    </div>
                                </div>

                                {/* CATEGORY FILTER PILLS */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 pl-1 shrink-0">
                                        <Filter className="w-3.5 h-3.5" /> Category:
                                    </span>
                                    {categories.map((cat) => {
                                        const count = cat === 'All' 
                                            ? notifications.length 
                                            : cat === 'Unread'
                                            ? unreadCount
                                            : notifications.filter(n => n.category === cat).length;
                                        const isActive = filterCategory === cat;

                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setFilterCategory(cat)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                                                    isActive
                                                        ? 'bg-slate-900 text-white shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                                }`}
                                            >
                                                <span>{cat}</span>
                                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                    isActive ? 'bg-slate-700 text-white' : 'bg-slate-200/70 text-slate-700'
                                                }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* NOTIFICATION LIST VIEW */}
                            <div className="divide-y divide-slate-100">
                                {filteredNotifs.length > 0 ? (
                                    filteredNotifs.map((notif) => {
                                        const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.Info;
                                        const IconComponent = config.icon;

                                        return (
                                            <div 
                                                key={notif.id}
                                                onClick={() => handleSelectNotification(notif)}
                                                className={`p-3.5 sm:p-5 flex items-start gap-3.5 sm:gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group relative ${
                                                    notif.isUnread ? 'bg-slate-50/40' : 'bg-white'
                                                }`}
                                            >
                                                {/* Left Unread Indicator Dot */}
                                                {notif.isUnread && (
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 absolute left-2 top-1/2 -translate-y-1/2"></span>
                                                )}

                                                {/* Category Icon */}
                                                <div className={`p-2.5 sm:p-3 rounded-xl ${config.bg} ${config.text} border ${config.border} shrink-0 mt-0.5`}>
                                                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>

                                                {/* Content Details */}
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className={`text-xs sm:text-sm font-semibold ${notif.isUnread ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                                                                {notif.title}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                                                                {notif.type}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                                                            {notif.timestamp}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                        {notif.message}
                                                    </p>

                                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <Package className="w-3.5 h-3.5 text-slate-400" />
                                                            {notif.orderId}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                                                            {notif.carrier}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quick Action Delete */}
                                                <button
                                                    onClick={(e) => handleDeleteNotif(notif.id, e)}
                                                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0 self-center"
                                                    title="Dismiss Alert"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-16 text-center text-slate-400">
                                        <Bell className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                                        <p className="text-sm font-medium text-slate-600 mt-3">No notifications found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try clearing your filters or changing your search terms.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* DETAILED NOTIFICATION MODAL */}
            {selectedNotif && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${NOTIF_CONFIG[selectedNotif.type]?.bg} ${NOTIF_CONFIG[selectedNotif.type]?.text}`}>
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Alert Details</h3>
                                    <p className="text-[11px] text-slate-400">{selectedNotif.timestamp}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedNotif(null)} 
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">{selectedNotif.title}</h2>
                                <p className="text-slate-600 mt-2 leading-relaxed">{selectedNotif.message}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Reference ID</span>
                                    <p className="font-bold text-slate-800 mt-0.5">{selectedNotif.orderId}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Logistics Partner</span>
                                    <p className="font-bold text-slate-800 mt-0.5">{selectedNotif.carrier}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-2 shrink-0">
                            <button 
                                onClick={() => setSelectedNotif(null)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-2xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingNotifications;