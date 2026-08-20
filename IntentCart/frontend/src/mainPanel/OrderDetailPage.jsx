import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Loader2,
  WifiOff,
  RefreshCw,
  Calendar,
  MapPin,
  CreditCard,
  IndianRupee,
  X
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import eventTracker from '../utils/eventTracker.js';

const API_BASE_URI = import.meta.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URI}/customer` || 'http://localhost:5000/api/customer';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Use ref to track if order view has been tracked
  const orderTrackedRef = useRef(false);

  const getToken = () => localStorage.getItem('token');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      setIsServerDown(false);
      // Reset tracking flag when fetching new data
      orderTrackedRef.current = false;

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/intentCart-auth';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setIsServerDown(true);
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Track order view - only once per order load
  useEffect(() => {
    if (order && !orderTrackedRef.current) {
      eventTracker.trackOrderSuccessView(order.orderId, order.total);
      orderTrackedRef.current = true;
    }
  }, [order]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setCancelling(false);
        return;
      }

      const response = await fetch(`${API_URL}/orders/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation' })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        // Reset tracking flag to allow re-tracking if needed
        orderTrackedRef.current = false;
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Delivered' };
      case 'shipped': return { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Shipped' };
      case 'processing': return { icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Processing' };
      case 'pending': return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Pending' };
      case 'cancelled': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' };
      default: return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50', label: status };
    }
  };

  // Get status badge color (fix for missing function)
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Order Not Found</h2>
          <p className="text-slate-500 mt-2">{error || 'The order you are looking for does not exist.'}</p>
          <Link to="/orders" className="mt-4 inline-block text-indigo-600 hover:underline">
            Back to Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Server Down */}
        {isServerDown && (
          <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchOrder}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${statusInfo.bg}`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Order #{order.orderId}</h1>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(order.status)}`}>
                {statusInfo.label}
              </span>
              {order.status === 'pending' && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Items</h3>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold text-slate-900">Rs.{item.total?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-900">Rs.{order.subtotal?.toLocaleString()}</span>
            </div>
            {order.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span className="font-medium text-slate-900">Rs.{order.shippingCost}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-900">Rs.{order.tax}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-Rs.{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-indigo-600">Rs.{order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Shipping Address
            </h3>
            <div className="text-sm text-slate-700 space-y-0.5">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-2 text-slate-500">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}