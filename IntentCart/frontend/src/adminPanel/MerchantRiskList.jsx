import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Mail,
  DollarSign,
  ShoppingBag,
  X,
  Eye,
  AlertCircle,
  UserCheck,
  Filter
} from 'lucide-react';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

const API_BASE_URL = 'http://localhost:5000/api/admin';

const MerchantRiskList = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Merchant Verification');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    low: 0,
    medium: 0,
    high: 0,
    active: 0,
    pending: 0,
    suspended: 0
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch merchants with filters
  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.append('search', debouncedSearch.trim());
      }

      if (filterRisk !== 'all') {
        params.append('riskLevel', filterRisk);
      }

      const url = `${API_BASE_URL}/risk/merchants?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Ensure backend is running.');
      }

      const data = await response.json();

      if (data.success) {
        setMerchants(data.merchants || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 1
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch merchants');
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
      setError(error.message || 'Failed to load merchants. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filterRisk]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}/risk/stats`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Sync data on filter/pagination changes
  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Update merchant status
  const updateMerchantStatus = async (merchantId, status) => {
    const statusMessages = {
      active: 'activate',
      pending: 'set to pending',
      suspended: 'suspend'
    };

    if (!window.confirm(`Are you sure you want to ${statusMessages[status] || status} this merchant?`)) {
      return;
    }

    setActionLoading(merchantId);
    setError('');
    setSuccessMessage('');

    try {
      const url = `${API_BASE_URL}/risk/merchant/${merchantId}/status`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status,
          reason: status === 'suspended' ? 'Suspended by admin' : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchMerchants();
        await fetchStats();
        setSuccessMessage(`Merchant status updated to ${status} successfully!`);
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating merchant status:', error);
      setError(error.message || 'Failed to update merchant status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Recalculate risk
  const recalculateRisk = async (merchantId) => {
    if (!window.confirm('Recalculate risk score for this merchant?')) {
      return;
    }

    setActionLoading(merchantId);
    setError('');
    setSuccessMessage('');

    try {
      const url = `${API_BASE_URL}/risk/merchant/${merchantId}/recalculate`;

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchMerchants();
        await fetchStats();
        setSuccessMessage('Risk score recalculated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.message || 'Failed to recalculate risk');
      }
    } catch (error) {
      console.error('Error recalculating risk:', error);
      setError(error.message || 'Failed to recalculate risk score. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskBadge = (score) => {
    const config = {
      low: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Low' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Medium' },
      high: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'High' },
      unassessed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Shield, label: 'Unassessed' }
    };
    const risk = config[score] || config.unassessed;
    const Icon = risk.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.bg} ${risk.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {risk.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
    };
    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setFilterRisk('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    fetchMerchants();
    fetchStats();
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 mt-1"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
      <Sidebar
        activeTab="Risk Management"
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 bg-white space-y-6">
          <div>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Shield className="w-8 h-8 text-blue-600 mr-3" />
                    Risk Management
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Monitor merchant risk scores and manage merchant status
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Success</p>
                  <p className="text-sm">{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="text-green-500 hover:text-green-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Low Risk</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600">{stats.low}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Medium Risk</p>
                    <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.medium}</p>
                  </div>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">High Risk</p>
                    <p className="text-lg sm:text-xl font-bold text-red-600">{stats.high}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-600">{stats.active}</p>
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Suspended</p>
                    <p className="text-lg sm:text-xl font-bold text-red-600">{stats.suspended}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search merchants by name or email..."
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={filterRisk}
                  onChange={(e) => {
                    setFilterRisk(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  <option value="all">All Risks</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 inline mr-1" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading && merchants.length === 0 ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Merchant
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Risk Score
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Risk %
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Orders
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Revenue
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {merchants.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <Shield className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">No merchants found</p>
                                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          merchants.map((merchant) => (
                            <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 sm:px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">
                                    {merchant.businessName}
                                  </p>
                                  <div className="flex items-center text-sm text-gray-500 truncate max-w-[150px] sm:max-w-none">
                                    <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{merchant.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                {getRiskBadge(merchant.riskScore)}
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                <div className="flex items-center">
                                  <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className={`${(merchant.riskPercentage || 0) < 30
                                        ? 'bg-green-500'
                                        : (merchant.riskPercentage || 0) < 60
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                        } h-2 rounded-full transition-all`}
                                      style={{ width: `${Math.min(merchant.riskPercentage || 0, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{merchant.riskPercentage || 0}%</span>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                                <div className="flex items-center text-sm">
                                  <ShoppingBag className="w-4 h-4 text-gray-400 mr-1" />
                                  {merchant.orders || 0}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                                <div className="flex items-center text-sm">
                                  <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                                  ${(merchant.revenue || 0).toLocaleString()}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(merchant.status)}
                                  <select
                                    value={merchant.status}
                                    onChange={(e) => updateMerchantStatus(merchant.id, e.target.value)}
                                    disabled={actionLoading === merchant.id}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="suspended">Suspended</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => recalculateRisk(merchant.id)}
                                    disabled={actionLoading === merchant.id}
                                    className={`p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors ${actionLoading === merchant.id ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    title="Recalculate Risk"
                                  >
                                    <RefreshCw className={`w-4 h-4 ${actionLoading === merchant.id ? 'animate-spin' : ''}`} />
                                  </button>
                                  <button
                                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} merchants
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MerchantRiskList;