import React, { useState, useEffect } from 'react';
import {
    User, Phone, Mail, MapPin, Truck, Shield, Edit2, Save, X, Camera,
    Loader2, CheckCircle, AlertCircle, Calendar, Clock, Star, DollarSign,
    Package, ChevronRight, Settings, Bell, Globe, LogOut, ChevronDown,
    WifiOff, RefreshCw, Navigation, Briefcase, Clipboard, BarChart3,
    Target, TrendingUp, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

const API = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${API}/shipping` || 'http://localhost:5000/api/shipping';

const ShipperProfile = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [isServerDown, setIsServerDown] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    // Profile data state - matches backend schema
    const [profile, setProfile] = useState({
        _id: '',
        name: '',
        username: '',
        email: '',
        phone: '',
        role: 'shipper',
        avatarUrl: '',
        isApproved: false,
        createdAt: new Date(),
        shipperDetails: {
            vehicleNumber: '',
            licenseNumber: '',
            experience: 0,
            rating: 0,
            totalDeliveries: 0,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            currentStatus: 'offline',
            assignedOrders: [],
            branch: '',
            assignedRegion: '',
            lastLocation: {
                type: 'Point',
                coordinates: [0, 0],
                updatedAt: null
            }
        },
    });

    // Dashboard stats from backend
    const [dashboardStats, setDashboardStats] = useState({
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: 0,
        rating: 0,
        currentStatus: 'offline',
        assignedOrders: 0,
        performance: {
            onTimeDelivery: 0,
            averageDeliveryTime: 0,
            customerRating: 0,
            totalEarnings: 0,
            weeklyEarnings: 0
        }
    });

    const [editForm, setEditForm] = useState({});

    const getToken = () => localStorage.getItem('token');

    // Fetch profile data
    const fetchProfile = async () => {
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

            const response = await fetch(`${API_BASE_URL}/shipper/profile`, {
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch profile');
            }

            const data = await response.json();

            if (data.success) {
                setProfile(data.shipper);
                setEditForm(data.shipper);
                // Also fetch dashboard stats
                await fetchDashboardStats();
            } else {
                setError(data.message || 'Failed to load profile');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            if (err.message === 'Failed to fetch' || err.message.includes('ERR_CONNECTION_REFUSED')) {
                setIsServerDown(true);
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError(err.message);
            }
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/shipper/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDashboardStats(data.stats);
                }
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        }
    };

    // Update profile
    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setSaving(false);
                return;
            }

            const updateData = {
                name: editForm.name || '',
                phone: editForm.phone || '',
                vehicleNumber: editForm.shipperDetails?.vehicleNumber || '',
                licenseNumber: editForm.shipperDetails?.licenseNumber || '',
                experience: parseInt(editForm.shipperDetails?.experience) || 0,
                branch: editForm.shipperDetails?.branch || '',
                assignedRegion: editForm.shipperDetails?.assignedRegion || ''
            };

            const response = await fetch(`${API_BASE_URL}/shipper/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const data = await response.json();

            if (data.success) {
                setProfile(data.shipper);
                setSuccess('Profile updated successfully!');
                toast.success('Profile updated successfully!');
                setEditMode(false);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Update status
    const handleStatusChange = async (status) => {
        try {
            const token = getToken();
            if (!token) {
                toast.error('Please login first');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/shipper/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update status');
            }

            const data = await response.json();

            if (data.success) {
                setProfile(prev => ({
                    ...prev,
                    shipperDetails: {
                        ...prev.shipperDetails,
                        currentStatus: status
                    }
                }));
                setDashboardStats(prev => ({
                    ...prev,
                    currentStatus: status
                }));
                toast.success(`Status updated to ${status}`);
                setShowStatusMenu(false);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error(err.message || 'Failed to update status');
        }
    };

    // Update location
    const handleUpdateLocation = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const token = getToken();

                    if (!token) {
                        toast.error('Please login first');
                        setLocationLoading(false);
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/shipper/location`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ latitude, longitude })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Failed to update location');
                    }

                    const data = await response.json();

                    if (data.success) {
                        setProfile(prev => ({
                            ...prev,
                            shipperDetails: {
                                ...prev.shipperDetails,
                                lastLocation: data.location
                            }
                        }));
                        toast.success('Location updated successfully!');
                    }
                } catch (err) {
                    console.error('Error updating location:', err);
                    toast.error(err.message || 'Failed to update location');
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                toast.error('Unable to get your location. Please enable location services.');
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/intentCart-auth');
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Status badge config
    const statusConfig = {
        available: { label: 'Available', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
        busy: { label: 'Busy', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
        offline: { label: 'Offline', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
        on_break: { label: 'On Break', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' }
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.offline;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        );
    };

    const statusOptions = [
        { value: 'available', label: 'Available' },
        { value: 'busy', label: 'Busy' },
        { value: 'on_break', label: 'On Break' },
        { value: 'offline', label: 'Offline' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-3 text-gray-600 text-sm font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    const shipperDetails = profile.shipperDetails || {};
    const performanceMetrics = profile.performanceMetrics || {};
    const currentStatus = shipperDetails.currentStatus || 'offline';
    // Use dashboard stats if available, fallback to profile data
    const stats = dashboardStats.performance || performanceMetrics;

    return (
        <div className="h-screen w-full flex flex-col bg-slate-50/60 font-sans text-slate-800 overflow-hidden">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar
                    activeTab="Shipping Dashboard"
                    onSelectTab={(tab) => {
                        if (tab === 'Dashboard' || tab === 'Shipping Dashboard') {
                            navigate('/shipping-dashboard');
                        }
                    }}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shipper Profile</h1>
                                <p className="text-xs sm:text-sm text-gray-500">Manage your profile and delivery settings</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                {!editMode && (
                                    <>
                                        <button
                                            onClick={handleUpdateLocation}
                                            disabled={locationLoading}
                                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
                                        >
                                            {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                            <span>Update Location</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditForm(profile);
                                                setEditMode(true);
                                            }}
                                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition shadow-sm"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            <span>Edit Profile</span>
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="hidden sm:inline">Logout</span>
                                        </button>
                                    </>
                                )}
                                {editMode && (
                                    <button
                                        onClick={() => {
                                            setEditMode(false);
                                            setEditForm(profile);
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel Editing
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {isServerDown ? <WifiOff className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                                    <span>{error}</span>
                                </div>
                                {isServerDown && (
                                    <button onClick={fetchProfile} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1 transition">
                                        <RefreshCw className="w-3 h-3" />
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg border border-green-200 flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                            {/* Profile Header */}
                            <div className="p-4 sm:p-6 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-blue-50 shadow-inner">
                                        {profile.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                            <h2 className="text-xl font-bold text-gray-900 truncate">{profile.name || profile.username}</h2>
                                            {getStatusBadge(currentStatus)}
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${profile.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {profile.isApproved ? 'Approved' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5 truncate">{profile.email}</p>
                                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 flex-wrap text-xs text-gray-400">
                                            <span>ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{profile._id?.slice(-8) || 'N/A'}</code></span>
                                            <span>•</span>
                                            <span>Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Control */}
                            <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700">Change Availability:</span>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 text-xs sm:text-sm font-medium flex items-center gap-2 transition shadow-sm"
                                        >
                                            <span>Set Status</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                        {showStatusMenu && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                                                <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-20 py-1">
                                                    {statusOptions.map(option => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => handleStatusChange(option.value)}
                                                            className="w-full px-3 py-2 text-xs sm:text-sm text-left hover:bg-slate-50 transition flex items-center gap-2.5 font-medium text-gray-700"
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${option.value === 'available' ? 'bg-green-500' : option.value === 'busy' ? 'bg-yellow-500' : option.value === 'on_break' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {shipperDetails.lastLocation?.coordinates && shipperDetails.lastLocation.coordinates[0] !== 0 && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                        <span>GPS: {shipperDetails.lastLocation.coordinates[1]?.toFixed(4)}, {shipperDetails.lastLocation.coordinates[0]?.toFixed(4)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Profile Form / Details */}
                            <div className="p-4 sm:p-6">
                                <form onSubmit={handleUpdateProfile}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {/* Left Column */}
                                        <div className="space-y-3">
                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.name || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 mt-1">{profile.name || '-'}</p>
                                                )}
                                            </div>

                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                                                <p className="text-sm font-medium text-gray-800 mt-1">{profile.email || '-'}</p>
                                            </div>

                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</label>
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.phone || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 mt-1">{profile.phone || '-'}</p>
                                                )}
                                            </div>

                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle Number</label>
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.shipperDetails?.vehicleNumber || ''}
                                                        onChange={(e) => setEditForm({
                                                            ...editForm,
                                                            shipperDetails: { ...editForm.shipperDetails, vehicleNumber: e.target.value }
                                                        })}
                                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 mt-1">{shipperDetails.vehicleNumber || '-'}</p>
                                                )}
                                            </div>

                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">License Number</label>
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.shipperDetails?.licenseNumber || ''}
                                                        onChange={(e) => setEditForm({
                                                            ...editForm,
                                                            shipperDetails: { ...editForm.shipperDetails, licenseNumber: e.target.value }
                                                        })}
                                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 mt-1">{shipperDetails.licenseNumber || '-'}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-3">
                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Experience (Years)</label>
                                                {editMode ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editForm.shipperDetails?.experience ?? ''}
                                                        onChange={(e) => setEditForm({
                                                            ...editForm,
                                                            shipperDetails: { ...editForm.shipperDetails, experience: e.target.value }
                                                        })}
                                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 mt-1">{shipperDetails.experience ? `${shipperDetails.experience} Years` : '-'}</p>
                                                )}
                                            </div>

                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Branch</label>
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.shipperDetails?.branch || ''}
                                                        onChange={(e) => setEditForm({
                                                            ...editForm,
                                                            shipperDetails: { ...editForm.shipperDetails, branch: e.target.value }
                                                        })}
                                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 mt-1">{shipperDetails.branch || '-'}</p>
                                                )}
                                            </div>

                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Region</label>
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.shipperDetails?.assignedRegion || ''}
                                                        onChange={(e) => setEditForm({
                                                            ...editForm,
                                                            shipperDetails: { ...editForm.shipperDetails, assignedRegion: e.target.value }
                                                        })}
                                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 mt-1">{shipperDetails.assignedRegion || '-'}</p>
                                                )}
                                            </div>

                                            <div className="py-2 border-b border-gray-100">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username & Role</label>
                                                <p className="text-sm font-medium text-gray-800 mt-1">{profile.username || '-'} <span className="text-xs text-gray-400 font-normal">({profile.role || 'shipper'})</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit Mode Actions */}
                                    {editMode && (
                                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditMode(false);
                                                    setEditForm(profile);
                                                }}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Save Changes
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ShipperProfile;