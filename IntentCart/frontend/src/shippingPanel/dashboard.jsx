import React, { useState, useMemo } from 'react';
import {
    Package,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    RefreshCw,
    Search,
    X,
    RotateCcw
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from 'recharts';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

const INITIAL_STATS = {
    totalOrders: 1250,
    processing: 320,
    packed: 210,
    readyForPickup: 180,
    inTransit: 350,
    outForDelivery: 140,
    delayed: 50,
    returns: 12
};

const MOCK_ORDERS = [
    { id: 'ORD-10245', customer: 'Rahul Sharma', product: 'Nike Air Max', qty: 1, address: 'Mumbai, MH', payment: 'Paid', status: 'Processing', date: '2026-08-14', total: 5499 },
    { id: 'ORD-10246', customer: 'Priya Singh', product: 'Samsung Galaxy S24', qty: 1, address: 'Delhi, DL', payment: 'Paid', status: 'Packed', date: '2026-08-14', total: 79999 },
    { id: 'ORD-10247', customer: 'Amit Kumar', product: 'Godrej Sofa', qty: 1, address: 'Bangalore, KA', payment: 'COD', status: 'Ready for Pickup', date: '2026-08-13', total: 12000 },
    { id: 'ORD-10248', customer: 'Sneha Patel', product: 'Dell Inspiron Laptop', qty: 1, address: 'Pune, MH', payment: 'Paid', status: 'In Transit', date: '2026-08-13', total: 64990 },
    { id: 'ORD-10249', customer: 'Rohan Mehta', product: 'DANCING CACTUS Toy', qty: 2, address: 'Chennai, TN', payment: 'Paid', status: 'Out for Delivery', date: '2026-08-12', total: 1340 },
    { id: 'ORD-10250', customer: 'Kavya Nair', product: 'Beige Blackout Curtains', qty: 1, address: 'Kochi, KL', payment: 'Paid', status: 'Delivered', date: '2026-08-12', total: 999 },
    { id: 'ORD-10251', customer: 'Rajesh Gupta', product: 'Office Desk', qty: 1, address: 'Jaipur, RJ', payment: 'COD', status: 'Delayed', date: '2026-08-10', total: 24000 },
    { id: 'ORD-10252', customer: 'Ananya Joshi', product: 'Manscaped Trimmer', qty: 1, address: 'Lucknow, UP', payment: 'Paid', status: 'Return Requested', date: '2026-08-09', total: 450 },
];

const STATUS_COLORS = {
    'Processing': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'Packed': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    'Ready for Pickup': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    'In Transit': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    'Out for Delivery': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    'Delivered': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Delayed': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Return Requested': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' }
};

const STATS_COLORS = {
    'Processing': { color: '#2a1a6f', icon: Clock },
    'Packed': { color: '#0284c7', icon: Package },
    'Ready for Pickup': { color: '#7c3aed', icon: Truck },
    'In Transit': { color: '#d97706', icon: Truck },
    'Out for Delivery': { color: '#0d9488', icon: CheckCircle },
    'Delayed': { color: '#dc2626', icon: AlertCircle },
    'Returns': { color: '#db2777', icon: RotateCcw }
};

const CHART_COLORS = ['#2a1a6f', '#0284c7', '#7c3aed', '#d97706', '#0d9488', '#dc2626'];

const ShippingDashboard = () => {
    const [activeTab, setActiveTab] = useState('Shipping Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [orders, setOrders] = useState(MOCK_ORDERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesStatus = filterStatus === 'All' ? true : order.status === filterStatus;
            const matchesSearch = 
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.product.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [orders, searchQuery, filterStatus]);

    const pieData = [
        { name: 'Processing', value: INITIAL_STATS.processing },
        { name: 'Packed', value: INITIAL_STATS.packed },
        { name: 'Ready for Pickup', value: INITIAL_STATS.readyForPickup },
        { name: 'In Transit', value: INITIAL_STATS.inTransit },
        { name: 'Out for Delivery', value: INITIAL_STATS.outForDelivery },
        { name: 'Delayed', value: INITIAL_STATS.delayed },
    ];

    const statusFilters = ['All', 'Processing', 'Packed', 'Ready for Pickup', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Return Requested'];

    const handleUpdateStatus = (newStatus) => {
        if (!selectedOrder) return;
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
        setShowTrackingModal(false);
    };

    const renderStatCard = (key, label, value) => {
        const Icon = STATS_COLORS[key]?.icon || Package;
        return (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-[#1e2356]">{value}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${STATS_COLORS[key]?.color}15`, color: STATS_COLORS[key]?.color }}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            
            <div className="flex flex-1 overflow-hidden">
                <Sidebar 
                    activeTab={activeTab} 
                    onSelectTab={setActiveTab}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
                
                <div className="flex-1 overflow-y-auto">
                    <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
                        {/* HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-[#1e2356]">{activeTab}</h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage order fulfillment, tracking, and returns.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs sm:text-sm text-sky-700 font-medium bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <button className="p-2 text-slate-500 hover:text-[#1e2356] hover:bg-slate-200/60 rounded-lg transition-colors border border-slate-200">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                            {renderStatCard('Processing', 'Processing', INITIAL_STATS.processing)}
                            {renderStatCard('Packed', 'Packed', INITIAL_STATS.packed)}
                            {renderStatCard('Ready for Pickup', 'Ready', INITIAL_STATS.readyForPickup)}
                            {renderStatCard('In Transit', 'In Transit', INITIAL_STATS.inTransit)}
                            {renderStatCard('Out for Delivery', 'Delivery', INITIAL_STATS.outForDelivery)}
                            {renderStatCard('Delayed', 'Delayed', INITIAL_STATS.delayed)}
                            {renderStatCard('Returns', 'Returns', INITIAL_STATS.returns)}
                        </div>

                        {/* PIE CHART SECTION */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-8">
                            <div className="w-full lg:w-1/2 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">Today's Shipments Overview</h3>
                                <div className="h-52 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-medium text-slate-700 pt-4 border-t lg:border-t-0 lg:pt-0 border-slate-100">
                                {pieData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                        <span className="truncate">{item.name}</span>
                                        <span className="text-slate-400 ml-auto font-semibold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ORDER TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Order ID, Customer, Product..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e2356]/20 focus:border-[#1e2356] transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-thin">
                                    {statusFilters.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setFilterStatus(status)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                                                filterStatus === status
                                                    ? 'bg-[#1e2356] text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                            <th className="py-3 px-4">Order ID</th>
                                            <th className="py-3 px-4">Customer</th>
                                            <th className="py-3 px-4">Product</th>
                                            <th className="py-3 px-4 text-center">Qty</th>
                                            <th className="py-3 px-4">Total</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{order.id}</td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-medium text-slate-800">{order.customer}</div>
                                                        <div className="text-xs text-slate-400">{order.address}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600">{order.product}</td>
                                                    <td className="py-3.5 px-4 text-center text-slate-600">{order.qty}</td>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-800">₹{order.total.toLocaleString()}</td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status]?.bg || 'bg-slate-100'} ${STATUS_COLORS[order.status]?.text || 'text-slate-700'} ${STATUS_COLORS[order.status]?.border || 'border-slate-200'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <button
                                                            onClick={() => { setSelectedOrder(order); setShowTrackingModal(true); }}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-[#1e2356] hover:text-white rounded-lg transition-colors"
                                                        >
                                                            Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-slate-400 text-sm">
                                                    No orders found matching your search parameters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                                <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Time</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Delayed</span>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* MODAL: Shipment Management */}
            {showTrackingModal && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-[#1e2356]">Update Shipment Status</h3>
                                <p className="text-xs text-slate-500">Order ID: <span className="font-semibold text-slate-800">{selectedOrder.id}</span></p>
                            </div>
                            <button onClick={() => setShowTrackingModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <label className="block font-semibold text-slate-500 mb-0.5">Customer</label>
                                    <p className="font-medium text-slate-800 text-sm">{selectedOrder.customer}</p>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-500 mb-0.5">Delivery Address</label>
                                    <p className="font-medium text-slate-800 text-sm">{selectedOrder.address}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-3">Select New Status</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {['Packed', 'Ready for Pickup', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateStatus(status)}
                                            className={`px-3 py-2.5 border rounded-lg text-xs font-medium transition-all ${
                                                selectedOrder.status === status
                                                    ? 'bg-[#1e2356] text-white border-[#1e2356]'
                                                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingDashboard;