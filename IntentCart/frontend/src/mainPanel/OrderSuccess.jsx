import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Mail, Loader2, IndianRupee } from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import eventTracker from '../utils/eventTracker';

const API_URL = 'http://localhost:5000/api/customer';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use ref to track if order success has been tracked
  const orderTrackedRef = useRef(false);

  const getToken = () => localStorage.getItem('token');

  const fetchOrder = async (id) => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      // Fetch using the orderId (which could be either _id or orderId)
      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        // Reset tracking flag when order is loaded
        orderTrackedRef.current = false;
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch order when component mounts or orderId changes
  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  // Track order success view - only once per order
  useEffect(() => {
    if (order && !orderTrackedRef.current) {
      eventTracker.trackEvent({
        eventType: 'order_success_viewed',
        metadata: {
          orderId: order.orderId,
          total: order.total
        }
      });
      orderTrackedRef.current = true;
    }
  }, [order]);

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
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Order Not Found</h2>
          <p className="text-slate-500 mt-2">{error || 'The order could not be found'}</p>
          <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">
            Go to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h1>
          <p className="text-slate-500 mt-2">Thank you for your order</p>

          {order && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">Order Number</p>
              <p className="text-lg font-bold text-slate-900">{order.orderId}</p>
              <p className="text-sm text-slate-600 mt-2">Total Amount</p>
              <p className="text-lg font-bold text-indigo-600">Rs.{order.total?.toLocaleString()}</p>
              <p className="text-sm text-slate-600 mt-2">Payment Status</p>
              <p className={`text-sm font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/orders"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              <Package className="w-4 h-4 inline mr-2" />
              View My Orders
            </Link>
            <Link
              to="/"
              className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="mt-8 text-sm text-slate-500 space-y-2">
            <p className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              We'll send you order confirmation via email
            </p>
            <p className="flex items-center justify-center gap-2">
              <Truck className="w-4 h-4" />
              You'll receive shipping updates shortly
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}