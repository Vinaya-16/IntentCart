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
  Image as ImageIcon 
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

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
  const totalSavings = cartItems.reduce(
    (acc, item) => acc + (item.originalPrice - item.price) * item.quantity,
    0
  );
  const promoDiscount = discountApplied ? 500 : 0;
  const deliveryFee = subtotal > 1000 || cartItems.length === 0 ? 0 : 99;
  const finalTotal = subtotal - totalSavings - promoDiscount + deliveryFee;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8 pb-5 border-b-2 border-gray-100">
          <h1 className="text-3xl font-black text-black tracking-tight">Shopping Cart</h1>
          <span className="bg-[#5c63f6] text-white text-sm font-black px-3 py-1 rounded-full">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Items
          </span>
        </div>

        {cartItems.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Items Column */}
            <main className="flex-1 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition"
                >
                  {/* Product Image Placeholder */}
                  <div className="w-full sm:w-28 aspect-square bg-stone-100 rounded-xl flex items-center justify-center shrink-0 border border-gray-200">
                    <ImageIcon className="w-8 h-8 text-stone-300" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 w-full space-y-1">
                    <span className="text-xs font-black text-[#5c63f6] uppercase tracking-wider">
                      {item.brand}
                    </span>
                    <h3 className="font-bold text-base text-black truncate">{item.name}</h3>
                    <p className="text-xs font-medium text-gray-500">Variant: {item.selectedVariant}</p>

                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-lg font-black text-black">Rs. {item.price}</span>
                      <span className="text-xs font-bold text-gray-400 line-through">
                        Rs. {item.originalPrice}
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Delete Actions */}
                  <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-stone-50">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 hover:bg-stone-200 text-gray-700 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="px-3 text-sm font-black text-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 hover:bg-stone-200 text-gray-700 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition p-1.5 hover:bg-red-50 rounded-lg"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </main>

            {/* Right Summary Column */}
            <aside className="w-full lg:w-80 shrink-0 space-y-6">
              
              {/* Coupon Code Card */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-stone-50/50 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-[#5c63f6]" />
                  <h3 className="font-black text-sm text-black">Apply Coupon</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. EOSS500)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-bold border border-gray-300 rounded-xl uppercase focus:outline-none focus:border-[#5c63f6]"
                  />
                  <button
                    onClick={() => setDiscountApplied(true)}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-black transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
                <h3 className="font-black text-lg text-black border-b border-gray-200 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-3 text-sm font-bold text-gray-700">
                  <div className="flex justify-between">
                    <span>Total MRP</span>
                    <span className="text-black">Rs. {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount on MRP</span>
                    <span>- Rs. {totalSavings}</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Promo Coupon</span>
                      <span>- Rs. 500</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : `Rs. ${deliveryFee}`}</span>
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-black text-base text-black">Total Amount</span>
                  <span className="font-black text-2xl text-[#5c63f6]">Rs. {finalTotal}</span>
                </div>

                <button className="w-full bg-[#5c63f6] hover:bg-[#4853e8] text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition">
                  Proceed To Checkout <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Trust Badges */}
                <div className="pt-2 space-y-2 text-xs font-bold text-gray-500 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Secure Checkout
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" /> Free Returns & Exchanges
                  </div>
                </div>
              </div>

            </aside>
          </div>
        ) : (
          /* Empty Cart View */
          <div className="text-center py-20 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-200/60 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="font-black text-xl text-black mb-1">Your Cart is Empty</h3>
            <p className="text-sm text-gray-500 font-medium">
              Looks like you haven't added anything to your cart yet.
            </p>
          </div>
        )}
      </main>

      <div className="border-t-4 border-[#5c63f6] mt-16">
        <Footer />
      </div>
    </div>
  );
}