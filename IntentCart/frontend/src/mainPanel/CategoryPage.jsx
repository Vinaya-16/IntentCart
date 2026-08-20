import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Loader2,
    ChevronRight,
    Home,
    ChevronDown,
    ShoppingBag,
    Star,
    Heart,
    Filter,
    Clock,
    X,
    Search,
    Tag,
    Copy,
    Check,
    Zap,
    ChevronUp,
    Image as ImageIcon
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import eventTracker from '../utils/eventTracker.js';

const API_URL = 'http://localhost:5000/api';

export default function CategoryPage() {
    const { path } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categoryData, setCategoryData] = useState(null);
    const [subcategories, setSubcategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);

    // Deal Corner State
    const [dealCornerCampaigns, setDealCornerCampaigns] = useState([]);
    const [saleHighlightCampaigns, setSaleHighlightCampaigns] = useState([]);
    const [promoBannerCampaign, setPromoBannerCampaign] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [campaignsLoaded, setCampaignsLoaded] = useState(false);
    const [dealCornerExpanded, setDealCornerExpanded] = useState(true);

    // Active filters
    const [selectedPrice, setSelectedPrice] = useState(5000);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch campaigns when category data is loaded
    useEffect(() => {
        if (categoryData) {
            fetchCampaigns();
        }
    }, [categoryData]);

    useEffect(() => {
        if (categoryData) {
            eventTracker.trackCategoryView(categoryData._id, categoryData.name);
        }
    }, [categoryData]);

    useEffect(() => {
        if (products.length > 0 && categoryData) {
            const productsToTrack = products.slice(0, 10);
            productsToTrack.forEach(product => {
                eventTracker.trackProductView(product._id, {
                    name: product.name,
                    price: product.price,
                    category: categoryData.name
                });
            });
        }
    }, [products, categoryData]);

    useEffect(() => {
        if (!path) return;
        const controller = new AbortController();
        fetchCategoryData(path, controller.signal);
        return () => controller.abort();
    }, [path]);

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/merchant/campaigns/public`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                'Content-Type': 'application/json'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const campaigns = data.campaigns || [];
                const activeCampaigns = campaigns.filter(c => c.status === 'active');

                const currentCategoryId = categoryData?._id;

                const relevantCampaigns = activeCampaigns.filter(campaign => {
                    if (!campaign.categoryIds || campaign.categoryIds.length === 0) {
                        return true;
                    }
                    return campaign.categoryIds.some(id =>
                        id.toString() === currentCategoryId?.toString()
                    );
                });

                // console.log(`Relevant campaigns for this category: ${relevantCampaigns.length}`);

                // Get all deals with coupon or discount
                const allDeals = relevantCampaigns
                    .filter(c => {
                        const hasCoupon = !!c.couponCode;
                        const hasDiscount = c.discountValue > 0;
                        const isFreeShipping = c.type === 'free_shipping';
                        const isBogo = c.type === 'bogo';
                        return hasCoupon || hasDiscount || isFreeShipping || isBogo;
                    })
                    .map(c => ({
                        _id: c._id,
                        brand: c.metadata?.brand || c.name,
                        offer: c.metadata?.offer || formatOffer(c),
                        discount: formatDiscount(c),
                        couponCode: c.couponCode,
                        type: c.type,
                        discountValue: c.discountValue,
                        discountType: c.discountType,
                        description: c.description,
                        endDate: c.endDate,
                        bg: c.metadata?.bg || getDealColor(),
                        imageUrl: c.imageUrl || c.image || null,
                        metadata: c.metadata
                    }));

                setDealCornerCampaigns(allDeals);

                // Get sale highlights
                const highlights = relevantCampaigns
                    .filter(c => c.metadata?.section === 'sale_highlights')
                    .map(c => ({
                        _id: c._id,
                        title: c.metadata?.title || c.name,
                        subtitle: c.metadata?.subtitle || '',
                        offer: c.metadata?.offer || formatOffer(c),
                        discount: c.metadata?.discount || formatDiscount(c),
                        bg: c.metadata?.bg || getRandomColor(),
                        couponCode: c.couponCode,
                        type: c.type,
                        imageUrl: c.imageUrl || c.image || null
                    }));

                setSaleHighlightCampaigns(highlights);

                // Get promo banner
                const promo = relevantCampaigns.find(c => c.metadata?.section === 'promo_banner');
                if (promo) {
                    setPromoBannerCampaign({
                        text: promo.description || `${promo.name} | ${formatDiscount(promo)}`,
                        couponCode: promo.couponCode,
                        extraDiscount: promo.metadata?.extraDiscount || '',
                        imageUrl: promo.imageUrl || promo.image || null
                    });
                } else if (relevantCampaigns.length > 0) {
                    const firstWithCoupon = relevantCampaigns.find(c => c.couponCode);
                    if (firstWithCoupon) {
                        setPromoBannerCampaign({
                            text: `${firstWithCoupon.name} | ${formatDiscount(firstWithCoupon)}`,
                            couponCode: firstWithCoupon.couponCode,
                            extraDiscount: '',
                            imageUrl: firstWithCoupon.imageUrl || firstWithCoupon.image || null
                        });
                    }
                }

                setCampaignsLoaded(true);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setCampaignsLoaded(true);
        }
    };

    // Helper: Format discount
    const formatDiscount = (campaign) => {
        if (!campaign) return 'Special Offer';
        if (campaign.discountType === 'percentage') {
            return `${campaign.discountValue}% Off`;
        } else if (campaign.discountType === 'fixed') {
            return `Rs.${campaign.discountValue} Off`;
        } else if (campaign.discountType === 'free_shipping') {
            return 'Free Shipping';
        }
        return 'Special Offer';
    };

    // Helper: Format offer
    const formatOffer = (campaign) => {
        if (!campaign) return 'Special Offer';
        if (campaign.type === 'bogo') return 'Buy 1 Get 1';
        if (campaign.type === 'flash_sale') return 'Flash Sale';
        if (campaign.type === 'free_shipping') return 'Free Shipping';
        return campaign.name || 'Special Offer';
    };

    // Helper: Get random color
    const getRandomColor = () => {
        const colors = [
            'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-900',
            'bg-purple-500', 'bg-blue-500', 'bg-teal-500',
            'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // Helper: Get deal color
    const getDealColor = () => {
        const colors = [
            'bg-amber-100/70 border-amber-200/50',
            'bg-pink-100/70 border-pink-200/50',
            'bg-green-100/70 border-green-200/50',
            'bg-purple-100/70 border-purple-200/50',
            'bg-blue-100/70 border-blue-200/50',
            'bg-yellow-100/70 border-yellow-200/50'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // Handle coupon copy
    const handleCopyCoupon = (couponCode) => {
        if (couponCode) {
            navigator.clipboard.writeText(couponCode);
            setCopiedCode(couponCode);
            setTimeout(() => setCopiedCode(null), 3000);
        }
    };

    const fetchCategoryData = async (categoryPath, signal) => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${API_URL}/categories/path/${categoryPath}`, { signal });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Category not found');
            }

            const data = await response.json();

            setCategoryData(data.currentCategory);
            setSubcategories(data.subcategories || []);
            setProducts(data.products || []);
            setBreadcrumbs(data.breadcrumbs || []);
            setTotalProducts(data.totalProducts || 0);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubcategoryNavigate = (slug) => {
        const currentPathSegments = path ? path.split('/') : [];
        if (currentPathSegments.includes(slug)) return;
        const newPath = [...currentPathSegments, slug].join('/');

        const subcategory = subcategories.find(s => s.slug === slug);
        if (subcategory) {
            eventTracker.trackCategoryView(subcategory._id, subcategory.name);
        }

        navigate(`/category/${newPath}`);
    };

    const handleBreadcrumbClick = (slug) => {
        navigate(`/category/${slug}`);
    };

    const getUniqueBrands = () => {
        const brands = new Set();
        products.forEach(p => {
            if (p.brand) brands.add(p.brand);
            if (p.merchant) brands.add(p.merchant);
        });
        return Array.from(brands);
    };

    const getSortedProducts = () => {
        const sorted = [...products];
        switch (sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'popular':
                return sorted.sort((a, b) => (b.orders || 0) - (a.orders || 0));
            default:
                return sorted;
        }
    };

    const getFilteredProducts = () => {
        let filtered = getSortedProducts();

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.brand?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
        }

        if (selectedCategories.length > 0) {
            filtered = filtered.filter(p =>
                selectedCategories.includes(p.categoryId) ||
                selectedCategories.includes(p.subcategoryId) ||
                selectedCategories.includes(p.microCategoryId)
            );
        }

        filtered = filtered.filter(p => p.price <= selectedPrice);

        if (selectedBrands.length > 0) {
            filtered = filtered.filter(p =>
                selectedBrands.includes(p.brand) ||
                selectedBrands.includes(p.merchant)
            );
        }

        return filtered;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (query) {
            const filtered = getFilteredProducts();
            eventTracker.trackProductSearch(query, filtered);
        }
    };

    const handleWishlistToggle = async (productId, e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login first');
                navigate('/intentCart-auth');
                return;
            }

            const product = products.find(p => p._id === productId);
            if (!product) return;

            const checkResponse = await fetch(`${API_URL}/customer/wishlist/check/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const checkData = await checkResponse.json();
            const inWishlist = checkData.inWishlist || false;

            const method = inWishlist ? 'DELETE' : 'POST';
            const url = inWishlist
                ? `${API_URL}/customer/wishlist/${productId}`
                : `${API_URL}/customer/wishlist`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: method === 'POST' ? JSON.stringify({ productId }) : undefined
            });

            if (!response.ok) {
                throw new Error('Failed to update wishlist');
            }

            if (inWishlist) {
                await eventTracker.trackWishlistRemove(productId, { name: product.name, price: product.price });
                alert('Removed from wishlist');
            } else {
                await eventTracker.trackWishlistAdd(productId, { name: product.name, price: product.price });
                alert('Added to wishlist');
            }

            fetchCategoryData(path);
        } catch (err) {
            console.error('Error updating wishlist:', err);
            alert(err.message);
        }
    };

    const handleProductClick = (product) => {
        eventTracker.trackProductView(product._id, {
            name: product.name,
            price: product.price,
            category: categoryData?.name
        });
    };

    const filteredProducts = getFilteredProducts();
    const brands = getUniqueBrands();

    const clearFilters = () => {
        setSelectedPrice(5000);
        setSelectedCategories([]);
        setSelectedBrands([]);
        setSearchQuery('');
    };

    const activeFilterCount = selectedCategories.length + selectedBrands.length + (searchQuery.trim() ? 1 : 0);

    if (loading) {
        return (
            <div className="w-full bg-white text-gray-800">
                <Header />
                <div className="min-h-[400px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-white text-gray-800">
                <Header />
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-2xl font-bold text-gray-800">Category Not Found</h2>
                    <p className="text-gray-500 mt-2">{error}</p>
                    <Link to="/" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                        Return Home
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="w-full bg-white text-gray-800">
            <Header />

            {/* Promo Banner */}
            {promoBannerCampaign && (
                <div className="bg-indigo-900 text-white text-center py-2 text-xs font-semibold tracking-wide flex items-center justify-center gap-3 flex-wrap">
                    <span>{promoBannerCampaign.text}</span>
                    {promoBannerCampaign.couponCode && (
                        <button
                            onClick={() => handleCopyCoupon(promoBannerCampaign.couponCode)}
                            className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 transition-all"
                        >
                            {copiedCode === promoBannerCampaign.couponCode ? (
                                <>
                                    <Check className="w-3 h-3" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    {promoBannerCampaign.couponCode}
                                </>
                            )}
                        </button>
                    )}
                    {promoBannerCampaign.extraDiscount && (
                        <span className="bg-yellow-400 text-indigo-900 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            + {promoBannerCampaign.extraDiscount} Extra
                        </span>
                    )}
                    <span className="text-[10px] opacity-75">
                        {dealCornerCampaigns.length} deals available
                    </span>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
                    <Link to="/" className="flex items-center hover:text-indigo-600 whitespace-nowrap">
                        <Home className="w-3.5 h-3.5 mr-1" /> Home
                    </Link>
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb._id}>
                            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                            {index === breadcrumbs.length - 1 ? (
                                <span className="text-gray-800 font-semibold whitespace-nowrap">
                                    {crumb.name}
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleBreadcrumbClick(crumb.slug)}
                                    className="hover:text-indigo-600 whitespace-nowrap cursor-pointer"
                                >
                                    {crumb.name}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Page Title with Product Count */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {categoryData?.name || 'Products'}
                    </h1>
                    <span className="text-sm text-gray-500">
                        {totalProducts} products found
                    </span>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-4">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search products in this category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition pr-10"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </button>
                    </div>
                </form>

                {/* Mobile Filter Toggle */}
                <div className="md:hidden flex items-center gap-3 mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="newest">Sort by: Newest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="popular">Most Popular</option>
                    </select>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Sidebar Filters */}
                    <aside className={`w-full md:w-64 shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-semibold py-2 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                            >
                                Clear All Filters ({activeFilterCount})
                            </button>
                        )}

                        {subcategories.length > 0 && (
                            <div className="border-b pb-4">
                                <h3 className="font-bold text-sm text-gray-900 mb-3">Categories</h3>
                                <div className="space-y-2 text-sm text-gray-600 max-h-60 overflow-y-auto">
                                    {subcategories.map((sub) => (
                                        <label key={sub._id} className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(sub._id)}
                                                onChange={() => {
                                                    setSelectedCategories(prev =>
                                                        prev.includes(sub._id)
                                                            ? prev.filter(id => id !== sub._id)
                                                            : [...prev, sub._id]
                                                    );
                                                }}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="flex-1">{sub.name}</span>
                                            <span className="text-xs text-gray-400">{sub.productCount || 0}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {brands.length > 0 && (
                            <div className="border-b pb-4">
                                <h3 className="font-bold text-sm text-gray-900 mb-3">Brand</h3>
                                <div className="space-y-2 text-sm text-gray-600 max-h-48 overflow-y-auto">
                                    {brands.map((brand) => (
                                        <label key={brand} className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => {
                                                    setSelectedBrands(prev =>
                                                        prev.includes(brand)
                                                            ? prev.filter(b => b !== brand)
                                                            : [...prev, brand]
                                                    );
                                                }}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span>{brand}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="font-bold text-sm text-gray-900 mb-3">Max Price: Rs.{selectedPrice}</h3>
                            <input
                                type="range"
                                min="100"
                                max="10000"
                                step="100"
                                value={selectedPrice}
                                onChange={(e) => setSelectedPrice(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Rs.100</span>
                                <span>Rs.10,000</span>
                            </div>
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="pt-4 border-t">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Filters</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedCategories.map(id => {
                                        const sub = subcategories.find(s => s._id === id);
                                        return sub ? (
                                            <span key={id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                                                {sub.name}
                                                <button
                                                    onClick={() => setSelectedCategories(prev => prev.filter(c => c !== id))}
                                                    className="hover:text-indigo-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                    {selectedBrands.map(brand => (
                                        <span key={brand} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                                            {brand}
                                            <button
                                                onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))}
                                                className="hover:text-indigo-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {searchQuery && (
                                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                                            "{searchQuery}"
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="hover:text-indigo-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Main Content Grid */}
                    <main className="flex-1">
                        {/* Desktop Sort */}
                        <div className="hidden md:flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="popular">Most Popular</option>
                                </select>
                            </div>
                            <span className="text-sm text-gray-500">
                                Showing {filteredProducts.length} of {totalProducts} products
                            </span>
                        </div>

                        {/* Deal Corner Section - Collapsible with images */}
                        {dealCornerCampaigns.length > 0 && (
                            <section className="mt-8 mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900 border-b-2 border-indigo-600 inline-block pb-1">
                                            🔥 Deal Corner
                                        </h2>
                                        <Clock className="w-4 h-4 text-indigo-600" />
                                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                            {dealCornerCampaigns.length} Active
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setDealCornerExpanded(!dealCornerExpanded)}
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        {dealCornerExpanded ? (
                                            <>
                                                <ChevronUp className="w-4 h-4" />
                                                <span>Hide</span>
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4" />
                                                <span>Show {dealCornerCampaigns.length} deals</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {dealCornerExpanded && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {dealCornerCampaigns.map((deal) => (
                                            <div
                                                key={deal._id}
                                                className={`relative rounded-xl h-44 flex flex-col justify-center items-center text-center p-3 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all ${deal.bg || 'bg-amber-100/70 border-amber-200/50 border'}`}
                                            >
                                                {/* Deal Image with shaded overlay */}
                                                {deal.imageUrl ? (
                                                    <>
                                                        <img
                                                            src={deal.imageUrl}
                                                            alt={deal.brand}
                                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                                        <ImageIcon className="w-10 h-10" />
                                                    </div>
                                                )}

                                                <div className={`relative z-10 p-2 rounded-lg w-full ${deal.imageUrl ? 'bg-black/30 backdrop-blur-sm' : 'bg-white/40 backdrop-blur-[2px]'}`}>
                                                    <p className={`font-bold text-sm truncate ${deal.imageUrl ? 'text-white' : 'text-indigo-950'}`}>
                                                        {deal.brand}
                                                    </p>
                                                    <p className={`text-xs font-extrabold mt-0.5 ${deal.imageUrl ? 'text-yellow-300' : 'text-indigo-900'}`}>
                                                        {deal.offer}
                                                    </p>
                                                    {deal.discount && (
                                                        <p className={`text-[10px] font-bold mt-0.5 ${deal.imageUrl ? 'text-white/90' : 'text-indigo-700'}`}>
                                                            {deal.discount}
                                                        </p>
                                                    )}
                                                    {deal.couponCode && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyCoupon(deal.couponCode);
                                                            }}
                                                            className={`mt-1.5 text-[10px] px-2 py-0.5 rounded-full transition-all flex items-center gap-1 mx-auto ${deal.imageUrl
                                                                    ? 'bg-white/20 text-white hover:bg-white/30'
                                                                    : 'bg-indigo-600/80 text-white hover:bg-indigo-700'
                                                                }`}
                                                        >
                                                            {copiedCode === deal.couponCode ? (
                                                                <>
                                                                    <Check className="w-2.5 h-2.5" />
                                                                    Copied
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-2.5 h-2.5" />
                                                                    {deal.couponCode}
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {deal.endDate && (
                                                        <p className={`text-[8px] mt-0.5 ${deal.imageUrl ? 'text-white/60' : 'text-gray-400'}`}>
                                                            Ends {new Date(deal.endDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Product Section */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 border-b-2 border-indigo-600 inline-block pb-1">
                                    {searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {filteredProducts.length} products
                                </span>
                            </div>

                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredProducts.map((product) => {
                                        const productImage = product.image ||
                                            (product.images && product.images.length > 0 ? product.images[0]?.url : null);

                                        return (
                                            <Link
                                                key={product._id}
                                                to={`/product/${product.slug}`}
                                                onClick={() => handleProductClick(product)}
                                                className="group flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition p-2"
                                            >
                                                <div className="w-full aspect-[4/5] bg-gray-100 rounded-md overflow-hidden mb-2 relative">
                                                    {productImage ? (
                                                        <img
                                                            src={productImage}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">No Image</div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleWishlistToggle(product._id, e)}
                                                        className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition"
                                                    >
                                                        <Heart className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                                    </button>
                                                    {product.discount && product.discount > 0 && (
                                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                                            {product.discount}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-xs font-semibold text-gray-800 line-clamp-2">
                                                    {product.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs font-bold text-indigo-600">
                                                        Rs.{product.price}
                                                    </p>
                                                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                                                        <p className="text-xs text-gray-400 line-through">
                                                            Rs.{product.compareAtPrice}
                                                        </p>
                                                    )}
                                                </div>
                                                {product.brand && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {product.brand}
                                                    </p>
                                                )}
                                                {product.ratings && product.ratings.average > 0 && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <div className="flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-3 h-3 ${i < Math.round(product.ratings.average)
                                                                        ? 'text-amber-400 fill-amber-400'
                                                                        : 'text-gray-300'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500">
                                                            ({product.ratings.count || 0})
                                                        </span>
                                                    </div>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No products found.</p>
                                    {searchQuery && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Try adjusting your search or filters.
                                        </p>
                                    )}
                                    {!searchQuery && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Try adjusting your filters.
                                        </p>
                                    )}
                                    {(activeFilterCount > 0 || searchQuery) && (
                                        <button
                                            onClick={clearFilters}
                                            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}