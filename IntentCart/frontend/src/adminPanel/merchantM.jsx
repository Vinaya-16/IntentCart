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
    CheckCircle2,
    XCircle,
    WifiOff,
    RefreshCw,
    Cross,
    MoveRight,
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_URL = 'http://localhost:5000/api/admin';

const MerchantManagement = () => {
    const [activeTab, setActiveTab] = useState('Merchant Verification');
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const getToken = () => localStorage.getItem('token');

    const fetchMerchants = async () => {
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

            console.log('🔄 Fetching merchants...');

            const response = await fetch(`${API_URL}/users?role=merchant`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/intentCart-auth';
                    return;
                }
                if (response.status === 403) {
                    const errorData = await response.json();
                    setError('You do not have admin access.');
                    setLoading(false);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // console.log('Merchants fetched:', data);

            if (data.success) {
                // Filter only merchants
                const merchantUsers = data.users.filter(user => user.role === 'merchant');
                // console.log('Merchants found:', merchantUsers.length);
                
                const formattedMerchants = merchantUsers.map(user => ({
                    id: user._id || user.id,
                    name: user.businessName || user.username || 'Unknown Business',
                    email: user.email,
                    date: new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    }),
                    // Use isApproved field from database
                    isApproved: user.isApproved || false,
                    isActive: user.isActive,
                    businessDescription: user.businessDescription || '',
                    businessAddress: user.businessAddress || '',
                    businessPhone: user.businessPhone || '',
                    username: user.username
                }));
                
                // console.log('Formatted merchants:', formattedMerchants);
                setMerchants(formattedMerchants);
                setError('');
                setIsServerDown(false);
            }
        } catch (err) {
            console.error('Error fetching merchants:', err);
            
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

    // Approve merchant
    const handleApprove = async (id) => {
        try {
            setActionLoading(id);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            // console.log(`Approving merchant: ${id}`);

            const response = await fetch(`${API_URL}/merchants/${id}/approve`, {
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
            // console.log('Merchant approved:', data);
            
            // Update local state immediately
            setMerchants(prevMerchants => 
                prevMerchants.map(merchant => 
                    merchant.id === id 
                        ? { 
                            ...merchant, 
                            isApproved: true,
                            approvedAt: new Date().toISOString()
                        } 
                        : merchant
                )
            );

            setSuccess(`Merchant approved successfully!`);
            setTimeout(() => setSuccess(''), 3000);
            
        } catch (err) {
            console.error('Error approving merchant:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Reject merchant
    const handleReject = async (id) => {
        try {
            setActionLoading(id);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const reason = prompt('Please enter reason for rejection:');
            if (reason === null) {
                setActionLoading(null);
                return;
            }

            // console.log(`Rejecting merchant: ${id}`);

            const response = await fetch(`${API_URL}/merchants/${id}/reject`, {
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
            // console.log('Merchant rejected:', data);
            
            // Update local state immediately
            setMerchants(prevMerchants => 
                prevMerchants.map(merchant => 
                    merchant.id === id 
                        ? { 
                            ...merchant, 
                            isApproved: false,
                            rejectedAt: new Date().toISOString(),
                            rejectionReason: reason || 'No reason provided'
                        } 
                        : merchant
                )
            );

            setSuccess(`Merchant rejected successfully!`);
            setTimeout(() => setSuccess(''), 3000);
            
        } catch (err) {
            console.error('Error rejecting merchant:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    // Filter based on isApproved field
    const filteredMerchants = useMemo(() => {
        return merchants.filter((merchant) => {
            // Determine status based on isApproved
            const status = merchant.isApproved ? 'Approved' : 'Pending';
            
            const matchesFilter =
                activeFilter === 'All'
                    ? true
                    : activeFilter === 'New Merchant'
                    ? status === 'Pending'
                    : status === activeFilter;

            const matchesSearch =
                merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                merchant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                merchant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (merchant.username && merchant.username.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesFilter && matchesSearch;
        });
    }, [merchants, activeFilter, searchQuery]);

    const filterButtons = ['All', 'New Merchant', 'Approved', 'Rejected'];

    const getStatusColor = (isApproved) => {
        return isApproved ? 'text-emerald-600' : 'text-amber-500';
    };

    const getStatusText = (isApproved) => {
        return isApproved ? 'Approved' : 'Pending';
    };

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
            <Sidebar 
                activeTab="Merchant Verification" 
                setActiveTab={setActiveTab} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="p-8 flex-1 bg-white space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-[#1e2356]">
                            Merchant Management
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

                    {isServerDown && (
                        <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                            <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                            <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                            <p className="mb-4">{error}</p>
                            <button
                                onClick={fetchMerchants}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Connection
                            </button>
                        </div>
                    )}

                    {!isServerDown && error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                            <Cross /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                            <MoveRight /> {success}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e2356] border-t-transparent"></div>
                        </div>
                    ) : (
                        !isServerDown && (
                            <>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search by business name, email, or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d2258]/30 shadow-xs"
                                    />
                                </div>

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

                                <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-100">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-[#1d2258] text-white font-semibold">
                                                    <th className="py-3.5 px-6">ID</th>
                                                    <th className="py-3.5 px-6">Business Name</th>
                                                    <th className="py-3.5 px-6">Email</th>
                                                    <th className="py-3.5 px-6">Apply Date</th>
                                                    <th className="py-3.5 px-6">Status</th>
                                                    <th className="py-3.5 px-6 text-center">Actions</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200">
                                                {filteredMerchants.length > 0 ? (
                                                    filteredMerchants.map((merchant) => (
                                                        <tr key={merchant.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="py-4 px-6 font-medium text-gray-700">
                                                                {merchant.id.substring(0, 8)}
                                                            </td>
                                                            <td className="py-4 px-6 font-semibold text-gray-800">
                                                                {merchant.name}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <a
                                                                    href={`mailto:${merchant.email}`}
                                                                    className="text-gray-800 hover:text-blue-600 font-medium hover:underline"
                                                                >
                                                                    {merchant.email}
                                                                </a>
                                                            </td>
                                                            <td className="py-4 px-6 text-gray-600 font-medium">
                                                                {merchant.date}
                                                            </td>
                                                            <td className="py-4 px-6 font-bold">
                                                                <span className={getStatusColor(merchant.isApproved)}>
                                                                    {getStatusText(merchant.isApproved)}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {!merchant.isApproved ? (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleApprove(merchant.id)}
                                                                                disabled={actionLoading === merchant.id}
                                                                                className="text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                title="Approve Merchant"
                                                                            >
                                                                                {actionLoading === merchant.id ? (
                                                                                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                                                ) : (
                                                                                    <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                                                                                )}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleReject(merchant.id)}
                                                                                disabled={actionLoading === merchant.id}
                                                                                className="text-red-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                title="Reject Merchant"
                                                                            >
                                                                                <XCircle className="w-5 h-5 fill-red-100" />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-emerald-600 text-xs font-semibold">
                                                                             Approved
                                                                        </span>
                                                                    )}
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

                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>
                                        Showing {filteredMerchants.length} of {merchants.length} merchants
                                    </span>
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Approved: {merchants.filter(m => m.isApproved === true).length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            Pending: {merchants.filter(m => m.isApproved === false).length}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )
                    )}
                </main>
            </div>
        </div>
    );
};

export default MerchantManagement;