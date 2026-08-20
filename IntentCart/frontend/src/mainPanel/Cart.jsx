import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Lock,
  ArrowLeft,
  Loader2,
  WifiOff,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { toast, Toaster } from 'react-hot-toast';

const API_BASE_URI = import.meta.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URI}` || 'http://localhost:5000/api';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [cartId, setCartId] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState([]);

  const cartTrackedRef = useRef(false);
  const getToken = () => localStorage.getItem('token');

  // Fetch all campaigns from backend
  const fetchCampaigns = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('No token found');
        return;
      }

      // console.log('Fetching campaigns from DB...');

      const response = await fetch(`${API_URL}/merchant/campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log('Full API Response:', data);

        if (data.success && data.campaigns) {
          setAllCampaigns(data.campaigns);
          // console.log('Total campaigns from DB:', data.campaigns.length);

          // Log all campaigns with their coupon codes
          data.campaigns.forEach(c => {
            // console.log(`Campaign: ${c.name}, Status: ${c.status}, Coupon Code: ${c.couponCode || 'NO CODE'}`);
          });

          // Filter active campaigns with couponCode (not coupon)
          const activeCoupons = data.campaigns
            .filter(c => c.status === 'active' && c.couponCode)
            .map(c => ({
              code: c.couponCode,
              name: c.name,
              description: c.description,
              discountType: c.discountType || 'percentage',
              discountValue: c.discountValue || 0,
              minOrderAmount: c.minOrderAmount || 0,
              maxDiscountAmount: c.maxDiscountAmount || 0,
              maxUses: c.maxUses,
              totalUses: c.totalUses || 0,
              endDate: c.endDate,
              _id: c._id
            }));

          // console.log('Active coupons found (with couponCode):', activeCoupons.length);
          // console.log('Coupon codes:', activeCoupons.map(c => c.code));

          if (activeCoupons.length > 0) {
            setAvailableCoupons(activeCoupons);
          } else {
            console.log('No active coupons found in DB');
            // Check if there are any campaigns with couponCode regardless of status
            const allWithCoupons = data.campaigns.filter(c => c.couponCode);
            // console.log('All campaigns with couponCode (any status):', allWithCoupons.length);
            // console.log('Their statuses:', allWithCoupons.map(c => ({ name: c.name, status: c.status, code: c.couponCode })));
          }
        }
      } else {
        console.error('Failed to fetch campaigns:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  // Fetch cart
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError('');
      setIsServerDown(false);

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/customer/cart`, {
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
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();

      if (data.success) {
        setCartId(data.cart?._id);

        const items = data.cart?.items?.map(item => {
          const product = item.productId || {};
          return {
            id: item._id || product._id,
            productId: product._id,
            brand: product.brand || product.merchantId?.businessName || 'Unknown',
            name: product.name || 'Product',
            price: item.price || product.price || 0,
            originalPrice: product.compareAtPrice || product.price || 0,
            quantity: item.quantity || 1,
            image: product.images && product.images.length > 0 ? product.images[0]?.url : null,
            slug: product.slug || '',
            stock: product.stock || 0,
            total: item.total || (item.price * item.quantity) || 0
          };
        }) || [];

        setCartItems(items);
        cartTrackedRef.current = false;
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
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

  // Track cart view
  useEffect(() => {
    if (cartItems.length > 0 && !cartTrackedRef.current) {
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartTrackedRef.current = true;
    }
  }, [cartItems]);

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Update quantity
  const updateQuantity = async (itemId, change) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty < 1) return;
    if (newQty > item.stock) {
      setError(`Only ${item.stock} items available in stock`);
      return;
    }

    try {
      setActionLoading(itemId);
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setActionLoading(null);
        return;
      }

      const response = await fetch(`${API_URL}/customer/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQty })
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      const data = await response.json();
      if (data.success) {
        const updatedItems = cartItems.map(i =>
          i.id === itemId ? { ...i, quantity: newQty, total: i.price * newQty } : i
        );
        setCartItems(updatedItems);
        cartTrackedRef.current = false;

        // Re-validate coupon if one is applied
        if (discountApplied && appliedCoupon) {
          await validateCoupon(appliedCoupon.code);
        }
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Remove item
  const removeItem = async (itemId) => {
    try {
      setActionLoading(itemId);
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setActionLoading(null);
        return;
      }

      const response = await fetch(`${API_URL}/customer/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const data = await response.json();
      if (data.success) {
        const updatedItems = cartItems.filter(i => i.id !== itemId);
        setCartItems(updatedItems);
        cartTrackedRef.current = false;

        // Remove coupon if cart is empty
        if (updatedItems.length === 0) {
          setDiscountApplied(false);
          setAppliedCoupon(null);
          setCouponCode('');
        } else if (discountApplied && appliedCoupon) {
          await validateCoupon(appliedCoupon.code);
        }
      }
    } catch (err) {
      console.error('Error removing item:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    try {
      setActionLoading('clear');
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setActionLoading(null);
        return;
      }

      const response = await fetch(`${API_URL}/customer/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      setCartItems([]);
      setDiscountApplied(false);
      setAppliedCoupon(null);
      setCouponCode('');
      cartTrackedRef.current = false;
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Validate coupon against backend
  const validateCoupon = async (code) => {
    try {
      setValidatingCoupon(true);
      const token = getToken();
      if (!token) {
        setCouponError('Please login first');
        setValidatingCoupon(false);
        return false;
      }

      const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      // Get user ID from localStorage
      let customerId = null;
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        customerId = user?._id || null;
      } catch (e) {
        console.error('Error parsing user:', e);
      }

      // console.log('Validating coupon:', { code, subtotal, customerId });

      const response = await fetch(`${API_URL}/merchant/campaigns/validate-coupon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          couponCode: code,
          orderAmount: subtotal,
          customerId: customerId
        })
      });

      const data = await response.json();
      // console.log('Coupon validation response:', data);

      if (response.ok && data.success) {
        setAppliedCoupon({
          code: code,
          ...data.coupon
        });
        setDiscountApplied(true);
        setCouponError('');
        toast.success(`Coupon ${code} applied successfully!`);
        setValidatingCoupon(false);
        return true;
      } else {
        setCouponError(data.message || 'Invalid coupon code');
        setDiscountApplied(false);
        setAppliedCoupon(null);
        setValidatingCoupon(false);
        toast.error(data.message || 'Invalid coupon code');
        return false;
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Error validating coupon. Please try again.');
      setValidatingCoupon(false);
      return false;
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const code = couponCode.trim().toUpperCase();
    await validateCoupon(code);
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setDiscountApplied(false);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.success('Coupon removed');
  };

  // Quick apply coupon
  const handleQuickApplyCoupon = async (code) => {
    setCouponCode(code);
    await validateCoupon(code);
  };

  const getCouponDataForCheckout = () => {
    if (discountApplied && appliedCoupon) {
      const discountAmount = getDiscountAmount();
      return {
        couponCode: appliedCoupon.code,
        discountAmount: discountAmount,
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
        maxDiscountAmount: appliedCoupon.maxDiscountAmount,
        name: appliedCoupon.name,
        description: appliedCoupon.description,
        minOrderAmount: appliedCoupon.minOrderAmount
      };
    }
    return null;
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    // Get coupon data
    const couponData = getCouponDataForCheckout();
    // console.log('Sending coupon data to checkout:', couponData);

    // Pass coupon data via state
    navigate('/checkout', {
      state: {
        couponData: couponData,
        cartItems: cartItems
      }
    });
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    navigate('/');
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Calculate discount amount
  const getDiscountAmount = () => {
    if (!appliedCoupon || !discountApplied) return 0;

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (appliedCoupon.discountType === 'percentage') {
      let discount = subtotal * (appliedCoupon.discountValue / 100);
      if (appliedCoupon.maxDiscountAmount > 0 && discount > appliedCoupon.maxDiscountAmount) {
        discount = appliedCoupon.maxDiscountAmount;
      }
      return Math.round(discount);
    } else if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.discountValue, subtotal);
    }
    return 0;
  };

  // Pricing calculations
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);
  const totalSavings = cartItems.reduce(
    (acc, item) => acc + ((item.originalPrice - item.price) * item.quantity),
    0
  );
  const discountedSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const promoDiscount = getDiscountAmount();

  const freeShippingThreshold = 5000;
  const deliveryFee = discountedSubtotal >= freeShippingThreshold || cartItems.length === 0 ? 0 : 99;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - discountedSubtotal);
  const shippingProgress = Math.min(100, (discountedSubtotal / freeShippingThreshold) * 100);

  const finalTotal = Math.max(0, discountedSubtotal - promoDiscount + deliveryFee);

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

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 flex flex-col justify-between">
      <Toaster position="top-right" />
      <div>
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
              <X className="inline mr-1" /> {error}
            </div>
          )}

          {isServerDown && (
            <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
              <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
              <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
              <p className="mb-4">{error}</p>
              <button
                onClick={fetchCart}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Shopping Cart</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {cartItems.length > 0 && (
              <button
                onClick={handleContinueShopping}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
              </button>
            )}
          </div>

          {cartItems.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 w-full space-y-6">
                {/* Free Shipping Progress Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      {amountNeededForFreeShipping === 0 ? (
                        <span className="text-emerald-600 font-bold">You unlocked Free Express Shipping!</span>
                      ) : (
                        <span>
                          Add <strong className="text-slate-900">Rs.{amountNeededForFreeShipping.toLocaleString()}</strong> more to get <strong className="text-indigo-600">Free Shipping</strong>
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 font-medium">{Math.round(shippingProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${amountNeededForFreeShipping === 0 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${shippingProgress}%` }}
                    />
                  </div>
                </div>

                {/* Available Coupons Section - From DB */}
                {availableCoupons.length > 0 && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                    <button
                      onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                      className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                      <Tag className="w-4 h-4" />
                      {showAvailableCoupons ? 'Hide' : 'Show'} Available Coupons ({availableCoupons.length})
                    </button>
                    {showAvailableCoupons && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableCoupons.map((coupon, index) => (
                          <div
                            key={index}
                            className="border border-slate-200 rounded-lg p-3 hover:border-indigo-300 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-mono text-xs font-bold text-indigo-600">{coupon.code}</span>
                                <p className="text-[10px] text-slate-500 truncate">{coupon.name}</p>
                              </div>
                              <button
                                onClick={() => handleQuickApplyCoupon(coupon.code)}
                                disabled={discountApplied && appliedCoupon?.code === coupon.code || validatingCoupon}
                                className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                              >
                                {discountApplied && appliedCoupon?.code === coupon.code ? 'Applied' : 'Apply'}
                              </button>
                            </div>
                            <div className="flex gap-2 text-[8px] text-slate-400 mt-1">
                              <span>{coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `Rs.${coupon.discountValue} Off`}</span>
                              {coupon.minOrderAmount > 0 && <span>Min: Rs.{coupon.minOrderAmount}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cart Items List */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition duration-200"
                    >
                      <div className="w-full sm:w-28 aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 w-full space-y-1">
                        <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">
                          {item.brand}
                        </span>
                        <Link to={`/product/${item.slug}`}>
                          <h3 className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition truncate">
                            {item.name}
                          </h3>
                        </Link>

                        <div className="flex items-baseline gap-2 pt-2">
                          <span className="text-base font-extrabold text-slate-900">
                            Rs.{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice > item.price && (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                              Rs.{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={actionLoading === item.id || item.quantity <= 1}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="px-3.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={actionLoading === item.id || item.quantity >= item.stock}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={actionLoading === item.id}
                          className="text-slate-400 hover:text-rose-600 transition p-2 hover:bg-rose-50 rounded-xl disabled:opacity-50"
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {cartItems.length > 1 && (
                  <button
                    onClick={clearCart}
                    disabled={actionLoading === 'clear'}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === 'clear' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Clear All Items
                  </button>
                )}
              </div>

              {/* Right Column: Order Summary */}
              <aside className="w-full lg:w-96 shrink-0 space-y-5 lg:sticky lg:top-8">
                {/* Promo Code Box */}
                <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Promo Code</h2>
                  </div>

                  {!discountApplied ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 text-xs font-semibold uppercase bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon}
                          className="bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-[0.98] disabled:opacity-50"
                        >
                          {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] font-semibold text-rose-500">{couponError}</p>
                      )}
                      {availableCoupons.length > 0 && (
                        <p className="text-[10px] text-slate-400">
                          Try: {availableCoupons.slice(0, 3).map(c => c.code).join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-2 text-xs text-emerald-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span><strong>{appliedCoupon?.code}</strong> Applied</span>
                          {appliedCoupon?.discountType === 'percentage' && (
                            <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded">
                              {appliedCoupon.discountValue}% Off
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-emerald-700 hover:text-rose-600 p-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {appliedCoupon && (
                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>{appliedCoupon.name}</span>
                          {appliedCoupon.minOrderAmount > 0 && (
                            <span>Min: Rs.{appliedCoupon.minOrderAmount}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Summary Breakdown */}
                <div className="border border-slate-200/80 rounded-2xl p-6 bg-white shadow-xs space-y-5">
                  <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Order Summary
                  </h2>

                  <div className="space-y-3 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Total MRP</span>
                      <span className="text-slate-900 font-bold">Rs.{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount on MRP</span>
                      <span>-Rs.{totalSavings.toLocaleString()}</span>
                    </div>
                    {discountApplied && promoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Promo Discount ({appliedCoupon?.code})</span>
                        <span>-Rs.{promoDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-600 font-bold">FREE</span>
                        ) : (
                          `Rs.${deliveryFee}`
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-sm text-slate-900">Total Amount</span>
                      <p className="text-[10px] text-slate-400 font-medium">Inclusive of all taxes</p>
                    </div>
                    <span className="font-extrabold text-2xl text-indigo-600">
                      Rs.{finalTotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" /> Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 space-y-2 text-[11px] font-semibold text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> 256-Bit Encrypted Secure Checkout
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-600" /> Hassle-Free Returns & Exchanges
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs max-w-lg mx-auto my-6">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-indigo-50/50">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your Cart is Empty</h3>
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed max-w-xs mx-auto">
                Looks like you haven't added anything to your cart yet. Discover popular items and start shopping!
              </p>
              <button
                onClick={handleContinueShopping}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs tracking-wide uppercase hover:bg-indigo-700 transition shadow-xs"
              >
                Start Shopping
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}