import React, { useState } from 'react';
import { 
    ArrowLeft, 
    Package, 
    CheckCircle, 
    Printer, 
    Truck, 
    Box, 
    ClipboardList,
    User,
    MapPin,
    CreditCard,
    FileText,
    Check
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// MOCK DATA - Order database fallback
const MOCK_ORDERS = {
    'ORD-10245': {
        id: 'ORD-10245',
        customer: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        product: 'Nike Air Max',
        quantity: 1,
        price: 5499,
        total: 5499,
        address: '42, Marine Drive, Mumbai, MH - 400001',
        payment: 'Paid via UPI',
        status: 'Processing',
        date: '2026-08-14',
        notes: 'Handle with care. Fragile item.'
    },
    'ORD-10246': {
        id: 'ORD-10246',
        customer: 'Priya Singh',
        email: 'priya.s@example.com',
        phone: '+91 99887 66554',
        product: 'Samsung Galaxy S24',
        quantity: 1,
        price: 79999,
        total: 79999,
        address: '22, Connaught Place, Delhi, DL - 110001',
        payment: 'Paid via Card',
        status: 'Packed',
        date: '2026-08-14',
        notes: 'Express Delivery Requested'
    }
};

const ShippingOrderDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    // UI & Drawer States
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [packingStep, setPackingStep] = useState(0);
    const [actionMessage, setActionMessage] = useState('');

    // Fetch order data (Fallback to ORD-10245 if ID not found)
    const initialOrder = MOCK_ORDERS[id] || MOCK_ORDERS['ORD-10245'];
    const [order, setOrder] = useState(initialOrder);

    const packingSteps = [
        { label: 'Pick Product', icon: Box },
        { label: 'Quality Check', icon: CheckCircle },
        { label: 'Pack Product', icon: Package },
        { label: 'Generate Label', icon: Printer }
    ];

    const handleNextStep = () => {
        if (packingStep < packingSteps.length - 1) {
            setPackingStep(prev => prev + 1);
        } else {
            setOrder(prev => ({ ...prev, status: 'Ready for Pickup' }));
            showFeedback("Order processing completed! Status updated to 'Ready for Pickup'.");
        }
    };

    const handlePreviousStep = () => {
        setPackingStep(prev => Math.max(0, prev - 1));
    };

    const showFeedback = (msg) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(''), 4000);
    };

    const handlePrintPackingSlip = () => {
        window.print();
    };

    const handleMarkReady = () => {
        setOrder(prev => ({ ...prev, status: 'Ready for Pickup' }));
        setPackingStep(packingSteps.length - 1);
        showFeedback("Order marked as Ready for Pickup!");
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
            {/* HEADER */}
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <Sidebar 
                    activeTab="Shipping Dashboard" 
                    onSelectTab={(tab) => {
                        if (tab === 'Dashboard' || tab === 'Shipping Dashboard') {
                            navigate('/shipping-dashboard');
                        }
                    }}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
                
                {/* MAIN CONTENT AREA */}
                <div className="flex-1 overflow-y-auto">
                    <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
                        
                        {/* ALERT FEEDBACK BANNER */}
                        {actionMessage && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    <span>{actionMessage}</span>
                                </div>
                                <button 
                                    onClick={() => setActionMessage('')}
                                    className="text-xs font-semibold text-emerald-700 hover:underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {/* PAGE HEADER */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/shipping-dashboard')}
                                className="p-2.5 text-slate-500 hover:text-[#1e2356] hover:bg-white rounded-xl border border-slate-200 shadow-sm transition-all"
                                aria-label="Back to shipping dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-[#1e2356]">Order Processing</h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Pick, Pack, and Ship order <span className="font-semibold text-slate-800">{order.id}</span>
                                </p>
                            </div>
                        </div>

                        {/* MAIN GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* LEFT COLUMN: Order Info & Packing Stepper */}
                            <div className="lg:col-span-2 space-y-6">
                                
                                {/* ORDER DETAILS CARD */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                        <h3 className="text-base font-bold text-slate-800">Order Details</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                            order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            order.status === 'Packed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-purple-50 text-purple-700 border-purple-200'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span>{order.customer}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Details</p>
                                            <p className="text-sm font-medium text-slate-700">{order.phone}</p>
                                            <p className="text-xs text-slate-500">{order.email}</p>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shipping Address</p>
                                            <div className="flex items-start gap-2 text-slate-700 text-sm">
                                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                                                <span>{order.address}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                                                <CreditCard className="w-4 h-4" />
                                                <span>{order.payment}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Date</p>
                                            <p className="text-sm font-medium text-slate-700">{order.date}</p>
                                        </div>
                                    </div>

                                    {order.notes && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                                            <p className="text-xs font-semibold text-amber-800 mb-0.5">Fulfillment Notes:</p>
                                            <p className="text-xs text-amber-700">{order.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* PACKING WORKFLOW STEPPER CARD */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-[#1e2356]" />
                                        Packing Workflow
                                    </h3>
                                    
                                    {/* Stepper Navigation */}
                                    <div className="relative mb-8 px-2">
                                        <div className="flex justify-between items-center relative z-10">
                                            {packingSteps.map((step, index) => {
                                                const Icon = step.icon;
                                                const isCompleted = index < packingStep;
                                                const isCurrent = index === packingStep;
                                                return (
                                                    <div key={index} className="flex flex-col items-center">
                                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                                                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' :
                                                            isCurrent ? 'bg-[#1e2356] border-[#1e2356] text-white shadow-md ring-4 ring-[#1e2356]/10' :
                                                            'bg-white border-slate-200 text-slate-400'
                                                        }`}>
                                                            {isCompleted ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                        </div>
                                                        <span className={`text-[11px] sm:text-xs font-semibold mt-2 text-center max-w-[70px] sm:max-w-[90px] ${
                                                            isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-400'
                                                        }`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Stepper Background Connecting Line */}
                                        <div className="absolute top-5 sm:top-6 left-8 right-8 h-0.5 bg-slate-200 z-0 -translate-y-1/2">
                                            <div 
                                                className="h-full bg-emerald-500 transition-all duration-300"
                                                style={{ width: `${(packingStep / (packingSteps.length - 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Workflow Controls */}
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <button 
                                            onClick={handlePreviousStep}
                                            disabled={packingStep === 0}
                                            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:hover:bg-white"
                                        >
                                            Previous Step
                                        </button>
                                        <button 
                                            onClick={handleNextStep}
                                            className="px-5 py-2 bg-[#1e2356] text-white rounded-lg text-xs font-semibold hover:bg-[#1e2356]/90 transition-all shadow-sm"
                                        >
                                            {packingStep === packingSteps.length - 1 ? 'Complete & Ship' : 'Next Step'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Order Items & Quick Actions */}
                            <div className="space-y-6">
                                
                                {/* ITEMS SUMMARY CARD */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-800 mb-4">Items to Pack</h3>
                                    
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                        <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                            <Package className="w-7 h-7 text-[#1e2356]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{order.product}</p>
                                            <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
                                            <p className="text-xs font-bold text-[#1e2356] mt-0.5">Rs.{order.price.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Subtotal</span>
                                            <span className="text-slate-800 font-medium">Rs.{order.price.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Shipping Fee</span>
                                            <span className="text-emerald-600 font-semibold">Free</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-100 text-slate-800">
                                            <span>Total Amount</span>
                                            <span className="text-[#1e2356]">Rs.{order.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION BUTTONS CARD */}
                                <div className="space-y-3">
                                    <button 
                                        onClick={handlePrintPackingSlip}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Printer className="w-4 h-4 text-slate-500" />
                                        Print Packing Slip
                                    </button>
                                    
                                    <button 
                                        onClick={() => showFeedback("Shipping label generated and queued for printing.")}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <FileText className="w-4 h-4 text-slate-500" />
                                        Generate Shipping Label
                                    </button>
                                    
                                    <button 
                                        onClick={handleMarkReady}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e2356] text-white rounded-xl text-xs font-semibold hover:bg-[#1e2356]/90 transition-all shadow-md"
                                    >
                                        <Truck className="w-4 h-4" />
                                        Mark as Ready for Pickup
                                    </button>
                                </div>

                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ShippingOrderDetails;