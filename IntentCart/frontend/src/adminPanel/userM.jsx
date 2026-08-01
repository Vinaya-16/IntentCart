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
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// Sample Users Data
const INITIAL_USERS = [
    { id: 'CT-123', name: 'Vinaya P.', email: 'vinaya@example.com', joinedAt: '2026-09-02', status: 'Active' },
    { id: 'CT-124', name: 'Mithila P.', email: 'mithila@gmail.com', joinedAt: '2026-09-02', status: 'Suspended' },
    { id: 'CT-125', name: 'Rohan S.', email: 'rohan@example.com', joinedAt: '2026-08-15', status: 'Active' },
    { id: 'CT-126', name: 'Ananya M.', email: 'ananya@example.com', joinedAt: '2026-08-10', status: 'Active' },
    { id: 'CT-127', name: 'Karan K.', email: 'karan@gmail.com', joinedAt: '2026-07-28', status: 'Suspended' },
];

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('User Management');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState(INITIAL_USERS);

    // Stats Data
    const stats = [
        { label: 'Total Users', value: '1,200', change: '+12.5%', isPositive: true, icon: Users },
        { label: 'Active Users', value: '1,300', change: '+8.2%', isPositive: true, icon: UserCheck },
        { label: 'Suspended Users', value: '120', change: '-3.1%', isPositive: false, icon: UserX },
        { label: 'Revenue', value: '$125,400', change: '+18.4%', isPositive: true, icon: DollarSign },
    ];

    // Live Filtering Logic
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesStatus =
                filterStatus === 'All' ? true : user.status.toLowerCase() === filterStatus.toLowerCase();
            const matchesSearch =
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [users, filterStatus, searchQuery]);

    const handleDelete = (id) => {
        setUsers(users.filter((user) => user.id !== id));
    };

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">

            {/* Sidebar */}
            <Sidebar activeTab='User Management' />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

                {/* Header Section */}
                <Header />

                {/* Main Dashboard Body */}
                <main className="p-8 flex-1 bg-white">
                    
                    {/* Main Title Section */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-[#1e2356]">
                            User Management
                        </h2>
                        <span className="text-sm text-sky-600 font-medium">
                            Thursday, July 30, 2026
                        </span>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                {stat.label}
                                            </p>
                                            <p className="text-2xl font-bold text-[#1e2356] mt-1">{stat.value}</p>
                                        </div>
                                        <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center text-xs font-medium">
                                        <span className={`inline-flex items-center ${stat.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                            {stat.change}
                                        </span>
                                        <span className="text-slate-400 ml-1.5">vs last month</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls: Search Bar & Filters */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Search Bar */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, name, or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2356]/20 focus:border-[#1e2356] transition-all"
                                />
                            </div>

                            {/* Status Tabs */}
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start">
                                {['All', 'Active', 'Suspended'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus === status
                                                ? 'bg-[#1e2356] text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* User Data Table */}
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1e2356] text-white text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3.5 px-4">UserId</th>
                                        <th className="py-3.5 px-4">Name</th>
                                        <th className="py-3.5 px-4">Email</th>
                                        <th className="py-3.5 px-4">Joined At</th>
                                        <th className="py-3.5 px-4">Status</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-sm bg-white">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-4 font-semibold text-slate-700">{user.id}</td>
                                                <td className="py-3.5 px-4 font-medium text-slate-900">{user.name}</td>
                                                <td className="py-3.5 px-4 text-sky-600 hover:underline cursor-pointer">
                                                    {user.email}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-500">{user.joinedAt}</td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.status === 'Active'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}
                                                    >
                                                        {/* <span
                                                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                                                                }`}
                                                        ></span> */}
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            title="Edit user"
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            title="Delete user"
                                                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                                                No users found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Pagination Bar */}
                        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                            <span>Showing {filteredUsers.length} entries</span>
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-slate-700">1</span>
                                <button className="p-1.5 border border-slate-200 rounded hover:bg-slate-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserManagement;