import React, { useState } from 'react';
import {
    Bell,
    User,
    ChevronDown,
    Search,
    Plus,
    Eye,
    Printer
} from 'lucide-react';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const OrderManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Sample Order Data matching the image
    const orders = [
        { id: 'OD-123', customer: 'Emilt C.', date: '2026-7-2', quantity: 4, amount: '12,000', status: 'Paid', fulfillment: 'Shipped' },
        { id: 'OD-123', customer: 'Emilt C.', date: '2026-7-2', quantity: 4, amount: '12,000', status: 'Paid', fulfillment: 'Processing' },
        { id: 'OD-123', customer: 'Emilt C.', date: '2026-7-2', quantity: 4, amount: '12,000', status: 'Paid', fulfillment: 'Shipped' },
        { id: 'OD-123', customer: 'Emilt C.', date: '2026-7-2', quantity: 4, amount: '12,000', status: 'Not paid', fulfillment: 'Cancelled' },
    ];

    // Filter orders by ID or Customer Name
    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status Styling Helpers
    const getPaymentStatusStyle = (status) => {
        return status === 'Paid'
            ? 'text-emerald-500 font-semibold'
            : 'text-emerald-500 font-semibold leading-tight'; // Handles multi-line 'Not paid' badge style
    };

    const getFulfillmentStatusStyle = (status) => {
        switch (status) {
            case 'Shipped':
                return 'text-sky-500 font-semibold';
            case 'Processing':
                return 'text-amber-500 font-semibold';
            case 'Cancelled':
                return 'text-red-500 font-semibold';
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
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Pending Orders</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">11</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Completed Orders</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">10</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Avg Order Value</h3>
                                <p className="text-3xl font-extrabold text-[#1e3a6a]">Rs. 10,000</p>
                            </div>
                        </div>

                        {/* PAGE TITLE */}
                        <h1 className="text-2xl font-bold text-[#1e3a6a] mb-6">Order Management</h1>

                        {/* SEARCH & ACTIONS BAR */}
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

                            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0b2b61] hover:bg-blue-900 text-white font-medium px-4 py-2 rounded-lg text-sm shadow transition-colors">
                                <Plus className="w-4 h-4" />
                                Create New Order
                            </button>
                        </div>

                        {/* ORDERS TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#a8c5da] text-[#1e3a6a] text-xs font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4">Order Id</th>
                                            <th className="py-3 px-4">Customer Name</th>
                                            <th className="py-3 px-4">Order Date</th>
                                            <th className="py-3 px-4 text-center">Quantity</th>
                                            <th className="py-3 px-4 text-center">Amount</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4 text-center">Fulfillment Status</th>
                                            <th className="py-3 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order, index) => (
                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-4 font-semibold text-slate-800">
                                                        {order.id}
                                                    </td>
                                                    <td className="py-4 px-4 font-semibold text-slate-800">
                                                        {order.customer}
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-700 font-medium">
                                                        {order.date}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                        {order.quantity}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-semibold text-slate-800">
                                                        {order.amount}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className={order.status === 'Paid' ? 'text-emerald-500 font-semibold' : 'text-emerald-600 font-semibold block leading-tight'}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className={getFulfillmentStatusStyle(order.fulfillment)}>
                                                            {order.fulfillment}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button className="text-[#1e3a6a] hover:opacity-75 transition-opacity">
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                            <button className="text-[#1e3a6a] hover:opacity-75 transition-opacity">
                                                                <Printer className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-6 text-slate-500">
                                                    No orders found matching "{searchTerm}"
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

export default OrderManagement;