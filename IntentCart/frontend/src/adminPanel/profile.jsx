import React, { useState, useEffect } from 'react';
import {
    User,
    CheckCircle2,
    Edit,
    Bell,
    X,
    Camera,
    Lock,
    Check,
    Loader2,
    Cross,
    MoveRight
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const API_BASE_URI = import.meta.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URI}/admin` || 'http://localhost:5000/api/admin';

const Profile = () => {
    const [activeTab, setActiveTab] = useState('Profile');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Profile data state
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        stateZip: '',
        country: '',
        mobile: '',
        phone: '',
        dob: '',
        gender: '',
        created: '',
        account: '',
        totalRevenue: '$ 0',
        avgRevenueSize: '$ 0',
        avatarUrl: '',
    });

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ ...profileData });

    // Password Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [toastMessage, setToastMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Get token from localStorage
    const getToken = () => localStorage.getItem('token');

    // Fetch admin profile
    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError('');

            const token = getToken();
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/profile`, {
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

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            // console.log('Profile fetched:', data);

            if (data.success) {
                setProfileData(data.profile);
                setEditFormData(data.profile);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update profile
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setIsSaving(false);
                return;
            }

            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: editFormData.firstName,
                    lastName: editFormData.lastName,
                    address: editFormData.address,
                    city: editFormData.city,
                    stateZip: editFormData.stateZip,
                    country: editFormData.country,
                    mobile: editFormData.mobile,
                    phone: editFormData.phone,
                    dob: editFormData.dob,
                    gender: editFormData.gender
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const data = await response.json();
            // console.log('Profile updated:', data);

            if (data.success) {
                setProfileData(data.profile);
                setEditFormData(data.profile);
                setIsEditModalOpen(false);
                showToast('Profile updated successfully!');
                setSuccess('Profile updated successfully!');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Change password
    const handleSavePassword = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords don't match!");
            setIsSaving(false);
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setIsSaving(false);
                return;
            }

            const response = await fetch(`${API_URL}/change-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                    confirmPassword: passwordData.confirmPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password');
            }

            const data = await response.json();
            // console.log('Password changed:', data);

            if (data.success) {
                setIsPasswordModalOpen(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                showToast('Password changed successfully!');
                setSuccess('Password changed successfully!');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Update avatar
    const handleChangeAvatar = async () => {
        const newUrl = prompt('Enter image URL:', profileData.avatarUrl);
        if (!newUrl) return;

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                return;
            }

            const response = await fetch(`${API_URL}/avatar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avatarUrl: newUrl })
            });

            if (!response.ok) {
                throw new Error('Failed to update avatar');
            }

            const data = await response.json();
            // console.log('Avatar updated:', data);

            if (data.success) {
                setProfileData(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
                showToast('Profile picture updated!');
            }
        } catch (err) {
            console.error('Error updating avatar:', err);
            setError(err.message);
        }
    };

    // Handle Toast notification
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Fetch profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar activeTab="Profile" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e2356] border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">
            {/* Sidebar */}
            <Sidebar
                activeTab="Profile"
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
                    {/* Toast Notification */}
                    {toastMessage && (
                        <div className="fixed top-4 right-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-200 shadow-lg z-50 animate-slide-in">
                            {toastMessage}
                        </div>
                    )}

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                            <Cross /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                            <MoveRight /> {success}
                        </div>
                    )}

                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Top Bar inside Card */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-[#1e2356]">
                                Profile
                            </h2>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                                <span>Profile Verified</span>
                            </div>
                        </div>

                        {/* Profile Overview Banner */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
                            <div className="flex items-center gap-4">
                                {/* Profile Avatar with Hover Edit */}
                                <div className="relative group cursor-pointer" onClick={handleChangeAvatar}>
                                    <img
                                        src={profileData.avatarUrl}
                                        alt={`${profileData.firstName} ${profileData.lastName}`}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-xs group-hover:opacity-75 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {profileData.firstName} {profileData.lastName}
                                    </h3>
                                    <p className="text-xs font-medium text-gray-400">
                                        {profileData.email}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-12">
                                <div>
                                    <span className="text-xl font-bold text-gray-900 block">
                                        {profileData.totalRevenue || '$ 0'}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        Total Revenue
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold text-gray-900 block">
                                        {profileData.totalMerchants || 0}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        Total Merchants
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold text-gray-900 block">
                                        {profileData.totalCustomers || 0}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        Total Customers
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold text-gray-900 block">
                                        {profileData.avgRevenueSize || '$ 0'}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        Avg Revenue
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Admin Details Section */}
                        <div className="border border-gray-100 rounded-2xl p-6 shadow-xs bg-slate-50/30">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-100 rounded-full text-[#1e2356]">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-[#1e2356]">
                                        Admin Details
                                    </h3>
                                </div>

                                {/* Edit Button Trigger */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditFormData({ ...profileData });
                                        setIsEditModalOpen(true);
                                    }}
                                    className="text-emerald-500 hover:text-emerald-600 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                    title="Edit Profile"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Grid Form Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-xs sm:text-sm">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">First Name</span>
                                        <span className="font-semibold text-gray-800">{profileData.firstName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Last Name</span>
                                        <span className="font-semibold text-gray-800">{profileData.lastName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Address</span>
                                        <span className="font-semibold text-gray-800">{profileData.address}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">City</span>
                                        <span className="font-semibold text-gray-800">{profileData.city}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">State & zip</span>
                                        <span className="font-semibold text-gray-800">{profileData.stateZip}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Country</span>
                                        <span className="font-semibold text-gray-800">{profileData.country}</span>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Mobile</span>
                                        <span className="font-semibold text-gray-800">{profileData.mobile}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Phone</span>
                                        <span className="font-semibold text-gray-800">{profileData.phone}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">DOB</span>
                                        <span className="font-semibold text-gray-800">{profileData.dob}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Gender</span>
                                        <span className="font-semibold text-gray-800">{profileData.gender}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Created</span>
                                        <span className="font-semibold text-gray-800">{profileData.created}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-32 text-gray-400 font-medium">Account</span>
                                        <span className="font-semibold text-gray-800">{profileData.account}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Change Password Trigger */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="bg-[#1d2258] hover:bg-[#161a44] text-white px-6 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Change Password
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {/* EDIT PROFILE MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h3 className="text-lg font-bold text-[#1e2356]">Edit Profile Details</h3>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">First Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.firstName}
                                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">Last Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.lastName}
                                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">Mobile</label>
                                    <input
                                        type="text"
                                        value={editFormData.mobile}
                                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">Phone</label>
                                    <input
                                        type="text"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-500 mb-1 font-medium">Address</label>
                                <input
                                    type="text"
                                    value={editFormData.address}
                                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">City</label>
                                    <input
                                        type="text"
                                        value={editFormData.city}
                                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">State & Zip</label>
                                    <input
                                        type="text"
                                        value={editFormData.stateZip}
                                        onChange={(e) => setEditFormData({ ...editFormData, stateZip: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">Country</label>
                                    <input
                                        type="text"
                                        value={editFormData.country}
                                        onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">DOB</label>
                                    <input
                                        type="text"
                                        value={editFormData.dob}
                                        onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">Gender</label>
                                    <select
                                        value={editFormData.gender}
                                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 bg-[#1d2258] text-white rounded-lg font-semibold hover:bg-[#161a44] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CHANGE PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h3 className="text-lg font-bold text-[#1e2356]">Change Password</h3>
                            <button
                                type="button"
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePassword} className="space-y-4 text-xs sm:text-sm">
                            <div>
                                <label className="block text-gray-500 mb-1 font-medium">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-500 mb-1 font-medium">New Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-500 mb-1 font-medium">Confirm New Password</label>
                                <input
                                    type="password"
                                    required placeholder="••••••••"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1d2258]/30 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 bg-[#1d2258] text-white rounded-lg font-semibold hover:bg-[#161a44] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;