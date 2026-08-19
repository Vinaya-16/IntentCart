import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Truck,
  MapPin,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  WifiOff,
  RefreshCw,
  Building,
  Home,
  Briefcase,
  Check,
  ShoppingBag,
  X,
  Tag
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import eventTracker from '../utils/eventTracker';
import { toast, Toaster } from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api/customer';
const MERCHANT_API_URL = 'http://localhost:5000/api/merchant';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);

  // Coupon state - Initialize with values from location
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');

  const checkoutTrackedRef = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      phone: ''
    },
    paymentMethod: 'cod',
    saveAddress: false,
    agreeTerms: false
  });

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const getToken = () => localStorage.getItem('token');

  // Get coupon data from navigation state on mount
  useEffect(() => {
    // console.log('Checkout mounted, checking location.state:', location.state);

    if (location.state?.couponData) {
      const { couponData } = location.state;
      // console.log('Coupon data received in checkout:', couponData);

      // Set coupon states with the received data
      setAppliedCoupon({
        code: couponData.couponCode,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        maxDiscountAmount: couponData.maxDiscountAmount,
        name: couponData.name,
        description: couponData.description,
        minOrderAmount: couponData.minOrderAmount
      });

      // Set the discount amount - THIS IS THE CRITICAL PART
      setCouponDiscount(couponData.discountAmount || 0);
      setCouponCode(couponData.couponCode || '');

      // console.log('Coupon discount set to:', couponData.discountAmount);
    } else {
      // console.log('No coupon data in location.state');
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponCode('');
    }
  }, [location.state]);

  // Fetch checkout data
  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      setError('');
      setIsServerDown(false);
      checkoutTrackedRef.current = false;

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const cartRes = await fetch(`${API_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (cartRes.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/intentCart-auth';
        return;
      }

      if (!cartRes.ok) throw new Error('Failed to fetch cart');

      const cartData = await cartRes.json();

      const profileRes = await fetch(`${API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!profileRes.ok) throw new Error('Failed to fetch profile');

      const profileData = await profileRes.json();

      if (cartData.success) {
        const items = cartData.cart?.items?.map(item => ({
          id: item._id || item.productId?._id,
          productId: item.productId?._id,
          name: item.productId?.name || 'Product',
          price: item.price || item.productId?.price || 0,
          quantity: item.quantity || 1,
          image: item.productId?.images?.[0]?.url || null,
          slug: item.productId?.slug || '',
          stock: item.productId?.stock || 0,
          total: (item.price || item.productId?.price || 0) * (item.quantity || 1)
        })) || [];

        setCartItems(items);
      }

      if (profileData.success) {
        setProfile(profileData.profile);
        setAddresses(profileData.profile.addresses || []);

        const defaultAddr = profileData.profile.addresses?.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
          setFormData(prev => ({
            ...prev,
            shippingAddress: {
              street: defaultAddr.street || '',
              city: defaultAddr.city || '',
              state: defaultAddr.state || '',
              zipCode: defaultAddr.zip || '',
              country: 'India',
              phone: profileData.profile.phone || ''
            }
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching checkout data:', err);
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

  // Track checkout view
  useEffect(() => {
    if (cartItems.length > 0 && !checkoutTrackedRef.current) {
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      eventTracker.trackCheckoutView(cartItems, total);
      checkoutTrackedRef.current = true;
    }
  }, [cartItems]);

  // Handle place order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!formData.agreeTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (!formData.shippingAddress.street || !formData.shippingAddress.city) {
      setError('Please provide a complete shipping address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setSubmitting(false);
        return;
      }

      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = subtotal >= 5000 ? 0 : 99;
      const tax = Math.round(subtotal * 0.05);

      // Use couponDiscount from state
      const discount = couponDiscount || 0;
      const finalTotal = Math.max(0, subtotal + deliveryFee + tax - discount);

      // console.log('Order calculation:', {
      //   subtotal,
      //   deliveryFee,
      //   tax,
      //   discount,
      //   finalTotal,
      //   couponCode: appliedCoupon?.code
      // });

      const orderData = {
        shippingAddress: {
          street: formData.shippingAddress.street || '',
          city: formData.shippingAddress.city || '',
          state: formData.shippingAddress.state || '',
          zipCode: formData.shippingAddress.zipCode || '',
          country: formData.shippingAddress.country || 'India',
          phone: formData.shippingAddress.phone || profile?.phone || '0000000000'
        },
        paymentMethod: 'cod',
        couponCode: appliedCoupon?.code || null,
        discountAmount: discount,
        discountType: appliedCoupon?.discountType || 'percentage',
        originalTotal: subtotal + deliveryFee + tax,
        finalTotal: finalTotal
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      if (data.success) {
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await eventTracker.trackPaymentSuccess(data.order?.orderId, cartItems, total);
        await eventTracker.trackPurchaseCompleted(data.order?.orderId, cartItems, total);

        setSuccess('Order placed successfully!');
        toast.success('Order placed successfully!');
        setTimeout(() => {
          navigate(`/order-success/${data.order?.orderId}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.message);
      toast.error(err.message);

      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      await eventTracker.trackPaymentFailed(err, cartItems, total);
    } finally {
      setSubmitting(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  // Calculate totals with coupon - USE couponDiscount STATE
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 5000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.05);

  // IMPORTANT: Use couponDiscount from state
  const discount = couponDiscount || 0;
  const total = Math.max(0, subtotal + deliveryFee + tax - discount);

  // console.log('Checkout calculations:', {
  //   subtotal,
  //   deliveryFee,
  //   tax,
  //   discount,
  //   total,
  //   couponDiscountState: couponDiscount,
  //   appliedCoupon: appliedCoupon?.code
  // });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Header />
        <Toaster position="top-right" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Header />
        <Toaster position="top-right" />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-3xl p-12 max-w-md mx-auto">
            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="text-sm text-slate-500 mt-2">Add some items to your cart before checking out.</p>
            <Link to="/" className="mt-6 inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
      <Header />
      <Toaster position="top-right" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Checkout</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Step</span>
            <span className="font-bold text-indigo-600">1</span>
            <span className="text-slate-300">of</span>
            <span className="font-bold text-slate-600">3</span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Server Down */}
        {isServerDown && (
          <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchCheckoutData}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Shipping Address
              </h2>

              {/* Saved Addresses */}
              {addresses.length > 0 && (
                <div className="mb-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved Addresses</p>
                  {addresses.map((addr, index) => (
                    <button
                      key={addr._id || index}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setFormData(prev => ({
                          ...prev,
                          shippingAddress: {
                            street: addr.street || '',
                            city: addr.city || '',
                            state: addr.state || '',
                            zipCode: addr.zip || '',
                            country: 'India',
                            phone: profile?.phone || ''
                          }
                        }));
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition ${selectedAddress?._id === addr._id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-indigo-300'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {addr.type === 'Home' && <Home className="w-4 h-4 text-slate-500" />}
                            {addr.type === 'Work' && <Briefcase className="w-4 h-4 text-slate-500" />}
                            {addr.type === 'Other' && <Building className="w-4 h-4 text-slate-500" />}
                            <span className="font-semibold text-slate-900">{addr.type}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{addr.street}</p>
                          <p className="text-sm text-slate-600">{addr.city}, {addr.state} {addr.zip}</p>
                        </div>
                        {selectedAddress?._id === addr._id && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* New Address Form */}
              <button
                type="button"
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                {showNewAddressForm ? '− Hide Address Form' : '+ Add New Address'}
              </button>

              {showNewAddressForm && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={formData.shippingAddress.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, street: e.target.value }
                      }))}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      required
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={formData.shippingAddress.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                      }))}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={formData.shippingAddress.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, state: e.target.value }
                      }))}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Zip Code *"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, zipCode: e.target.value }
                      }))}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Phone Number *"
                    value={formData.shippingAddress.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, phone: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    required
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.saveAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, saveAddress: e.target.checked }))}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Save this address to my account
                  </label>
                </div>
              )}
            </div>

            {/* Payment Method - Only COD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Payment Method
              </h2>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">Cash on Delivery</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Pay when you receive your order</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                No payment required now. Pay at your doorstep.
              </div>
            </div>

            {/*  Coupon Display - Shows only if discount > 0 */}
            {appliedCoupon && couponDiscount > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <Tag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {appliedCoupon.discountType === 'percentage'
                            ? `${appliedCoupon.discountValue}% Off`
                            : `Rs.${appliedCoupon.discountValue} Off`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{appliedCoupon.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-xs text-emerald-600 font-medium">
                   Discount applied: -Rs.{couponDiscount.toLocaleString()}
                </div>
              </div>
            )}

            {/* Order Summary (Mobile) */}
            <div className="lg:hidden">
              <OrderSummary
                items={cartItems}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                tax={tax}
                couponDiscount={couponDiscount}
                couponCode={appliedCoupon?.code}
                total={total}
              />
            </div>

            {/* Terms & Submit */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                  className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">
                  I agree to the{' '}
                  <Link to="/terms" className="text-indigo-600 hover:underline">Terms & Conditions</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
                </span>
              </label>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !formData.agreeTerms}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Place Order • Rs.{total.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Order Summary (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <OrderSummary
                items={cartItems}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                tax={tax}
                couponDiscount={couponDiscount}
                couponCode={appliedCoupon?.code}
                total={total}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Order Summary Component
function OrderSummary({ items, subtotal, deliveryFee, tax, couponDiscount, couponCode, total }) {
  const [expanded, setExpanded] = useState(false);
  const originalTotal = subtotal + deliveryFee + tax;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>

      {/* Items */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {items.slice(0, expanded ? items.length : 2).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
              <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold text-slate-900">Rs.{item.total.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {items.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2"
        >
          {expanded ? 'Show less' : `+ ${items.length - 2} more items`}
        </button>
      )}

      <div className="border-t border-slate-100 mt-4 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>Rs.{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? 'FREE' : `Rs.${deliveryFee}`}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tax (5%)</span>
          <span>Rs.{tax.toLocaleString()}</span>
        </div>

        {/*  Show coupon discount */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Coupon Discount ({couponCode || 'Applied'})</span>
            <span>-Rs.{couponDiscount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 mt-4 pt-4">
        {/*  Show original price with strikethrough */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>Original Total</span>
            <span className="line-through">Rs.{originalTotal.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline">
          <span className="font-bold text-slate-900">Total</span>
          <span className="font-extrabold text-2xl text-indigo-600">
            Rs.{Math.max(0, total).toLocaleString()}
          </span>
        </div>

        {/*  Show savings */}
        {couponDiscount > 0 && (
          <div className="mt-1 text-right">
            <span className="text-xs font-semibold text-emerald-600">
              You saved Rs.{couponDiscount.toLocaleString()}!
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        Secure checkout • 256-bit encrypted
      </div>
    </div>
  );
}