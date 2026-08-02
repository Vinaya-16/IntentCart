import React, { useState } from 'react';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    RefreshCw,
    Megaphone,
    Bell,
    User,
    ChevronDown,
    Search,
    Plus,
    Pencil,
    Trash2
} from 'lucide-react';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Sample Product Data
    const products = [
        { id: 1, name: 'Running Shoes', category: 'Shoes', status: 'In Stock', price: 'Rs. 220', orders: '1,240' },
        { id: 2, name: 'Smart Watch', category: 'Watch', status: 'Low Stock', price: 'Rs. 220', orders: '1,240' },
        { id: 3, name: 'Pillow Cover', category: 'Home&Living', status: 'Out Of Stock', price: 'Rs. 220', orders: '1,240' },
    ];

    // Filter products based on search
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'In Stock':
                return <span className="text-emerald-500 font-semibold">In Stock</span>;
            case 'Low Stock':
                return <span className="text-amber-500 font-semibold">Low Stock</span>;
            case 'Out Of Stock':
                return <span className="text-red-500 font-semibold">Out Of Stock</span>;
            default:
                return <span>{status}</span>;
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
                    {/* CONTENT AREA */}
                    <main className="flex-1 p-8 overflow-y-auto">

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Card 1 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Products</h3>
                                <p className="text-3xl font-extrabold text-[#1e427b]">2,540</p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Out Of Stock Items</h3>
                                <p className="text-3xl font-extrabold text-[#1e427b]">18</p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Inventory Value</h3>
                                <p className="text-3xl font-extrabold text-[#1e427b]">Rs. 150,000</p>
                            </div>
                        </div>

                        {/* PAGE HEADING */}
                        <h1 className="text-2xl font-bold text-[#1e427b] mb-6">Product Management</h1>

                        {/* ACTION BAR (SEARCH & ADD) */}
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

                            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0f2d5c] hover:bg-blue-900 text-white font-medium px-4 py-2 rounded-lg text-sm shadow transition-colors">
                                <Plus className="w-4 h-4" />
                                Add New Product
                            </button>
                        </div>

                        {/* PRODUCTS TABLE */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#2c5282] text-white text-xs font-semibold uppercase tracking-wider">
                                            <th className="py-3 px-4">Image</th>
                                            <th className="py-3 px-4">Product Name</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4 text-center">Inventory Status</th>
                                            <th className="py-3 px-4 text-center">Price</th>
                                            <th className="py-3 px-4 text-center">Orders</th>
                                            <th className="py-3 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="w-12 h-8 bg-slate-300 rounded-sm"></div>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                        {product.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        {product.category}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {getStatusBadge(product.status)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-medium text-slate-800">
                                                        {product.price}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-700">
                                                        {product.orders}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button className="text-slate-700 hover:text-blue-600 transition-colors">
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button className="text-slate-700 hover:text-red-600 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-6 text-slate-500">
                                                    No products found matching "{searchTerm}"
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

export default Dashboard;