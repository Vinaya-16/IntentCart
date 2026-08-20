import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    User, 
    ChevronDown, 
    Camera, 
    Mail, 
    Phone, 
    Building, 
    Save, 
    ShieldCheck,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    WifiOff,
    RefreshCw,
    Cross,
    MoveRight
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from "./components/header.jsx";

const API_BASE_URI = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URI}/merchant` || 'http://localhost:5000/api/merchant';

const Profile = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isServerDown, setIsServerDown] = useState(false);
    
    // Profile Data
    const [profile, setProfile] = useState({
        id: '',
        username: '',
        email: '',
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        businessPhone: '',
        phone: '',
        avatarUrl: '',
        initials: 'MS',
        isApproved: false,
        merchantStatus: 'pending',
        createdAt: '',
        currency: 'Rupee (Rs.)',
        role: 'merchant'
    });

    // Password Form
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const getToken = () => localStorage.getItem('token');

    // Fetch merchant profile
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

            const response = await fetch(`${API_URL}/profile`, {
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
            if (data.success) {
                setProfile(data.profile);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
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

    // Update profile
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setSaving(false);
                return;
            }

            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessName: profile.businessName,
                    businessDescription: profile.businessDescription,
                    businessAddress: profile.businessAddress,
                    businessPhone: profile.businessPhone,
                    email: profile.email,
                    phone: profile.phone
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const data = await response.json();
            if (data.success) {
                setProfile(data.profile);
                setSuccess('Profile updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Change password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            setSaving(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            setSaving(false);
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setSaving(false);
                return;
            }

            const response = await fetch(`${API_URL}/change-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(passwordData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password');
            }

            const data = await response.json();
            if (data.success) {
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setSuccess('Password changed successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error changing password:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Update avatar
    const handleUpdateAvatar = async () => {
        const newAvatarUrl = prompt('Enter new avatar URL:', profile.avatarUrl || '');
        if (newAvatarUrl === null) return;

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
                body: JSON.stringify({ avatarUrl: newAvatarUrl })
            });

            if (!response.ok) {
                throw new Error('Failed to update avatar');
            }

            const data = await response.json();
            if (data.success) {
                setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
                setSuccess('Avatar updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error updating avatar:', err);
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const getStatusBadge = () => {
        switch (profile.merchantStatus) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending Approval
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e3a6a] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 p-8 overflow-y-auto space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-[#1e3a6a]">Account Settings</h1>
                            <button
                                onClick={fetchProfile}
                                className="p-2 text-gray-500 hover:text-[#1e3a6a] hover:bg-gray-100 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        {isServerDown && (
                            <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={fetchProfile}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {error && !isServerDown && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                                <Cross /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
                                <MoveRight /> {success}
                            </div>
                        )}

                        {/* PROFILE HEADER CARD */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-slate-200 text-[#0b2b61] flex items-center justify-center text-3xl font-bold border-2 border-slate-300 overflow-hidden">
                                    {profile.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt={profile.businessName} className="w-full h-full object-cover" />
                                    ) : (
                                        profile.initials
                                    )}
                                </div>
                                <button 
                                    onClick={handleUpdateAvatar}
                                    className="absolute bottom-0 right-0 p-2 bg-[#0b2b61] text-white rounded-full hover:bg-blue-900 transition-colors shadow"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-xl font-bold text-slate-800">{profile.businessName}</h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    Merchant ID: #{profile.id?.substring(0, 8) || 'N/A'}
                                </p>
                                <div className="mt-2">
                                    {getStatusBadge()}
                                </div>
                            </div>
                        </div>

                        {/* TABS */}
                        <div className="flex border-b border-slate-200 gap-6">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'general' ? 'text-[#1e3a6a]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                General Information
                                {activeTab === 'general' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1e3a6a]" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'security' ? 'text-[#1e3a6a]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Security & Password
                                {activeTab === 'security' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1e3a6a]" />}
                            </button>
                        </div>

                        {/* TAB CONTENT: GENERAL */}
                        {activeTab === 'general' && (
                            <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Store Name</label>
                                        <div className="relative">
                                            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={profile.businessName || ''}
                                                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="email"
                                                value={profile.email || ''}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={profile.phone || profile.businessPhone || ''}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Currency</label>
                                        <input
                                            type="text"
                                            value={profile.currency || 'Rupee (Rs.)'}
                                            disabled
                                            className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Business Address</label>
                                        <input
                                            type="text"
                                            value={profile.businessAddress || ''}
                                            onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                            placeholder="Enter your business address"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Business Description</label>
                                        <textarea
                                            value={profile.businessDescription || ''}
                                            onChange={(e) => setProfile({ ...profile, businessDescription: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none"
                                            placeholder="Describe your business"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-[#0b2b61] hover:bg-blue-900 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB CONTENT: SECURITY */}
                        {activeTab === 'security' && (
                            <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                <div className="max-w-md space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.current ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.new ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.confirm ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-start pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#0b2b61] hover:bg-blue-900 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {saving ? (
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
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Profile;