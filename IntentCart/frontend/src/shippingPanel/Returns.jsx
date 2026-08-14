import React, { useState, useMemo } from 'react';
import { 
    ArrowLeft, 
    RotateCcw, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Truck, 
    Search, 
    X,
    Package,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// MOCK RETURN DATA
const MOCK_RETURNS = [
    {
        id: 'RET-001',
        orderId: 'ORD-10245',
        customer: 'Rahul Sharma',
        product: 'Nike Air Max 270',
        reason: 'Damaged on arrival',
        status: 'Pending Approval',
        date: '2026-08-14',
        refundMethod: 'Original Payment',
        amount: 5499
    },
    {
        id: 'RET-002',
        orderId: 'ORD-10252',
        customer: 'Ananya Joshi',
        product: 'Manscaped Trimmer 4.0',
        reason: 'Wrong size delivered',
        status: 'Approved - Awaiting Pickup',
        date: '2026-08-13',
        refundMethod: 'Wallet Credit',
        amount: 450
    },
    {
        id: 'RET-003',
        orderId: 'ORD-10250',
        customer: 'Kavya Nair',
        product: 'Beige Blackout Curtains (Set of 2)',
        reason: 'Colour mismatch',
        status: 'In Transit (Pickup)',
        date: '2026-08-12',
        refundMethod: 'Original Payment',
        amount: 999
    },
    {
        id: 'RET-004',
        orderId: 'ORD-10247',
        customer: 'Amit Kumar',
        product: 'Godrej 3-Seater Leatherette Sofa',
        reason: 'Defective product',
        status: 'Quality Inspection',
        date: '2026-08-12',
        refundMethod: 'Replacement',
        amount: 12000
    },
    {
        id: 'RET-005',
        orderId: 'ORD-10249',
        customer: 'Rohan Mehta',
        product: 'DANCING CACTUS Toy',
        reason: 'Changed mind',
        status: 'Refund Processed',
        date: '2026-08-11',
        refundMethod: 'Original Payment',
        amount: 1340
    }
];

const STATUS_CONFIG = {
    'Pending Approval': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200/80', dot: 'bg-amber-500' },
    'Approved - Awaiting Pickup': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/80', dot: 'bg-blue-500' },
    'In Transit (Pickup)': { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200/80', dot: 'bg-indigo-500' },
    'Quality Inspection': { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200/80', dot: 'bg-purple-500' },
    'Refund Processed': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
    'Rejected': { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200/80', dot: 'bg-rose-500' }
};

const ShippingReturns = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);

    // Filter Logic
    const filteredReturns = useMemo(() => {
        return MOCK_RETURNS.filter(ret => {
            const matchesStatus = filterStatus === 'All' ? true : ret.status === filterStatus;
            const matchesSearch = 
                ret.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ret.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ret.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ret.product.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [searchQuery, filterStatus]);

    // Stats
    const stats = [
        { label: 'Total Returns', value: MOCK_RETURNS.length, icon: RotateCcw, color: 'purple' },
        { label: 'Pending Approval', value: MOCK_RETURNS.filter(r => r.status === 'Pending Approval').length, icon: Clock, color: 'amber' },
        { label: 'In Transit', value: MOCK_RETURNS.filter(r => r.status === 'In Transit (Pickup)').length, icon: Truck, color: 'blue' },
        { label: 'Refund Processed', value: MOCK_RETURNS.filter(r => r.status === 'Refund Processed').length, icon: CheckCircle, color: 'emerald' }
    ];

    const statusFilters = ['All', 'Pending Approval', 'Approved - Awaiting Pickup', 'In Transit (Pickup)', 'Quality Inspection', 'Refund Processed', 'Rejected'];

    const handleManage = (ret) => {
        setSelectedReturn(ret);
        setShowActionModal(true);
    };

    const handleAction = (action) => {
        alert(`[Action Execution] "${action}" completed for Return ID: ${selectedReturn.id}`);
        setShowActionModal(false);
        setSelectedReturn(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        /* FIXED ROOT: Fixed height viewport shell prevents scroll leaks */
        <div className="h-screen w-screen flex flex-col bg-slate-50/60 font-sans text-slate-800 overflow-hidden">
            
            {/* Header pinned at top */}
            <Header className="shrink-0" />
            
            {/* Main Flex Wrapper */}
            <div className="flex flex-1 w-full overflow-hidden relative">
                
                {/* FIXED SIDEBAR WRAPPER: shrink-0 keeps sidebar rigid */}
                <aside className="shrink-0 h-full">
                    <Sidebar activeTab="Shipping Dashboard" />
                </aside>
                
                {/* SCROLLABLE MAIN CONTENT: min-w-0 prevents wide tables from pushing sidebar */}
                <div className="flex-1 min-w-0 h-full overflow-y-auto">
                    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                        
                        {/* PAGE HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => navigate('/shipping-dashboard')}
                                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Returns Management</h1>
                                    <p className="text-sm text-slate-500 mt-0.5">Track customer returns, reverse logistics, and pending refunds.</p>
                                </div>
                            </div>
                        </div>

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                const colorMap = {
                                    purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
                                    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
                                    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
                                    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' }
                                };
                                return (
                                    <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-xl ring-1 ${colorMap[stat.color].ring} ${colorMap[stat.color].bg} ${colorMap[stat.color].text}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* RETURNS TABLE CONTAINER */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            
                            {/* SEARCH & FILTER BAR */}
                            <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-4">
                                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Return ID, Order, Product, Customer..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-9 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-500 font-medium self-end lg:self-center">
                                        Showing <span className="font-bold text-slate-800">{filteredReturns.length}</span> of {MOCK_RETURNS.length} returns
                                    </div>
                                </div>

                                {/* STATUS FILTER PILLS */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 pl-1">
                                        <Filter className="w-3.5 h-3.5" /> Filter:
                                    </span>
                                    {statusFilters.map((status) => {
                                        const count = status === 'All' 
                                            ? MOCK_RETURNS.length 
                                            : MOCK_RETURNS.filter(r => r.status === status).length;
                                        const isActive = filterStatus === status;

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                                    isActive
                                                        ? 'bg-slate-900 text-white shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                                }`}
                                            >
                                                <span>{status}</span>
                                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                    isActive ? 'bg-slate-700 text-white' : 'bg-slate-200/70 text-slate-700'
                                                }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TABLE: Self-contained horizontal scrolling */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                                            <th className="py-3.5 px-4 sm:px-6">Return Info</th>
                                            <th className="py-3.5 px-4">Product</th>
                                            <th className="py-3.5 px-4">Customer</th>
                                            <th className="py-3.5 px-4">Reason</th>
                                            <th className="py-3.5 px-4">Refund Amount</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredReturns.length > 0 ? (
                                            filteredReturns.map((ret) => {
                                                const statusStyle = STATUS_CONFIG[ret.status] || STATUS_CONFIG['Pending Approval'];

                                                return (
                                                    <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="py-4 px-4 sm:px-6">
                                                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                {ret.id}
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                                <span>{ret.orderId}</span>
                                                                <span>•</span>
                                                                <span>{formatDate(ret.date)}</span>
                                                            </div>
                                                        </td>

                                                        <td className="py-4 px-4 max-w-[200px]">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                                                                    <Package className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-medium text-slate-800 truncate" title={ret.product}>
                                                                    {ret.product}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <div className="font-medium text-slate-800">{ret.customer}</div>
                                                            <div className="text-xs text-slate-400">{ret.refundMethod}</div>
                                                        </td>

                                                        <td className="py-4 px-4 text-slate-600 max-w-[180px]">
                                                            <span className="inline-block truncate max-w-full" title={ret.reason}>
                                                                {ret.reason}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                                                            {formatCurrency(ret.amount)}
                                                        </td>

                                                        <td className="py-4 px-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                                                                {ret.status}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleManage(ret)}
                                                                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-2xs"
                                                            >
                                                                Manage
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="py-12 text-center text-slate-400">
                                                    <div className="max-w-xs mx-auto space-y-2">
                                                        <RotateCcw className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                                                        <p className="text-sm font-medium text-slate-600">No returns found</p>
                                                        <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* TABLE FOOTER */}
                            <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
                                <span>Showing {filteredReturns.length} active records</span>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Approval
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Refund Completed
                                    </span>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* MODAL */}
            {showActionModal && selectedReturn && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-slate-900">Manage Return</h3>
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-md">
                                        {selectedReturn.id}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Order ID: <span className="font-semibold text-slate-700">{selectedReturn.orderId}</span></p>
                            </div>
                            <button 
                                onClick={() => setShowActionModal(false)} 
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-5">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-slate-700 shadow-2xs">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-400 font-medium">Product Item</p>
                                    <p className="text-sm font-semibold text-slate-900 truncate">{selectedReturn.product}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-medium">Refund</p>
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(selectedReturn.amount)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Customer</p>
                                    <p className="font-medium text-slate-800 text-sm mt-0.5">{selectedReturn.customer}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Payment Method</p>
                                    <p className="font-medium text-slate-800 text-sm mt-0.5">{selectedReturn.refundMethod}</p>
                                </div>
                            </div>

                            <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-950">Return Reason</p>
                                    <p className="mt-0.5 text-amber-800">{selectedReturn.reason}</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2.5">
                                <button 
                                    onClick={() => handleAction('Reject Return')}
                                    className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all order-2 sm:order-1"
                                >
                                    Reject Return
                                </button>
                                <button 
                                    onClick={() => handleAction('Approve & Schedule Pickup')}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all order-1 sm:order-2"
                                >
                                    Approve & Schedule Pickup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingReturns;