import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';

import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      brand: 'Titan',
      name: 'Titan Edge Premium Analog Watch',
      price: 4995,
      originalPrice: 6995,
      quantity: 1,
      selectedVariant: 'Silver / Leather'
    },
    {
      id: 2,
      brand: 'Fastrack',
      name: 'Fastrack Smartwatch Series 5',
      price: 2499,
      originalPrice: 4999,
      quantity: 2,
      selectedVariant: 'Black / Silicon'
    }
  ]);

  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const updateQuantity = (id, change) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

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

  // Pricing calculations
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
  const totalSavings = cartItems.reduce(
    (acc, item) => acc + (item.originalPrice - item.price) * item.quantity,
    0
  );
  const discountedSubtotal = subtotal - totalSavings;
  const promoDiscount = discountApplied ? 500 : 0;

  const freeShippingThreshold = 5000;
  const deliveryFee = discountedSubtotal >= freeShippingThreshold || cartItems.length === 0 ? 0 : 99;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - discountedSubtotal);
  const shippingProgress = Math.min(100, (discountedSubtotal / freeShippingThreshold) * 100);

  const finalTotal = Math.max(0, discountedSubtotal - promoDiscount + deliveryFee);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Shopping Cart</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {cartItems.length > 0 && (
              <a
                href="#continue-shopping"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
              </a>
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
                      className={`h-full transition-all duration-500 rounded-full ${amountNeededForFreeShipping === 0 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
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
                      {/* Thumbnail Placeholder */}
                      <div className="w-full sm:w-28 aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      </div>

                      {/* Product Meta */}
                      <div className="flex-1 min-w-0 w-full space-y-1">
                        <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">
                          {item.brand}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                        <p className="text-xs font-medium text-slate-500">Variant: {item.selectedVariant}</p>

                        <div className="flex items-baseline gap-2 pt-2">
                          <span className="text-base font-extrabold text-slate-900">
                            ₹{item.price.toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 line-through">
                            ₹{item.originalPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Selector & Remove Action */}
                      <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="px-3.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-2 hover:bg-rose-50 rounded-xl"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <span>- ${totalSavings.toLocaleString()}</span>
                    </div>
                    {discountApplied && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Promo Discount</span>
                        <span>- $500</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-600 font-bold">FREE</span>
                        ) : (
                          `$${deliveryFee}`
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
                      ${finalTotal.toLocaleString()}
                    </span>
                  </div>

                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition">
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
              <a
                href="#shop"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs tracking-wide uppercase hover:bg-indigo-700 transition shadow-xs"
              >
                Start Shopping
              </a>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}