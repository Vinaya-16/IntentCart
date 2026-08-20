import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    X,
    AlertCircle,
    CheckCircle,
    Loader2,
    RotateCcw,
    Truck,
    User,
    Calendar,
    CreditCard
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const API_BASE_URI = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URI}` ||'http://localhost:5000/api';

export default function CreateReturn() {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const location = useLocation();
    const orderData = location.state?.order;

    const [order, setOrder] = useState(orderData || null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [returnData, setReturnData] = useState({
        reason: '',
        reasonDescription: '',
        refundMethod: 'original_payment'
    });

    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        if (!orderData && orderId) {
            fetchOrder();
        } else if (orderData) {
            setOrder(orderData);
            setLoading(false);
        } else {
            setError('No order data found');
            setLoading(false);
        }
    }, [orderId, orderData]);

    const fetchOrder = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/intentCart-auth');
                return;
            }

            const response = await fetch(`${API_URL}/customer/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch order');
            }

            const data = await response.json();
            if (data.success) {
                setOrder(data.order);
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            setError(err.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (item) => {
        setSelectedItems(prev =>
            prev.find(i => i.productId === item.productId)
                ? prev.filter(i => i.productId !== item.productId)
                : [...prev, item]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedItems.length === 0) {
            setError('Please select at least one item to return');
            return;
        }

        if (!returnData.reason) {
            setError('Please select a reason for return');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/intentCart-auth');
                return;
            }

            const payload = {
                orderId: orderId,
                items: selectedItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity || 1
                })),
                reason: returnData.reason,
                reasonDescription: returnData.reasonDescription || '',
                refundMethod: returnData.refundMethod,
                images: []
            };

            const response = await fetch(`${API_URL}/returns`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit return request');
            }

            setSuccess('Return request submitted successfully!');
            setTimeout(() => {
                navigate('/orders');
            }, 2000);
        } catch (err) {
            console.error('Error submitting return:', err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const reasonOptions = [
        { value: 'damaged', label: 'Damaged on arrival' },
        { value: 'wrong_size', label: 'Wrong size' },
        { value: 'wrong_item', label: 'Wrong item delivered' },
        { value: 'color_mismatch', label: 'Color mismatch' },
        { value: 'defective', label: 'Defective product' },
        { value: 'changed_mind', label: 'Changed mind' },
        { value: 'other', label: 'Other' }
    ];

    const refundMethodOptions = [
        { value: 'original_payment', label: 'Original Payment Method' },
        { value: 'wallet_credit', label: 'Wallet Credit' },
        { value: 'replacement', label: 'Replacement' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/60">
                <Header />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="min-h-screen bg-slate-50/60">
                <Header />
                <div className="max-w-3xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-2xl p-8 text-center border border-red-200 shadow-sm">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Failed to Load Order</h2>
                        <p className="text-slate-600 mt-2">{error}</p>
                        <button
                            onClick={() => navigate('/orders')}
                            className="mt-4 px-4 py-2 bg-[#1e2356] text-white rounded-lg hover:bg-[#1e2356]/90 transition-colors"
                        >
                            Back to Orders
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const isEligible = order?.status === 'delivered';
    const canReturn = isEligible && order?.deliveredAt &&
        (new Date() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24) <= 7;

    if (!canReturn && order) {
        return (
            <div className="min-h-screen bg-slate-50/60">
                <Header />
                <div className="max-w-3xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-2xl p-8 text-center border border-amber-200 shadow-sm">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Return Not Available</h2>
                        <p className="text-slate-600 mt-2">
                            {order?.status !== 'delivered'
                                ? 'This order has not been delivered yet. Returns are only available for delivered orders.'
                                : 'The return window for this order has expired. Returns are accepted within 7 days of delivery.'
                            }
                        </p>
                        <button
                            onClick={() => navigate('/orders')}
                            className="mt-4 px-4 py-2 bg-[#1e2356] text-white rounded-lg hover:bg-[#1e2356]/90 transition-colors"
                        >
                            Back to Orders
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
            <Header />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/orders')}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Request Return</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Order #{order?.orderId || orderId}
                            </p>
                        </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${order?.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                        {order?.status || 'Pending'}
                    </span>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg border border-green-200 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Order Summary Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Package className="w-4 h-4 text-indigo-600" />
                                Select Items to Return
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Select the items you want to return</p>
                        </div>
                        <div className="p-5 space-y-3">
                            {order?.items?.map((item, index) => (
                                <label
                                    key={index}
                                    className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition ${selectedItems.find(i => i.productId === item.productId)
                                            ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-200/50'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!selectedItems.find(i => i.productId === item.productId)}
                                        onChange={() => toggleItem({
                                            productId: item.productId,
                                            quantity: item.quantity,
                                            price: item.price,
                                            productName: item.productName
                                        })}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                                        <p className="text-xs text-slate-500">Qty: {item.quantity} • Rs.{item.price?.toLocaleString()}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">Rs.{item.total?.toLocaleString()}</span>
                                </label>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between text-sm">
                            <span className="text-slate-500">Selected Items</span>
                            <span className="font-semibold text-indigo-600">{selectedItems.length}</span>
                        </div>
                    </div>

                    {/* Return Reason Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                Return Reason
                            </h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Reason for Return *
                                </label>
                                <select
                                    value={returnData.reason}
                                    onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    {reasonOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Additional Details (Optional)
                                </label>
                                <textarea
                                    value={returnData.reasonDescription}
                                    onChange={(e) => setReturnData({ ...returnData, reasonDescription: e.target.value })}
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="Please provide any additional details about the issue..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Refund Method Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                Refund Method
                            </h2>
                        </div>
                        <div className="p-5 space-y-3">
                            {refundMethodOptions.map(option => (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${returnData.refundMethod === option.value
                                            ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-200/50'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="refundMethod"
                                        value={option.value}
                                        checked={returnData.refundMethod === option.value}
                                        onChange={(e) => setReturnData({ ...returnData, refundMethod: e.target.value })}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-800">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Return Policy Info */}
                    <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-950">Return Policy</p>
                            <ul className="mt-1 space-y-1 text-amber-800">
                                <li>Returns accepted within 7 days of delivery</li>
                                <li>Items must be unused and in original packaging</li>
                                <li>Refund will be processed after quality inspection</li>
                            </ul>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || selectedItems.length === 0}
                            className="flex-1 px-4 py-3 bg-[#1e2356] hover:bg-[#1e2356]/90 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="w-4 h-4" />
                                    Submit Return Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
}