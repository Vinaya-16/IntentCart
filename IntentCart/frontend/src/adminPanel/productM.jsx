import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    RefreshCw,
    WifiOff,
    AlertCircle,
    Image as ImageIcon,
    Check,
    X,
    RotateCcw,
    Package,
    Hourglass
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_BASE_URI = import.meta.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URI}/admin` || 'http://localhost:5000/api/admin';

const ProductM = () => {
    const [activeTab, setActiveTab] = useState('Product Moderation');
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        active: 0,
        outOfStock: 0
    });

    const getToken = () => localStorage.getItem('token');

    // Fetch products
    const fetchProducts = async () => {
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

            const statusMap = {
                'All': '',
                'Under Review': 'pending',
                'Flagged': 'rejected',
                'Approved': 'approved'
            };

            const statusParam = statusMap[activeFilter] || '';
            const url = `${API_URL}/products${statusParam ? `?status=${statusParam}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`;

            const response = await fetch(url, {
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

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            if (data.success) {
                setProducts(data.products || []);
                setStats({
                    total: data.total || 0,
                    pending: data.pendingCount || 0,
                    approved: data.approvedCount || 0,
                    rejected: data.rejectedCount || 0,
                    active: data.products?.filter(p => p.status === 'active').length || 0,
                    outOfStock: data.products?.filter(p => p.stock === 0).length || 0
                });
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            if (err.message === 'Failed to fetch' || err.message.includes('ERR_CONNECTION_REFUSED')) {
                setIsServerDown(true);
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Toggle product status (Approve/Reject)
    const handleToggleStatus = async (id, currentStatus) => {
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

            let endpoint;
            let action;

            if (currentStatus === 'pending') {
                // If pending, ask what to do
                const choice = window.confirm('Approve or Reject this product?\n\nClick OK to Approve, Cancel to Reject');
                
                if (choice) {
                    endpoint = `${API_URL}/products/${id}/approve`;
                    action = 'approved';
                } else {
                    // Reject without reason
                    endpoint = `${API_URL}/products/${id}/reject`;
                    action = 'rejected';
                }
            } else if (currentStatus === 'approved') {
                // Toggle to rejected
                endpoint = `${API_URL}/products/${id}/reject`;
                action = 'rejected';
            } else if (currentStatus === 'rejected') {
                // Toggle to approved
                endpoint = `${API_URL}/products/${id}/approve`;
                action = 'approved';
            }

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    reason: action === 'rejected' ? 'Product rejected by admin' : null 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update product status');
            }

            const data = await response.json();
            setSuccess(`Product ${action === 'approved' ? 'approved' : 'rejected'} successfully!`);
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error toggling product status:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Quick Approve
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

            const response = await fetch(`${API_URL}/products/${id}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to approve product');
            }

            const data = await response.json();
            setSuccess('Product approved successfully!');
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error approving product:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Quick Reject (without reason)
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

            const response = await fetch(`${API_URL}/products/${id}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Product rejected by admin' })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reject product');
            }

            const data = await response.json();
            setSuccess('Product rejected successfully!');
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error rejecting product:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'text-emerald-600';
            case 'rejected':
                return 'text-red-500';
            case 'pending':
                return 'text-amber-500';
            default:
                return 'text-gray-500';
        }
    };

    // Get status label
    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            case 'pending':
                return 'Pending';
            default:
                return status;
        }
    };

    // Filtered products based on search
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = 
                product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.productId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.id?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesSearch;
        });
    }, [products, searchQuery]);

    // Filter buttons
    const filterButtons = ['All', 'Under Review', 'Flagged', 'Approved'];

    useEffect(() => {
        fetchProducts();
    }, [activeFilter]);

    // Stats Cards
    const statsCards = [
        { label: 'Total Products', value: stats.total, icon: <Package /> },
        { label: 'Pending', value: stats.pending, icon: <Hourglass /> },
        { label: 'Approved', value: stats.approved, icon: <Check /> },
        { label: 'Rejected', value: stats.rejected, icon: <X /> },
    ];

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
            <Sidebar
                activeTab="Product Moderation"
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="p-8 flex-1 bg-white space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1e2356]">
                                Product Moderation
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Review and manage product listings
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-sky-600 font-medium">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <button
                                onClick={fetchProducts}
                                className="p-2 text-gray-500 hover:text-[#1e2356] hover:bg-gray-100 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsCards.map((stat, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                                        <p className="text-2xl font-bold text-[#1e2356]">{stat.value}</p>
                                    </div>
                                    <span className="text-2xl">{stat.icon}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isServerDown && (
                        <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                            <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                            <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                            <p className="mb-4">{error}</p>
                            <button
                                onClick={fetchProducts}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Connection
                            </button>
                        </div>
                    )}

                    {error && !isServerDown && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                            <X /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                            <Check /> {success}
                        </div>
                    )}

                    {/* Search Input Bar */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search products by name, merchant, or ID..."
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
                                {filter === 'Under Review' && stats.pending > 0 && (
                                    <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {stats.pending}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Product Data Table */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1d2258] border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-[#1d2258] text-white font-semibold">
                                            <th className="py-3.5 px-6">Image</th>
                                            <th className="py-3.5 px-6">Product Name</th>
                                            <th className="py-3.5 px-6">Merchant</th>
                                            <th className="py-3.5 px-6">Category</th>
                                            <th className="py-3.5 px-6">Price</th>
                                            <th className="py-3.5 px-6">Stock</th>
                                            <th className="py-3.5 px-6">Submitted</th>
                                            <th className="py-3.5 px-6">Status</th>
                                            <th className="py-3.5 px-6 text-center">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <tr
                                                    key={product.id || product.productId}
                                                    className="hover:bg-slate-50/80 transition-colors"
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                                                            {product.image ? (
                                                                <img 
                                                                    src={product.image} 
                                                                    alt={product.name} 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-gray-800">
                                                        {product.name}
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-700 font-medium">
                                                        {product.merchant}
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-600">
                                                        {product.category || 'Uncategorized'}
                                                    </td>
                                                    <td className="py-4 px-6 font-medium text-gray-800">
                                                        Rs. {product.price || 0}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock <= 10 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                            {product.stock || 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-600 font-medium">
                                                        {product.date}
                                                    </td>
                                                    <td className="py-4 px-6 font-bold">
                                                        <span className={getStatusColor(product.status)}>
                                                            {getStatusLabel(product.status)}
                                                        </span>
                                                        {product.approvalReason && (
                                                            <div className="text-xs text-gray-400 font-normal">
                                                                {product.approvalReason}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {product.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleApprove(product.id)}
                                                                        disabled={actionLoading === product.id}
                                                                        className="text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50"
                                                                        title="Approve"
                                                                    >
                                                                        {actionLoading === product.id ? (
                                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle2 className="w-5 h-5" />
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleReject(product.id)}
                                                                        disabled={actionLoading === product.id}
                                                                        className="text-red-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                                                        title="Reject"
                                                                    >
                                                                        <XCircle className="w-5 h-5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {product.status === 'approved' && (
                                                                <>
                                                                    <span className="text-emerald-500 text-xs font-semibold">
                                                                        ✓ Approved
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleReject(product.id)}
                                                                        disabled={actionLoading === product.id}
                                                                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                                                        title="Reject"
                                                                    >
                                                                        <RotateCcw className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {product.status === 'rejected' && (
                                                                <>
                                                                    <span className="text-red-500 text-xs font-semibold">
                                                                        ✗ Rejected
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleApprove(product.id)}
                                                                        disabled={actionLoading === product.id}
                                                                        className="text-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50"
                                                                        title="Approve"
                                                                    >
                                                                        <RotateCcw className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="py-8 text-center text-gray-500 font-medium">
                                                    No products found matching your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    {!loading && products.length > 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>
                                Showing {filteredProducts.length} of {products.length} products
                            </span>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Approved: {stats.approved}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Pending: {stats.pending}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Rejected: {stats.rejected}
                                </span>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductM;