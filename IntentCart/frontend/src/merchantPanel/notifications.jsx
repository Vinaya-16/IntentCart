import React, { useState } from 'react';
import {
    Bell,
    User,
    ChevronDown,
    Search,
    CheckCheck,
    Trash2,
    ShoppingBag,
    AlertCircle,
    Package,
    Megaphone
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const initialNotifications = [
    { id: 1, title: 'New Order Received', desc: 'Order #OD-124 placed by Sarah K. for Rs. 4,500', time: '10 mins ago', type: 'order', unread: true },
    { id: 2, title: 'Low Stock Alert', desc: 'Smart Watch inventory is running low (3 items remaining).', time: '1 hour ago', type: 'system', unread: true },
    { id: 3, title: 'Campaign Started', desc: 'Summer Sale campaign is now live.', time: '3 hours ago', type: 'campaign', unread: false },
    { id: 4, title: 'Order Delivered', desc: 'Order #OD-120 delivered successfully.', time: 'Yesterday', type: 'order', unread: false },
];

const Notifications = () => {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const clearAll = () => setNotifications([]);

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' ? true : filter === 'unread' ? n.unread : n.type === filter;
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.desc.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
            case 'system': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'campaign': return <Megaphone className="w-5 h-5 text-blue-600" />;
            default: return <Package className="w-5 h-5 text-slate-600" />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">

            {/* 2. Header placed at the top (full width) */}
            <Header />

            {/* 3. Row layout below Header for Sidebar + Main Content */}
            <div className="flex flex-1 overflow-hidden">

                {/* 4. Sidebar pinned on the left */}
                <Sidebar />

                {/* 5. Main Content takes up remaining space */}
                <div className="flex-1 overflow-y-auto">
                    {/* CONTENT */}
                    <main className="flex-1 p-8 overflow-y-auto space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Notifications</h1>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#1e3a6a] bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark all as read
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-white border border-slate-300 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear all
                                </button>
                            </div>
                        </div>

                        {/* FILTER TABS & SEARCH */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 md:pb-0 md:border-none">
                                {['all', 'unread', 'order', 'system', 'campaign'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFilter(tab)}
                                        className={`capitalize px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === tab
                                            ? 'bg-[#1e3a6a] text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-200/60'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full md:w-72">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                />
                            </div>
                        </div>

                        {/* NOTIFICATION LIST */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                            {filteredNotifications.length > 0 ? (
                                filteredNotifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 flex items-start gap-4 transition-colors hover:bg-slate-50 ${n.unread ? 'bg-blue-50/40' : ''
                                            }`}
                                    >
                                        <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                                                <span className="text-xs text-slate-400 font-medium">{n.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{n.desc}</p>
                                        </div>
                                        {n.unread && (
                                            <span className="w-2.5 h-2.5 bg-[#0b2b61] rounded-full shrink-0 self-center" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No notifications to show.
                                </div>
                            )}
                        </div>
                    </main>
                </div>

            </div>
        </div>
    );
};

export default Notifications;
