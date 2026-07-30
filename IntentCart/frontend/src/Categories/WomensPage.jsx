import React, { useState, useMemo, useCallback } from 'react';
import {
  Heart,
  Star,
  ShoppingBag,
  Search,
  X,
  ChevronDown,
  Check,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';
import Layout from '../components/Layout';

// Products Data
const womenProducts = [
  {
    id: 1,
    name: 'Floral Print Silk Maxi Dress',
    brand: 'ZARA',
    price: 4999,
    originalPrice: 7999,
    discount: 38,
    rating: 4.5,
    reviews: 120,
    image: '',
    category: 'Dresses',
    isNew: true,
  },
  {
    id: 2,
    name: 'High-Waist Slim Fit Jeans',
    brand: "LEVI'S",
    price: 3599,
    originalPrice: 4999,
    discount: 28,
    rating: 4.3,
    reviews: 89,
    image: '',
    category: 'Jeans',
    isNew: false,
  },
  {
    id: 3,
    name: 'Silk Blouse with Bow Detail',
    brand: 'MANGO',
    price: 2799,
    originalPrice: 3999,
    discount: 30,
    rating: 4.6,
    reviews: 67,
    image: '',
    category: 'Tops',
    isNew: true,
  },
  {
    id: 4,
    name: 'Classic Leather Ankle Boots',
    brand: 'ALDO',
    price: 6499,
    originalPrice: 8999,
    discount: 28,
    rating: 4.7,
    reviews: 45,
    image: '',
    category: 'Footwear',
    isNew: false,
  },
  {
    id: 5,
    name: 'Tailored Cashmere Wrap Coat',
    brand: 'H&M',
    price: 8999,
    originalPrice: 12999,
    discount: 31,
    rating: 4.8,
    reviews: 34,
    image: '',
    category: 'Outerwear',
    isNew: false,
  },
  {
    id: 6,
    name: 'Pleated Satin Midi Skirt',
    brand: 'ZARA',
    price: 3499,
    originalPrice: 4999,
    discount: 30,
    rating: 4.4,
    reviews: 56,
    image: '',
    category: 'Skirts',
    isNew: true,
  },
  {
    id: 7,
    name: 'Embroidered Silk Evening Gown',
    brand: 'MANGO',
    price: 7999,
    originalPrice: 11999,
    discount: 33,
    rating: 4.9,
    reviews: 23,
    image: '',
    category: 'Dresses',
    isNew: false,
  },
  {
    id: 8,
    name: 'Minimalist Leather Shoulder Bag',
    brand: 'ALDO',
    price: 4999,
    originalPrice: 6999,
    discount: 29,
    rating: 4.5,
    reviews: 78,
    image: '',
    category: 'Accessories',
    isNew: false,
  },
];

const categories = ['All', 'Dresses', 'Tops', 'Jeans', 'Skirts', 'Outerwear', 'Footwear', 'Accessories'];

// Product Card Component
function ProductCard({ product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  }, []);

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <ShoppingBag size={32} className="text-gray-300" />
          </div>
        )}

        {/* Discount Badge */}
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            -{product.discount}%
          </span>
        )}

        {/* New Badge */}
        {product.isNew && (
          <span className="absolute top-12 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            NEW
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
        >
          <Heart
            size={16}
            className={isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}
          />
        </button>

        {/* Quick Add Button - shows on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-900 hover:bg-gray-50'
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> Quick Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            {product.brand}
          </span>
          <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-900">{product.rating}</span>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-rose-600 transition-colors">
          {product.name}
        </h3>

        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function WomensPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Filter & Sort Logic - using useMemo for performance
  const filteredProducts = useMemo(() => {
    let result = womenProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        result.sort((a, b) => b.discount - a.discount);
        break;
      case 'newest':
        result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        break;
      default:
        break;
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy]);

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'discount', label: 'Biggest Discount' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-600/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium mb-3">
                <Sparkles size={14} /> Autumn / Winter 2024
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                Womenswear
              </h1>
              <p className="text-gray-300 text-sm sm:text-base max-w-xl">
                Curated essentials, signature evening silhouettes, and modern everyday wear.
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
              <div className="text-center">
                <div className="text-xl font-bold">{womenProducts.length}</div>
                <div className="text-xs text-gray-400">Products</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-xl font-bold text-rose-400">{Math.max(...womenProducts.map(p => p.discount))}%</div>
                <div className="text-xs text-gray-400">Max Discount</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-400">{womenProducts.filter(p => p.isNew).length}</div>
                <div className="text-xs text-gray-400">New Arrivals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls - No sticky to prevent vibration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative min-w-[180px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-9 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto mt-4 pb-1">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="text-gray-900 font-semibold">{filteredProducts.length}</span> items
          </p>
          {(selectedCategory !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">No products found</h3>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}