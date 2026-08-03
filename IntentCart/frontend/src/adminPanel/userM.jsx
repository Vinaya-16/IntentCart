import React, { useState, useMemo, useEffect } from 'react';
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

const API_URL = 'http://localhost:5000/api/admin';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('User Management');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0
    });

    // Get token from localStorage
    const getToken = () => localStorage.getItem('token');

    // Fetch users from backend
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = getToken();
            
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/intentCart-auth';
                return;
            }

            if (response.status === 403) {
                const errorData = await response.json();
                setError('You do not have admin access. Please contact administrator.');
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();

            if (data.success) {
                const formattedUsers = data.users.map(user => ({
                    id: user._id || user.id,
                    name: user.username || user.name || 'Unknown',
                    email: user.email,
                    joinedAt: new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    }),
                    status: user.isActive ? 'Active' : 'Suspended',
                    role: user.role
                }));
                setUsers(formattedUsers);
                updateStats(formattedUsers);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update stats based on users
    const updateStats = (userList) => {
        const total = userList.length;
        const active = userList.filter(u => u.status === 'Active').length;
        const suspended = userList.filter(u => u.status === 'Suspended').length;
        
        setStats({
            totalUsers: total,
            activeUsers: active,
            suspendedUsers: suspended,
            totalRevenue: 0,
            totalOrders: 0, 
            totalProducts: 0  
        });
    };

    // Block/Unblock user
    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const token = getToken();
            const newStatus = currentStatus === 'Active' ? false : true;
            
            const response = await fetch(`${API_URL}/users/${userId}/block`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    isActive: newStatus,
                    reason: newStatus ? 'User unblocked' : 'User blocked by admin'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update user status');
            }

            const data = await response.json();
            // console.log('User status updated:', data);
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.message);
        }
    };

    // Delete user
    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const token = getToken();
            
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            const data = await response.json();
            // console.log('User deleted:', data);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            setError(err.message);
        }
    };

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

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

    // Stats Cards Data with real values
    const statsCards = [
        { 
            label: 'Total Users', 
            value: stats.totalUsers.toLocaleString(), 
            change: '+0%', 
            isPositive: true, 
            icon: Users 
        },
        { 
            label: 'Active Users', 
            value: stats.activeUsers.toLocaleString(), 
            change: '+0%', 
            isPositive: true, 
            icon: UserCheck 
        },
        { 
            label: 'Suspended Users', 
            value: stats.suspendedUsers.toLocaleString(), 
            change: '0%', 
            isPositive: false, 
            icon: UserX 
        },
        { 
            label: 'Total Revenue', 
            value: '$0',  
            change: '0%', 
            isPositive: true, 
            icon: DollarSign 
        },
    ];

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
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e2356] border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            {/* Metric Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {statsCards.map((stat, index) => {
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
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4 mt-6">
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
                                                <th className="py-3.5 px-4">User ID</th>
                                                <th className="py-3.5 px-4">Name</th>
                                                <th className="py-3.5 px-4">Email</th>
                                                <th className="py-3.5 px-4">Joined At</th>
                                                <th className="py-3.5 px-4">Role</th>
                                                <th className="py-3.5 px-4">Status</th>
                                                <th className="py-3.5 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-sm bg-white">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                                                            {user.id.substring(0, 8)}
                                                        </td>
                                                        <td className="py-3.5 px-4 font-medium text-slate-900">{user.name}</td>
                                                        <td className="py-3.5 px-4 text-sky-600 hover:underline cursor-pointer">
                                                            {user.email}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-500">{user.joinedAt}</td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                                user.role === 'admin' 
                                                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                                    : user.role === 'merchant'
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                            }`}>
                                                                {user.role || 'customer'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.status === 'Active'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    }`}
                                                            >
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => toggleUserStatus(user.id, user.status)}
                                                                    title={user.status === 'Active' ? 'Suspend user' : 'Activate user'}
                                                                    className={`p-1.5 rounded-md transition-colors ${
                                                                        user.status === 'Active'
                                                                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                                                                            : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                                    }`}
                                                                >
                                                                    {user.status === 'Active' ? (
                                                                        <UserX className="w-4 h-4" />
                                                                    ) : (
                                                                        <UserCheck className="w-4 h-4" />
                                                                    )}
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
                                                    <td colSpan="7" className="py-8 text-center text-slate-400 text-sm">
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
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserManagement;