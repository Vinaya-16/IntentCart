import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Truck,
    Package,
    CheckCircle2,
    MapPin,
    Clock,
    User,
    Phone,
    Edit3,
    Save,
    Building2,
    Calendar,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/sidebar.jsx';
import Header from './components/header.jsx';

// Mock Data
const MOCK_SHIPMENTS = {
    'ORD-10245': {
        id: 'SHP-78291',
        orderId: 'ORD-10245',
        customer: 'Rahul Sharma',
        carrier: 'XYZ Logistics',
        trackingId: 'TRK-918273',
        estimatedDelivery: 'Aug 18, 2026',
        status: 'Picked Up',
        history: [
            { status: 'Order Placed', location: 'Mumbai WH-01', date: 'Aug 14, 2026 • 09:00 AM', completed: true },
            { status: 'Picked Up', location: 'Mumbai WH-01', date: 'Aug 14, 2026 • 02:30 PM', completed: true },
            { status: 'In Transit', location: 'En route to Delhi Hub', date: 'Aug 14, 2026 • 04:00 PM', completed: false },
            { status: 'Reached Hub', location: 'Delhi Sorting Center', date: 'Pending', completed: false },
            { status: 'Out for Delivery', location: 'Delhi Zone 5', date: 'Pending', completed: false },
            { status: 'Delivered', location: 'Delivered to Customer', date: 'Pending', completed: false },
        ],
        agent: {
            name: 'Ravi Kumar',
            phone: '+91 99887 66554',
            currentLocation: 'Mumbai - Andheri East'
        }
    }
};

const STATUS_CONFIG = {
    'Order Placed': { icon: Package, badge: 'bg-slate-100 text-slate-700 border-slate-200', accent: 'bg-slate-500', iconColor: 'text-slate-600' },
    'Picked Up': { icon: Truck, badge: 'bg-blue-50 text-blue-700 border-blue-200', accent: 'bg-blue-600', iconColor: 'text-blue-600' },
    'In Transit': { icon: Truck, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: 'bg-indigo-600', iconColor: 'text-indigo-600' },
    'Reached Hub': { icon: Building2, badge: 'bg-purple-50 text-purple-700 border-purple-200', accent: 'bg-purple-600', iconColor: 'text-purple-600' },
    'Out for Delivery': { icon: Truck, badge: 'bg-amber-50 text-amber-700 border-amber-200', accent: 'bg-amber-600', iconColor: 'text-amber-600' },
    'Delivered': { icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: 'bg-emerald-600', iconColor: 'text-emerald-600' }
};

