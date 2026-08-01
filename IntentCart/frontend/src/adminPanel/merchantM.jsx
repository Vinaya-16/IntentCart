import React, { useState, useMemo } from 'react';
import {
    LayoutGrid,
    Users,
    ShieldCheck,
    Package,
    UserCheck,
    LogOut,
    Bell,
    ChevronDown,
    Search,
    Edit2,
    Trash2,
    TrendingUp,
    UserPlus,
    DollarSign,
    UserX,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// Sample Merchants Data
const INITIAL_MERCHANTS = [
    { id: 'CT-123', name: 'Urban M', email: 'vinaya@example.com', date: '2026-9-2', status: 'Approved' },
    { id: 'CT-123', name: 'Flip P.', email: 'mithila@gmail.com', date: '2026-9-2', status: 'Rejected' },
    { id: 'CT-123', name: 'Sheen K.', email: 'vinaya@example.com', date: '2026-9-2', status: 'Pending' },
    { id: 'CT-123', name: 'ggyhuk P.', email: 'vinaya@example.com', date: '2026-9-2', status: 'Approved' },
];

const MerchantManagement = () => {
    const [activeTab, setActiveTab] = useState('Merchant Verification');
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [merchants, setMerchants] = useState(INITIAL_MERCHANTS);

    // Live Filtering Logic
    const filteredMerchants = useMemo(() => {
        return merchants.filter((merchant) => {
            const matchesFilter =
                activeFilter === 'All'
                    ? true
                    : activeFilter === 'New Merchant'
                    ? merchant.status === 'Pending'
                    : merchant.status === activeFilter;

            const matchesSearch =
                merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                merchant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                merchant.id.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesFilter && matchesSearch;
        });
    }, [merchants, activeFilter, searchQuery]);

    const handleApprove = (id) => {
        setMerchants((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: 'Approved' } : m))
        );
    };

    const handleReject = (id) => {
        setMerchants((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: 'Rejected' } : m))
        );
    };

    const filterButtons = ['All', 'New Merchant', 'Approved', 'Rejected'];

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">

            {/* Sidebar */}
            <Sidebar 
                activeTab="Merchant Verification" 
                setActiveTab={setActiveTab} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

                {/* Header Section */}
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Main Dashboard Body */}
                <main className="p-8 flex-1 bg-white space-y-6">

                    {/* Main Title Section */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-[#1e2356]">
                            Merchant Management
                        </h2>
                        <span className="text-sm text-sky-600 font-medium">
                            Thursday, July 30, 2026
                        </span>
                    </div>

                    {/* Search Input Bar */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d2258]/30 shadow-xs"
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                        {filterButtons.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveFilter(filter)}
                                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                    activeFilter === filter
                                        ? 'bg-[#1d2258] text-white shadow-xs'
                                        : 'bg-[#1d2258] text-white opacity-80 hover:opacity-100'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Merchant Data Table */}
                    <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[600px]">

                                {/* Table Header */}
                                <thead>
                                    <tr className="bg-[#1d2258] text-white font-semibold">
                                        <th className="py-3.5 px-6">MerchantId</th>
                                        <th className="py-3.5 px-6">Business Name</th>
                                        <th className="py-3.5 px-6">Email</th>
                                        <th className="py-3.5 px-6">Apply date</th>
                                        <th className="py-3.5 px-6">Status</th>
                                        <th className="py-3.5 px-6 text-center">Actions</th>
                                    </tr>
                                </thead>

                                {/* Table Body */}
                                <tbody className="divide-y divide-gray-200">
                                    {filteredMerchants.length > 0 ? (
                                        filteredMerchants.map((merchant, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 px-6 font-medium text-gray-700">{merchant.id}</td>
                                                <td className="py-4 px-6 font-semibold text-gray-800">{merchant.name}</td>
                                                <td className="py-4 px-6">
                                                    <a
                                                        href={`mailto:${merchant.email}`}
                                                        className="text-gray-800 underline hover:text-blue-600 font-medium"
                                                    >
                                                        {merchant.email}
                                                    </a>
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 font-medium">{merchant.date}</td>
                                                <td className="py-4 px-6 font-bold">
                                                    <span
                                                        className={
                                                            merchant.status === 'Approved'
                                                                ? 'text-emerald-600'
                                                                : merchant.status === 'Rejected'
                                                                ? 'text-red-500'
                                                                : 'text-amber-500'
                                                        }
                                                    >
                                                        {merchant.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApprove(merchant.id)}
                                                            className="text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(merchant.id)}
                                                            className="text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5 fill-red-100" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                                                No merchants found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default MerchantManagement;