import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const API_URL = 'http://localhost:5000/api/customer';

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

  const getToken = () => localStorage.getItem('token');

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

      const response = await fetch(`${API_URL}/cart`, {
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

      const response = await fetch(`${API_URL}/cart/${itemId}`, {
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
        setCartItems(prev => 
          prev.map(i => 
            i.id === itemId ? { ...i, quantity: newQty, total: i.price * newQty } : i
          )
        );
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

      const response = await fetch(`${API_URL}/cart/${itemId}`, {
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
        setCartItems(prev => prev.filter(i => i.id !== itemId));
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

      const response = await fetch(`${API_URL}/cart/clear`, {
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
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    navigate('/');
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Pricing calculations
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);
  const totalSavings = cartItems.reduce(
    (acc, item) => acc + ((item.originalPrice - item.price) * item.quantity),
    0
  );
  const discountedSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const promoDiscount = discountApplied ? 500 : 0;

  const freeShippingThreshold = 5000;
  const deliveryFee = discountedSubtotal >= freeShippingThreshold || cartItems.length === 0 ? 0 : 99;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - discountedSubtotal);
  const shippingProgress = Math.min(100, (discountedSubtotal / freeShippingThreshold) * 100);

  const finalTotal = Math.max(0, discountedSubtotal - promoDiscount + deliveryFee);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'EOSS500') {
      setDiscountApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try "EOSS500"');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountApplied(false);
    setCouponCode('');
    setCouponError('');
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

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
              <X /> {error}
            </div>
          )}

          {/* Server Down */}
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

          {/* Header Banner */}
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
              {/* Left Column: Items & Free Shipping Progress */}
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
                          Add <strong className="text-slate-900">₹{amountNeededForFreeShipping.toLocaleString()}</strong> more to get <strong className="text-indigo-600">Free Shipping</strong>
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

                {/* Cart Items List */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition duration-200"
                    >
                      {/* Thumbnail */}
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

                      {/* Product Meta */}
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
                            ₹{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice > item.price && (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                              ₹{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Remove */}
                      <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={actionLoading === item.id || item.quantity <= 1}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="px-3.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={actionLoading === item.id || item.quantity >= item.stock}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={actionLoading === item.id}
                          className="text-slate-400 hover:text-rose-600 transition p-2 hover:bg-rose-50 rounded-xl disabled:opacity-50"
                          aria-label="Delete item"
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

                {/* Clear Cart Button */}
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
                          placeholder="Code (e.g. EOSS500)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs font-semibold uppercase bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          className="bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-[0.98]"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] font-semibold text-rose-500">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-2 text-xs text-emerald-800 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span><strong>EOSS500</strong> Applied</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-emerald-700 hover:text-rose-600 p-1 transition"
                        aria-label="Remove coupon"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
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
                      <span className="text-slate-900 font-bold">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount on MRP</span>
                      <span>-₹{totalSavings.toLocaleString()}</span>
                    </div>
                    {discountApplied && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Promo Discount</span>
                        <span>-₹500</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-600 font-bold">FREE</span>
                        ) : (
                          `₹${deliveryFee}`
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
                      ₹{finalTotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" /> Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Trust Badges */}
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
            /* Empty Cart View */
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