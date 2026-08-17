import React, { useState, useMemo, useEffect } from 'react';
import {
    Users,
    UserCheck,
    UserX,
    IndianRupee,
    Search,
    Edit2,
    Trash2,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    WifiOff,
    RefreshCw,
    X,
    MoveRight,
    CheckCircle,
    Truck,
    ShieldCheck,
    Store,
    ShoppingBag,
    UserCog,
    Clock,
    Check,
    AlertCircle
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/admin';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('User Management');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [filterApproval, setFilterApproval] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [revenue, setRevenue] = useState(0);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [approvalReason, setApprovalReason] = useState('');

    // Get token from localStorage
    const getToken = () => localStorage.getItem('token');

    // Fetch users from backend
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            setIsServerDown(false);

            const token = getToken();

            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            const [usersRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/users`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${API_URL}/dashboard-stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (usersRes.status === 401 || statsRes.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/intentCart-auth';
                return;
            }

            if (!usersRes.ok) {
                throw new Error('Failed to fetch users');
            }

            const usersData = await usersRes.json();

            if (usersData.success) {
                const formattedUsers = usersData.users.map(user => ({
                    id: user._id || user.id,
                    name: user.username || user.name || 'Unknown',
                    email: user.email,
                    role: user.role || 'customer',
                    joinedAt: new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    }),
                    isActive: user.isActive !== undefined ? user.isActive : true,
                    isApproved: user.isApproved || false,
                    merchantStatus: user.merchantStatus || 'pending',
                    businessName: user.businessName || '',
                    businessDescription: user.businessDescription || '',
                    businessAddress: user.businessAddress || '',
                    businessPhone: user.businessPhone || '',
                    shipperDetails: user.shipperDetails || null,
                    shipperStats: user.shipperStats || null,
                    tier: user.tier || 'Platinum Member',
                    rewardPoints: user.rewardPoints || 0,
                    totalOrders: user.totalOrders || 0,
                    blockedAt: user.blockedAt,
                    blockReason: user.blockReason,
                    riskScore: user.riskScore || 'low',
                    riskPercentage: user.riskPercentage || 0
                }));

                setUsers(formattedUsers);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setRevenue(statsData.stats.revenue.total || 0);
                }
            }

            setError('');
            setIsServerDown(false);
        } catch (err) {
            console.error('Error fetching users:', err);

            if (err.message === 'Failed to fetch' || err.message.includes('ERR_CONNECTION_REFUSED')) {
                setIsServerDown(true);
                setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Approve Merchant
    const approveMerchant = async (userId) => {
        try {
            setActionLoading(userId);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/merchants/${userId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to approve merchant');
            }

            const data = await response.json();

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId
                        ? {
                            ...user,
                            merchantStatus: 'approved',
                            isApproved: true
                        }
                        : user
                )
            );

            setSuccess('Merchant approved successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error approving merchant:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Reject Merchant
    const rejectMerchant = async (userId, reason) => {
        try {
            setActionLoading(userId);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/merchants/${userId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: reason || 'No reason provided' })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reject merchant');
            }

            const data = await response.json();

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId
                        ? {
                            ...user,
                            merchantStatus: 'rejected',
                            isApproved: false
                        }
                        : user
                )
            );

            setSuccess('Merchant rejected successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error rejecting merchant:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Approve Shipper
    const approveShipper = async (userId, approve) => {
        try {
            setActionLoading(userId);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/users/${userId}/approve-shipper`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isApproved: approve,
                    reason: approve ? 'Shipper approved by admin' : 'Shipper rejected by admin'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update shipper status');
            }

            const data = await response.json();

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId
                        ? {
                            ...user,
                            isApproved: approve,
                            shipperDetails: data.user?.shipperDetails || user.shipperDetails
                        }
                        : user
                )
            );

            setSuccess(`Shipper ${approve ? 'approved' : 'rejected'} successfully!`);
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error updating shipper:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Reset Merchant Status
    const resetMerchantStatus = async (userId) => {
        try {
            setActionLoading(userId);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/merchants/${userId}/reset`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reset merchant');
            }

            const data = await response.json();

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId
                        ? {
                            ...user,
                            merchantStatus: 'pending',
                            isApproved: false
                        }
                        : user
                )
            );

            setSuccess('Merchant reset to pending successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error resetting merchant:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Block/Unblock user
    const toggleBlockUser = async (userId, currentStatus) => {
        try {
            setActionLoading(userId);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const newStatus = currentStatus === 'Active' ? false : true;
            const action = newStatus ? 'unblocked' : 'blocked';

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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user status');
            }

            const data = await response.json();

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId
                        ? {
                            ...user,
                            isActive: newStatus,
                            isApproved: user.role === 'shipper' ? newStatus : user.isApproved,
                            blockedAt: newStatus ? null : new Date().toISOString(),
                            blockReason: newStatus ? null : 'Blocked by admin'
                        }
                        : user
                )
            );

            setSuccess(`User ${action} successfully!`);
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Delete user
    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            setActionLoading(userId);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            setSuccess(`User deleted successfully!`);
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Error deleting user:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Live Filtering Logic
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const status = user.isActive ? 'Active' : 'Suspended';
            const role = user.role || 'customer';

            // Approval status filtering
            let matchesApproval = true;
            if (filterApproval !== 'All') {
                if (user.role === 'merchant') {
                    matchesApproval = user.merchantStatus === filterApproval;
                } else if (user.role === 'shipper') {
                    matchesApproval = user.isApproved ? 'approved' : 'pending';
                    matchesApproval = matchesApproval === filterApproval;
                } else {
                    matchesApproval = filterApproval === 'approved' ? true : false;
                }
            }

            const matchesStatus = filterStatus === 'All' ? true : status === filterStatus;
            const matchesRole = filterRole === 'All' ? true : role === filterRole;
            const matchesSearch =
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.businessName && user.businessName.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesStatus && matchesRole && matchesSearch && matchesApproval;
        });
    }, [users, filterStatus, filterRole, filterApproval, searchQuery]);

    // Stats
    const stats = [
        {
            label: 'Total Users',
            value: users.length,
            change: '+0%',
            isPositive: true,
            icon: Users
        },
        {
            label: 'Active Users',
            value: users.filter(u => u.isActive).length,
            change: '+0%',
            isPositive: true,
            icon: UserCheck
        },
        {
            label: 'Suspended Users',
            value: users.filter(u => !u.isActive).length,
            change: '0%',
            isPositive: false,
            icon: UserX
        },
        {
            label: 'Revenue',
            value: `RS.${revenue.toLocaleString()}`,
            change: '+0%',
            isPositive: true,
            icon: IndianRupee
        },
    ];

    const statusFilters = ['All', 'Active', 'Suspended'];
    const roleFilters = ['All', 'admin', 'merchant', 'customer', 'shipper'];
    const approvalFilters = ['All', 'pending', 'approved', 'rejected'];

    // Get role icon
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <UserCog className="w-3 h-3" />;
            case 'merchant': return <Store className="w-3 h-3" />;
            case 'shipper': return <Truck className="w-3 h-3" />;
            default: return <ShoppingBag className="w-3 h-3" />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
            <Sidebar activeTab='User Management' />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <Header />

                <main className="p-8 flex-1 bg-white">
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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow"
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

                    {isServerDown && (
                        <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                            <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                            <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                            <p className="mb-4">{error}</p>
                            <button
                                onClick={fetchUsers}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Connection
                            </button>
                        </div>
                    )}

                    {!isServerDown && error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> {success}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e2356] border-t-transparent"></div>
                        </div>
                    ) : (
                        !isServerDown && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
                                {/* Controls */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Search Bar */}
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by ID, name, email, or business..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2356]/20 focus:border-[#1e2356] transition-all"
                                        />
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Status Filter */}
                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                                            {statusFilters.map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setFilterStatus(status)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus === status
                                                        ? 'bg-[#1e2356] text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Role Filter */}
                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                                            {roleFilters.map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => setFilterRole(role)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${filterRole === role
                                                        ? 'bg-[#1e2356] text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                                        }`}
                                                >
                                                    {role === 'All' ? 'All Roles' : role}
                                                    {role !== 'All' && getRoleIcon(role)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Approval Filter */}
                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                                            {approvalFilters.map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setFilterApproval(status)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterApproval === status
                                                        ? 'bg-[#1e2356] text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                                        }`}
                                                >
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* User Data Table */}
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#1e2356] text-white text-xs font-semibold uppercase tracking-wider">
                                                <th className="py-3.5 px-4">User ID</th>
                                                <th className="py-3.5 px-4">User</th>
                                                <th className="py-3.5 px-4">Email</th>
                                                <th className="py-3.5 px-4">Role</th>
                                                <th className="py-3.5 px-4">Status</th>
                                                <th className="py-3.5 px-4">Approval</th>
                                                <th className="py-3.5 px-4">Joined</th>
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
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-900">{user.name}</span>
                                                                {user.role === 'admin' && <UserCog className="w-4 h-4 text-purple-500" />}
                                                                {user.role === 'merchant' && <Store className="w-4 h-4 text-blue-500" />}
                                                                {user.role === 'shipper' && <Truck className="w-4 h-4 text-orange-500" />}
                                                                {user.role === 'customer' && <ShoppingBag className="w-4 h-4 text-green-500" />}
                                                                {user.businessName && (
                                                                    <span className="text-xs text-slate-400 ml-1">
                                                                        ({user.businessName})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-sky-600 hover:underline cursor-pointer">
                                                            {user.email}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.role === 'admin'
                                                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                                : user.role === 'merchant'
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                    : user.role === 'shipper'
                                                                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                                }`}>
                                                                {user.role || 'customer'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.isActive
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    }`}
                                                            >
                                                                {user.isActive ? 'Active' : 'Suspended'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            {user.role === 'merchant' ? (
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.merchantStatus === 'approved'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : user.merchantStatus === 'rejected'
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                    {user.merchantStatus}
                                                                </span>
                                                            ) : user.role === 'shipper' ? (
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.isApproved
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                    {user.isApproved ? 'Approved' : 'Pending'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-500">{user.joinedAt}</td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {/* Merchant Actions */}
                                                                {user.role === 'merchant' && user.merchantStatus === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => approveMerchant(user.id)}
                                                                            disabled={actionLoading === user.id}
                                                                            className="p-1.5 rounded-md text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                                                            title="Approve Merchant"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const reason = prompt('Enter rejection reason:');
                                                                                if (reason !== null) {
                                                                                    rejectMerchant(user.id, reason);
                                                                                }
                                                                            }}
                                                                            disabled={actionLoading === user.id}
                                                                            className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                            title="Reject Merchant"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {user.role === 'merchant' && user.merchantStatus !== 'pending' && (
                                                                    <button
                                                                        onClick={() => resetMerchantStatus(user.id)}
                                                                        disabled={actionLoading === user.id}
                                                                        className="p-1.5 rounded-md text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                                                                        title="Reset to Pending"
                                                                    >
                                                                        <RefreshCw className="w-4 h-4" />
                                                                    </button>
                                                                )}

                                                                {/* Shipper Actions */}
                                                                {user.role === 'shipper' && !user.isApproved && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => approveShipper(user.id, true)}
                                                                            disabled={actionLoading === user.id}
                                                                            className="p-1.5 rounded-md text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                                                            title="Approve Shipper"
                                                                        >
                                                                            <ShieldCheck className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => approveShipper(user.id, false)}
                                                                            disabled={actionLoading === user.id}
                                                                            className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                            title="Reject Shipper"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {/* Block/Unblock Button - All roles except admin */}
                                                                {user.role !== 'admin' && (
                                                                    <button
                                                                        onClick={() => toggleBlockUser(user.id, user.isActive ? 'Active' : 'Suspended')}
                                                                        disabled={actionLoading === user.id}
                                                                        className={`p-1.5 rounded-md transition-colors ${user.isActive
                                                                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                                                                            : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                                            } disabled:opacity-50`}
                                                                        title={user.isActive ? 'Suspend user' : 'Activate user'}
                                                                    >
                                                                        {actionLoading === user.id ? (
                                                                            <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                                                        ) : user.isActive ? (
                                                                            <EyeOff className="w-4 h-4" />
                                                                        ) : (
                                                                            <Eye className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}

                                                                {/* Delete Button - All roles except admin */}
                                                                {user.role !== 'admin' && (
                                                                    <button
                                                                        onClick={() => handleDelete(user.id)}
                                                                        disabled={actionLoading === user.id}
                                                                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                                        title="Delete user"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="py-8 text-center text-slate-400 text-sm">
                                                        No users found matching your filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-slate-500 gap-2">
                                    <span>Showing {filteredUsers.length} of {users.length} users</span>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Active: {users.filter(u => u.isActive).length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                            Suspended: {users.filter(u => !u.isActive).length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            Pending: {users.filter(u =>
                                                (u.role === 'merchant' && u.merchantStatus === 'pending') ||
                                                (u.role === 'shipper' && !u.isApproved)
                                            ).length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Merchants: {users.filter(u => u.role === 'merchant').length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            Shippers: {users.filter(u => u.role === 'shipper').length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserManagement;