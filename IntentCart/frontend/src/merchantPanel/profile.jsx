import React, { useState } from 'react';
import { Bell, User, ChevronDown, Camera, Mail, Phone, Building, Save, ShieldCheck } from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from "./components/header.jsx";

const Profile = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">

            {/* 2. Header placed at the top (full width) */}
            <Header />

            {/* 3. Row layout below Header for Sidebar + Main Content */}
            <div className="flex flex-1 overflow-hidden">

                {/* 4. Sidebar pinned on the left */}
                <Sidebar />

                {/* 5. Main Content takes up remaining space */}
                <div className="flex-1 overflow-y-auto">
                    {/* CONTENT */}
                    <main className="flex-1 p-8 overflow-y-auto space-y-6">
                        <h1 className="text-2xl font-bold text-[#1e3a6a]">Account Settings</h1>

                        {/* PROFILE HEADER CARD */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-slate-200 text-[#0b2b61] flex items-center justify-center text-3xl font-bold border-2 border-slate-300">
                                    MS
                                </div>
                                <button className="absolute bottom-0 right-0 p-2 bg-[#0b2b61] text-white rounded-full hover:bg-blue-900 transition-colors shadow">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-xl font-bold text-slate-800">Merchant Store</h2>
                                <p className="text-xs text-slate-500 font-medium">Verified Merchant • Merchant ID: #MC-9920</p>
                                <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Account Verified
                                </div>
                            </div>
                        </div>

                        {/* TABS */}
                        <div className="flex border-b border-slate-200 gap-6">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'general' ? 'text-[#1e3a6a]' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                General Information
                                {activeTab === 'general' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1e3a6a]" />}
                            </button>

                            <button
                                onClick={() => setActiveTab('security')}
                                className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'security' ? 'text-[#1e3a6a]' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Security & Password
                                {activeTab === 'security' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1e3a6a]" />}
                            </button>
                        </div>

                        {/* TAB CONTENT: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Store Name</label>
                                        <div className="relative">
                                            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                defaultValue="Merchant Store S."
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="email"
                                                defaultValue="merchant.s@example.com"
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                defaultValue="+91 98765 43210"
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Currency</label>
                                        <input
                                            type="text"
                                            defaultValue="Rupee (Rs.)"
                                            disabled
                                            className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button className="flex items-center gap-2 bg-[#0b2b61] hover:bg-blue-900 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow transition-colors">
                                        <Save className="w-4 h-4" /> Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: SECURITY */}
                        {activeTab === 'security' && (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                <div className="max-w-md space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-start pt-4 border-t border-slate-100">
                                    <button className="bg-[#0b2b61] hover:bg-blue-900 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow transition-colors">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

            </div>
        </div>
    );
};

export default Profile;