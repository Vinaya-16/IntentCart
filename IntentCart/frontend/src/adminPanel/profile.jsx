import React, { useState } from 'react';
import {
    User,
    CheckCircle2,
    Edit,
    Bell,
    X,
    Camera,
    Lock,
    Check
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const Profile = () => {
    const [activeTab, setActiveTab] = useState('Profile');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Profile data state
    const [profileData, setProfileData] = useState({
        firstName: 'Arjun',
        lastName: 'Sharma',
        email: 'arjunSharma@gmail.com',
        address: '55 Road Wai1',
        city: 'Mumbai',
        stateZip: 'Maharashtra, 400075',
        country: 'India',
        mobile: '99656788765',
        phone: '456789878',
        dob: '10/04/2008',
        gender: 'Male',
        created: 'June 21, 2026',
        account: 'Donor',
        totalRevenue: '$ 37,450',
        avgRevenueSize: '$ 12,850',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
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

    // Handle Toast notification
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Save Profile Edits
    const handleSaveProfile = (e) => {
        e.preventDefault();
        setProfileData(editFormData);
        setIsEditModalOpen(false);
        showToast('Profile updated successfully!');
    };

    // Save New Password
    const handleSavePassword = (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords don't match!");
            return;
        }
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('Password changed successfully!');
    };

    // Change Profile Picture
    const handleChangeAvatar = () => {
        const newUrl = prompt('Enter image URL:', profileData.avatarUrl);
        if (newUrl) {
            setProfileData((prev) => ({ ...prev, avatarUrl: newUrl }));
            showToast('Profile picture updated!');
        }
    };

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
                                        {profileData.totalRevenue}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        Total Revenue
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold text-gray-900 block">
                                        {profileData.avgRevenueSize}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        Avg Revenue Size
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
                                    className="px-5 py-2 bg-[#1d2258] text-white rounded-lg font-semibold hover:bg-[#161a44]"
                                >
                                    Save Changes
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
                                    required
                                    placeholder="••••••••"
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
                                    className="px-5 py-2 bg-[#1d2258] text-white rounded-lg font-semibold hover:bg-[#161a44]"
                                >
                                    Update Password
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