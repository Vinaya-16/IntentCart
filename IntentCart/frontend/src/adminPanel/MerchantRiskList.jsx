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
  X
} from 'lucide-react';
import Header from './components/header';
import Sidebar from './components/sidebar';

const API_BASE_URL = 'http://localhost:5000/api/admin';

const MerchantRiskList = () => {
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

  // Missing states added
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Merchant Verification');

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
        throw new Error('Server returned non-JSON response. Ensure backend is running on port 5000.');
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
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
      alert(`Failed to load merchants: ${error.message}`);
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
    if (!window.confirm(`Are you sure you want to ${status} this merchant?`)) {
      return;
    }

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
        alert(`Merchant status updated to ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating merchant status:', error);
      alert('Failed to update merchant status. Please try again.');
    }
  };

  // Recalculate risk
  const recalculateRisk = async (merchantId) => {
    if (!window.confirm('Recalculate risk score for this merchant?')) {
      return;
    }

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
        alert('Risk score recalculated successfully!');
      }
    } catch (error) {
      console.error('Error recalculating risk:', error);
      alert('Failed to recalculate risk score. Please try again.');
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

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setFilterRisk('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
      <Sidebar
        activeTab={"Risk Management"}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-8 flex-1 bg-white space-y-6">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                Risk Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor merchant risk scores and manage merchant status
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Low Risk</p>
                    <p className="text-xl font-bold text-green-600">{stats.low}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Medium Risk</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.medium}</p>
                  </div>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">High Risk</p>
                    <p className="text-xl font-bold text-red-600">{stats.high}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-xl font-bold text-blue-600">{stats.active}</p>
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Suspended</p>
                    <p className="text-xl font-bold text-red-600">{stats.suspended}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search merchants by name or email..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: 1 }));
                    fetchMerchants();
                  }}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading && merchants.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">Loading merchants...</p>
                        </td>
                      </tr>
                    ) : merchants.length === 0 ? (
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
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{merchant.businessName}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Mail className="w-3 h-3 mr-1" />
                                {merchant.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getRiskBadge(merchant.riskScore)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`${merchant.riskPercentage < 30 ? 'bg-green-500' : merchant.riskPercentage < 60 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full transition-all`}
                                  style={{ width: `${Math.min(merchant.riskPercentage || 0, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{merchant.riskPercentage || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm">
                              <ShoppingBag className="w-4 h-4 text-gray-400 mr-1" />
                              {merchant.orders || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              ${(merchant.revenue || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={merchant.status}
                              onChange={(e) => updateMerchantStatus(merchant.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => recalculateRisk(merchant.id)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Recalculate Risk"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              Refresh
                              {/* <button
                                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button> */}
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
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} merchants
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MerchantRiskList;