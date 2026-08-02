import React, { useState } from 'react';
import { Bell, User, ChevronDown, Search } from 'lucide-react';
import Sidebar from './components/sidebar.jsx'; 
import Header from './components/Header.jsx';

const CustomerAnalysis = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Sample Customer Data matching the image
    const customers = [
        { id: 'CT-123', name: 'Emilt C.', email: 'emilyC@gmail.com', totalOrders: 4, lifetimeValue: '12,000', lastPurchase: '2026-7-2', segment: 'Top Tier' },
        { id: 'CT-123', name: 'Vinaya P.', email: 'emilyC@gmail.com', totalOrders: 4, lifetimeValue: '12,000', lastPurchase: '2026-7-2', segment: 'Top Tier' },
        { id: 'CT-123', name: 'Mithila K.', email: 'emilyC@gmail.com', totalOrders: 4, lifetimeValue: '12,000', lastPurchase: '2026-7-2', segment: 'Middle Tier' },
        { id: 'CT-123', name: 'Tanisha B.', email: 'emilyC@gmail.com', totalOrders: 4, lifetimeValue: '12,000', lastPurchase: '2026-7-2', segment: 'Bottom Tier' },
    ];

    // Filter customers by Name, Email, or ID
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Badge styling for Customer Segments
    const getSegmentStyle = (segment) => {
        switch (segment) {
            case 'Top Tier':
                return 'text-emerald-500 font-bold';
            case 'Middle Tier':
                return 'text-amber-500 font-bold';
            case 'Bottom Tier':
                return 'text-red-500 font-bold';
            default:
                return 'text-slate-600 font-semibold';
        }
    };

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
                    {/* DASHBOARD BODY */}
                    <main className="flex-1 p-8 overflow-y-auto">

                        {/* STATS CARDS SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Customers</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">12,800</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Avg Customer LTV</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">Rs. 24,500</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">New Customer SignUps</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">50</p>
                            </div>
                        </div>

                        {/* PAGE TITLE */}
                        <h1 className="text-2xl font-bold text-[#1e3a6a] mb-6">Customer Analysis</h1>

                        {/* SEARCH & ACTION BAR */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="relative w-full sm:w-96">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                />
                            </div>

                            <button className="w-full sm:w-auto bg-[#0b2b61] hover:bg-blue-900 text-white font-medium px-6 py-2 rounded-lg text-sm shadow transition-colors">
                                View Data
                            </button>
                        </div>

                        {/* CUSTOMER TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#a8c5da] text-[#1e3a6a] text-xs font-bold uppercase tracking-wider">
                                            <th className="py-3.5 px-4 text-center">Customer Id</th>
                                            <th className="py-3.5 px-4">Customer Name</th>
                                            <th className="py-3.5 px-4">Email</th>
                                            <th className="py-3.5 px-4 text-center">Total Orders</th>
                                            <th className="py-3.5 px-4 text-center">Lifetime Value</th>
                                            <th className="py-3.5 px-4 text-center">Last Purchase</th>
                                            <th className="py-3.5 px-4 text-center">Customer Segment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((customer, index) => (
                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                        {customer.id}
                                                    </td>
                                                    <td className="py-4 px-4 font-bold text-slate-800">
                                                        {customer.name}
                                                    </td>
                                                    <td className="py-4 px-4 font-medium text-slate-800">
                                                        {customer.email}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                        {customer.totalOrders}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-slate-800">
                                                        {customer.lifetimeValue}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-slate-800">
                                                        {customer.lastPurchase}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className={getSegmentStyle(customer.segment)}>
                                                            {customer.segment}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-6 text-slate-500">
                                                    No customers found matching "{searchTerm}"
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default CustomerAnalysis;