const ShippingTracking = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [shipment, setShipment] = useState(() => MOCK_SHIPMENTS[id] || MOCK_SHIPMENTS['ORD-10245']);
    const [isUpdating, setIsUpdating] = useState(false);

    // Helper to find next logical step for the select dropdown
    const getNextStatus = (currentShipment) => {
        const currentIndex = currentShipment.history.findIndex(h => h.status === currentShipment.status);
        const nextStep = currentShipment.history[currentIndex + 1];
        return nextStep ? nextStep.status : currentShipment.status;
    };

    const [selectedStatus, setSelectedStatus] = useState(() => getNextStatus(shipment));
    const [locationNote, setLocationNote] = useState('');
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        const activeShipment = MOCK_SHIPMENTS[id] || MOCK_SHIPMENTS['ORD-10245'];
        setShipment(activeShipment);
        setSelectedStatus(getNextStatus(activeShipment));
    }, [id]);

    const currentStepIndex = shipment.history.findIndex(h => h.status === shipment.status);

    const handleUpdateStatus = () => {
        if (!selectedStatus || selectedStatus === shipment.status) return;

        setIsUpdating(true);

        setTimeout(() => {
            const targetIndex = shipment.history.findIndex(h => h.status === selectedStatus);
            const formattedDate = new Date().toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const updatedHistory = shipment.history.map((h, index) => {
                if (index <= targetIndex) {
                    return {
                        ...h,
                        completed: true,
                        date: index === targetIndex ? formattedDate : h.date !== 'Pending' ? h.date : formattedDate,
                        location: index === targetIndex && locationNote ? locationNote : h.location
                    };
                }
                return h;
            });

            const updatedShipment = {
                ...shipment,
                status: selectedStatus,
                history: updatedHistory
            };

            setShipment(updatedShipment);
            setSelectedStatus(getNextStatus(updatedShipment));
            setIsUpdating(false);
            setLocationNote('');
            setToastMessage(`Tracking status updated to "${selectedStatus}"`);
            setTimeout(() => setToastMessage(null), 4000);
        }, 800);
    };

    const currentConfig = STATUS_CONFIG[shipment.status] || STATUS_CONFIG['Order Placed'];
    const CurrentStatusIcon = currentConfig.icon;

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

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* SCROLLABLE PAGE BODY */}
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* INLINE TOAST NOTIFICATION */}
                            {toastMessage && (
                                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-sm transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                        <p className="text-sm font-medium">{toastMessage}</p>
                                    </div>
                                    <button
                                        onClick={() => setToastMessage(null)}
                                        className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold uppercase tracking-wider ml-4"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {/* BREADCRUMB & PAGE HEADER */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate('/shipping-dashboard')}
                                        className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-sm transition-all"
                                        title="Back to Dashboard"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                                            <span>Shipping</span>
                                            <ChevronRight className="w-3 h-3" />
                                            <span>Tracking</span>
                                            <ChevronRight className="w-3 h-3" />
                                            <span className="text-slate-800 font-semibold">{shipment.orderId}</span>
                                        </div>
                                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shipment Details</h1>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentConfig.badge}`}>
                                        <span className={`w-2 h-2 rounded-full ${currentConfig.accent} animate-pulse`} />
                                        {shipment.status}
                                    </span>
                                </div>
                            </div>

                            {/* METRIC CARDS GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Carrier</p>
                                        <p className="text-sm font-semibold text-slate-900 truncate">{shipment.carrier}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tracking ID</p>
                                        <p className="text-sm font-semibold text-slate-900 truncate font-mono">{shipment.trackingId}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                        <CurrentStatusIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Status</p>
                                        <p className="text-sm font-semibold text-slate-900 truncate">{shipment.status}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Est. Delivery</p>
                                        <p className="text-sm font-semibold text-slate-900 truncate">{shipment.estimatedDelivery}</p>
                                    </div>
                                </div>
                            </div>

                            {/* MAIN CONTENT GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* TIMELINE */}
                                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-indigo-600" />
                                                Tracking Timeline
                                            </h3>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {currentStepIndex + 1} of {shipment.history.length} Steps
                                            </span>
                                        </div>

                                        <div className="relative pl-8 space-y-8 my-2">
                                            {shipment.history.map((step, index) => {
                                                const Config = STATUS_CONFIG[step.status] || STATUS_CONFIG['Order Placed'];
                                                const Icon = Config.icon;
                                                const isCompleted = step.completed;
                                                const isCurrent = index === currentStepIndex;
                                                const isPending = !isCompleted && index > currentStepIndex;
                                                const isLast = index === shipment.history.length - 1;

                                                return (
                                                    <div key={index} className="relative group">
                                                        {!isLast && (
                                                            <div
                                                                className={`absolute left-[-20px] top-6 bottom-[-32px] w-0.5 transition-colors ${isCompleted && shipment.history[index + 1]?.completed
                                                                    ? 'bg-emerald-500'
                                                                    : 'bg-slate-200'
                                                                    }`}
                                                            />
                                                        )}

                                                        <div className={`absolute left-[-28px] top-0.5 w-4 h-4 rounded-full border-2 border-white ring-2 transition-all ${isCompleted
                                                            ? 'ring-emerald-500 bg-emerald-500'
                                                            : isCurrent
                                                                ? 'ring-indigo-600 bg-indigo-600 scale-110'
                                                                : 'ring-slate-300 bg-slate-100'
                                                            }`}>
                                                            {isCompleted && (
                                                                <div className="w-full h-full flex items-center justify-center text-white">
                                                                    <span className="block w-1.5 h-1.5 bg-white rounded-full" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={`rounded-lg p-3 transition-colors ${isCurrent ? 'bg-slate-50 border border-slate-200' : ''}`}>
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className={`w-4 h-4 ${isPending ? 'text-slate-400' : Config.iconColor}`} />
                                                                    <h4 className={`text-sm font-semibold ${isPending ? 'text-slate-400' : 'text-slate-900'}`}>
                                                                        {step.status}
                                                                    </h4>
                                                                </div>
                                                                {isCurrent && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                                        Current Step
                                                                    </span>
                                                                )}
                                                                {isCompleted && !isCurrent && (
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                )}
                                                            </div>

                                                            <p className={`text-xs ${isPending ? 'text-slate-400' : 'text-slate-600'} font-medium`}>
                                                                {step.location}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {step.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* UPDATE STATUS & AGENT PANEL */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                                            <Edit3 className="w-5 h-5 text-indigo-600" />
                                            Update Status
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                                    Select New Status
                                                </label>
                                                <select
                                                    value={selectedStatus}
                                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                                                >
                                                    {shipment.history.map((h, idx) => (
                                                        <option key={idx} value={h.status} disabled={idx <= currentStepIndex}>
                                                            {h.status} {idx <= currentStepIndex ? '✓' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                                    Location / Note (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={locationNote}
                                                    onChange={(e) => setLocationNote(e.target.value)}
                                                    placeholder="e.g. Arrived at Regional Hub"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                                                />
                                            </div>

                                            <button
                                                onClick={handleUpdateStatus}
                                                disabled={isUpdating || selectedStatus === shipment.status}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow"
                                            >
                                                {isUpdating ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Save Update
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                                            <User className="w-5 h-5 text-indigo-600" />
                                            Assigned Delivery Agent
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-indigo-100">
                                                    {shipment.agent.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-900 text-sm">{shipment.agent.name}</p>
                                                    <a
                                                        href={`tel:${shipment.agent.phone}`}
                                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline mt-0.5"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        {shipment.agent.phone}
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                                    Last Known Location
                                                </p>
                                                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                                    {shipment.agent.currentLocation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </main>
                </div>

            </div>
        </div>
    );
};

export default ShippingTracking;