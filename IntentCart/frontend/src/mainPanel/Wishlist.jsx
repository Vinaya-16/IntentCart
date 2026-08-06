import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ChevronDown,
  Filter,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  ArrowUpDown,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Loader2,
  WifiOff,
  RefreshCw,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const API_URL = 'http://localhost:5000/api/customer';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isServerDown, setIsServerDown] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const getToken = () => localStorage.getItem('token');

  // Fetch wishlist
  const fetchWishlist = async () => {
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

      const response = await fetch(`${API_URL}/wishlist`, {
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
        throw new Error('Failed to fetch wishlist');
      }

      const data = await response.json();
      if (data.success) {
        // Format wishlist items
        const items = data.wishlist?.products?.map(item => ({
          id: item.productId?._id || item._id,
          category: item.productId?.categoryId?.name || 'Uncategorized',
          brand: item.productId?.brand || item.productId?.merchantId?.businessName || 'Unknown',
          name: item.productId?.name || 'Product',
          price: item.productId?.price || 0,
          originalPrice: item.productId?.compareAtPrice || item.productId?.price || 0,
          discount: item.productId?.discount || 0,
          inStock: (item.productId?.stock || 0) > 0,
          image: item.productId?.images?.[0]?.url || null,
          slug: item.productId?.slug || '',
          productId: item.productId?._id
        })) || [];
        
        setWishlistItems(items);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
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

  // Remove from wishlist
  const handleDelete = async (productId) => {
    try {
      setActionLoading(productId);
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setActionLoading(null);
        return;
      }

      const response = await fetch(`${API_URL}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Clear all wishlist
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your entire wishlist?')) return;

    try {
      setActionLoading('clear');
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setActionLoading(null);
        return;
      }

      // Delete all items one by one
      for (const item of wishlistItems) {
        await fetch(`${API_URL}/wishlist/${item.productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setWishlistItems([]);
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Move to cart
  const handleMoveToCart = async (productId, quantity = 1) => {
    try {
      setActionLoading(productId);
      setError('');

      const token = getToken();
      if (!token) {
        setError('Please login first');
        setActionLoading(null);
        return;
      }

      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const data = await response.json();
      if (data.success) {
        // Remove from wishlist after adding to cart
        await handleDelete(productId);
        alert('Item moved to cart successfully!');
      }
    } catch (err) {
      console.error('Error moving to cart:', err);
      setError(err.message);
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(wishlistItems.map((i) => i.category)))];
  }, [wishlistItems]);

  const processedItems = useMemo(() => {
    let result = wishlistItems.filter((item) => {
      if (filter === 'all') return true;
      return item.category.toLowerCase() === filter.toLowerCase();
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [wishlistItems, filter, sortBy]);

  const inStockCount = wishlistItems.filter((item) => item.inStock).length;

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
                onClick={fetchWishlist}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          )}

          {/* Header Banner Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Wishlist</h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium max-w-xl">
                Items saved for later. Move available items to your cart before promotional offers expire.
              </p>
            </div>

            {/* Quick Actions */}
            {wishlistItems.length > 0 && (
              <div className="flex items-center gap-3 self-start md:self-auto">
                <button
                  onClick={handleClearAll}
                  disabled={actionLoading === 'clear'}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50/80 border border-slate-200 hover:border-rose-200 px-4 py-2.5 rounded-xl shadow-xs transition-all duration-200 disabled:opacity-50"
                >
                  {actionLoading === 'clear' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Main Layout Grid */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Sidebar Controls */}
            <aside className="w-full lg:w-64 shrink-0 space-y-6 lg:sticky lg:top-8">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Categories</h2>
                  </div>
                </div>

                <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                  {categories.map((cat) => {
                    const isActive = filter.toLowerCase() === cat.toLowerCase();
                    const count = cat === 'all'
                      ? wishlistItems.length
                      : wishlistItems.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length;

                    return (
                      <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`whitespace-nowrap lg:whitespace-normal shrink-0 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${isActive
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                          }`}
                      >
                        <span className="capitalize">{cat}</span>
                        <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sorting Options */}
                {wishlistItems.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sort By</span>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                )}
              </div>
            </aside>

            {/* Wishlist Grid Container */}
            <main className="flex-1 w-full">
              {processedItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(item.productId)}
                        disabled={actionLoading === item.productId}
                        aria-label="Remove item"
                        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full shadow-xs transition-colors duration-200 border border-slate-200/50 disabled:opacity-50"
                      >
                        {actionLoading === item.productId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      {/* Image Container */}
                      <Link to={`/product/${item.slug}`} className="w-full aspect-[4/4.5] bg-gradient-to-br from-slate-50 to-slate-100 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                        )}

                        {/* Brand Pill */}
                        <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-xs">
                          {item.brand}
                        </span>

                        {/* Discount Tag */}
                        {item.discount > 0 && (
                          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-xs">
                            {item.discount}% OFF
                          </span>
                        )}
                      </Link>

                      {/* Content Card Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                            {item.category}
                          </p>
                          <Link to={`/product/${item.slug}`}>
                            <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                              {item.name}
                            </h3>
                          </Link>

                          {/* Pricing */}
                          <div className="flex items-baseline gap-2 mt-3">
                            <span className="text-lg font-extrabold text-slate-900">
                              ₹{item.price.toLocaleString()}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-xs font-semibold text-slate-400 line-through">
                                ₹{item.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Stock Status */}
                          <div className="mt-2.5">
                            {item.inStock ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-50/80 px-2.5 py-0.5 rounded-full">
                                <XCircle className="w-3.5 h-3.5" /> Out of Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Move to Cart Action Button */}
                        <button
                          onClick={() => handleMoveToCart(item.productId)}
                          disabled={!item.inStock || actionLoading === item.productId}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${item.inStock
                              ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-sm active:scale-[0.99]'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'
                            }`}
                        >
                          {actionLoading === item.productId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
                          )}
                          <span>{item.inStock ? 'Move to Cart' : 'Currently Unavailable'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty Wishlist State */
                <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs max-w-lg mx-auto my-6">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-indigo-50/50">
                    <Heart className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Your Wishlist is Empty</h3>
                  <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed max-w-xs mx-auto">
                    Looks like you haven't saved any items yet. Start exploring our collections to add your favorites!
                  </p>
                  <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs tracking-wide uppercase hover:bg-indigo-700 transition shadow-sm hover:shadow">
                    <ShoppingBag className="w-4 h-4" /> Start Shopping
                  </Link>
                </div>
              )}
            </main>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}