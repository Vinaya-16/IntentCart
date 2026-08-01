import React, { useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, UserCheck } from 'lucide-react';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');

    // Stats Data
    const stats = [
        { label: 'Total Users', value: '1,200', change: '+12%', icon: Users, isPositive: true },
        { label: 'Total Merchants', value: '1,300', change: '+5%', icon: UserCheck, isPositive: true },
        { label: 'Total Products', value: '1,200', change: '-2%', icon: ShoppingBag, isPositive: false },
        { label: 'Revenue', value: '$125,400', change: '+18%', icon: DollarSign, isPositive: true },
    ];

    return (
        <div className="flex h-screen bg-gray-50 text-slate-800 font-sans">

            {/* Sidebar */}
            <Sidebar activeTab='Dashboard'/>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

                {/* Header Section */}
                <Header />

                {/* Main Dashboard Body */}
                <main className="p-8 flex-1 bg-white">

                    {/* Main Title Section */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-[#1e2356]">
                            Overall System Progress
                        </h2>
                        <span className="text-sm text-sky-600 font-medium">
                            Thursday, July 30, 2026
                        </span>
                    </div>

                    {/* Stats Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
                                        <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                                        <span className={`inline-flex items-center text-xs font-semibold mt-2 ${stat.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {stat.change} <span className="text-slate-400 font-normal ml-1">vs last month</span>
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                                        <Icon className="w-6 h-6 text-[#1e2356]" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </main>
            </div>

        </div>
    );
};

export default AdminDashboard;