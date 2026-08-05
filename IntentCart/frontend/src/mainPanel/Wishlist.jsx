import React, { useState } from 'react';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ChevronDown,
  Filter,
  CheckCircle2,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';

import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function WishlistPage() {
  const [filter, setFilter] = useState('all');
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 1,
      category: 'Watches',
      brand: 'Titan',
      name: 'Titan Edge Premium Analog Watch',
      price: 4995,
      originalPrice: 6995,
      discount: '28% OFF',
      inStock: true
    },
    {
      id: 2,
      category: 'Watches',
      brand: 'Fastrack',
      name: 'Fastrack Smartwatch Series 5',
      price: 2499,
      originalPrice: 4999,
      discount: '50% OFF',
      inStock: true
    },
    {
      id: 3,
      category: 'Footwear',
      brand: 'US Polo Assn.',
      name: 'Classic Leather Casual Sneakers',
      price: 3299,
      originalPrice: 3999,
      discount: '17% OFF',
      inStock: false
    },
    {
      id: 4,
      category: 'Apparel',
      brand: 'Levis',
      name: 'Slim Fit Dark Wash Denim Jacket',
      price: 2799,
      originalPrice: 4499,
      discount: '37% OFF',
      inStock: true
    }
  ]);

  const handleDelete = (id) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setWishlistItems([]);
  };

  const filteredItems = wishlistItems.filter((item) => {
    if (filter === 'all') return true;
    return item.category.toLowerCase() === filter.toLowerCase();
  });

  const categories = ['all', ...Array.from(new Set(wishlistItems.map((i) => i.category)))];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b-2 border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-black tracking-tight">My Wishlist</h1>
              <span className="bg-[#5c63f6] text-white text-sm font-black px-3 py-1 rounded-full">
                {wishlistItems.length} Saved
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium mt-1">
              Items you've saved for later. Move them to your cart before offers end!
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition self-start sm:self-auto bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" /> Clear Entire Wishlist
            </button>
          )}
        </div>

        {/* Layout Grid */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Sidebar Filter */}
          <aside className="w-full md:w-64 shrink-0 space-y-6">
            <div className="border border-gray-200 rounded-2xl p-5 bg-stone-50/50 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#5c63f6]" />
                  <h3 className="font-black text-base text-black">Categories</h3>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 md:hidden" />
              </div>

              <div className="space-y-1.5">
                {categories.map((cat) => {
                  const isActive = filter.toLowerCase() === cat.toLowerCase();
                  const count = cat === 'all' 
                    ? wishlistItems.length 
                    : wishlistItems.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all text-left ${
                        isActive
                          ? 'bg-[#5c63f6] text-white shadow-sm'
                          : 'text-gray-700 hover:bg-stone-200/60'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Wishlist Items Grid */}
          <main className="flex-1">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex flex-col bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-[#5c63f6]/40 hover:shadow-md transition duration-300"
                  >
                    {/* Delete Icon Button */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      aria-label="Remove item"
                      className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full shadow-sm transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Image Placeholder */}
                    <div className="w-full aspect-[4/4.5] bg-stone-100 relative flex items-center justify-center border-b border-gray-100">
                      <ImageIcon className="w-12 h-12 text-stone-300" />
                      <span className="absolute bottom-3 left-3 bg-black/70 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                        {item.brand}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-snug group-hover:text-[#5c63f6] transition">
                          {item.name}
                        </h3>

                        {/* Price */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-black text-black">Rs. {item.price}</span>
                          <span className="text-xs font-bold text-gray-400 line-through">
                            Rs. {item.originalPrice}
                          </span>
                          <span className="text-xs font-black text-emerald-600">
                            {item.discount}
                          </span>
                        </div>

                        {/* Availability */}
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold">
                          {item.inStock ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Move to Cart CTA */}
                      <button
                        disabled={!item.inStock}
                        className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition ${
                          item.inStock
                            ? 'bg-[#5c63f6] text-white hover:bg-[#4853e8] shadow-sm'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {item.inStock ? 'Move To Cart' : 'Out Of Stock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Wishlist View */
              <div className="text-center py-20 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                <div className="w-16 h-16 bg-stone-200/60 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="font-black text-xl text-black mb-1">Your Wishlist is Empty</h3>
                <p className="text-sm text-gray-500 font-medium">
                  Explore products and tap the heart icon to save items for later.
                </p>
              </div>
            )}
          </main>
        </div>
      </main>

      <div className="border-t-4 border-[#5c63f6] mt-16">
        <Footer />
      </div>
    </div>
  );
}