import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Home, ChevronDown, ShoppingBag, Star, Heart, Filter, Clock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

    // Active filters
    const [selectedPrice, setSelectedPrice] = useState(5000);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (!path) return;
        const controller = new AbortController();
        fetchCategoryData(path, controller.signal);
        return () => controller.abort();
    }, [path]);

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
        navigate(`/category/${newPath}`);
    };

    const handleBreadcrumbClick = (slug) => {
        navigate(`/category/${slug}`);
    };

    // Get unique brands from products
    const getUniqueBrands = () => {
        const brands = new Set();
        products.forEach(p => {
            if (p.brand) brands.add(p.brand);
            if (p.merchant) brands.add(p.merchant);
        });
        return Array.from(brands);
    };

    // Sort products
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

    // Filter products
    const getFilteredProducts = () => {
        let filtered = getSortedProducts();

        // Filter by subcategories
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(p =>
                selectedCategories.includes(p.categoryId) ||
                selectedCategories.includes(p.subcategoryId) ||
                selectedCategories.includes(p.microCategoryId)
            );
        }

        // Filter by price
        filtered = filtered.filter(p => p.price <= selectedPrice);

        // Filter by brands
        if (selectedBrands.length > 0) {
            filtered = filtered.filter(p =>
                selectedBrands.includes(p.brand) ||
                selectedBrands.includes(p.merchant)
            );
        }

        return filtered;
    };

    const filteredProducts = getFilteredProducts();
    const brands = getUniqueBrands();

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold text-gray-800">Category Not Found</h2>
                <p className="text-gray-500 mt-2">{error}</p>
                <Link to="/" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full bg-white text-gray-800">
            <Header />

            <div className="bg-indigo-900 text-white text-center py-2 text-xs font-semibold tracking-wide">
                EOSS | Up to 50% + Extra 10% Off | Free Shipping on all orders
            </div>

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

                {/* Mobile Filter Toggle */}
                <div className="md:hidden flex items-center gap-3 mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
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
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Sidebar Filters */}
                    <aside className={`w-full md:w-64 shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
                        {/* Categories Filter */}
                        {subcategories.length > 0 && (
                            <div className="border-b pb-4">
                                <h3 className="font-bold text-sm text-gray-900 mb-3">Categories</h3>
                                <div className="space-y-2 text-sm text-gray-600">
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
                                            <span>{sub.name}</span>
                                            {/* <span className="text-xs text-gray-400 ml-auto">{sub.productCount || 0}</span> */}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Brand Filter */}
                        {brands.length > 0 && (
                            <div className="border-b pb-4">
                                <h3 className="font-bold text-sm text-gray-900 mb-3">Brand</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {brands.slice(0, 10).map((brand) => (
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

                        {/* Price Filter */}
                        <div>
                            <h3 className="font-bold text-sm text-gray-900 mb-3">Max Price: ${selectedPrice}</h3>
                            <input
                                type="range"
                                min="50"
                                max="1000"
                                step="50"
                                value={selectedPrice}
                                onChange={(e) => setSelectedPrice(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>$50</span>
                                <span>$1000</span>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Grid */}
                    <main className="flex-1">
                        {/* Subcategories Grid */}
                        {/* {subcategories.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                                {subcategories.map((sub) => (
                                    <button
                                        key={sub._id}
                                        onClick={() => handleSubcategoryNavigate(sub.slug)}
                                        className="flex flex-col items-center group text-center focus:outline-none"
                                    >
                                        <div className="w-full aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden mb-2 group-hover:opacity-90 transition border">
                                            {sub.image ? (
                                                <img
                                                    src={sub.image}
                                                    alt={sub.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">No Image</div>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600">
                                            {sub.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {sub.productCount || 0} products
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )} */}

                        {/* Deal Corner Section - Coming Soon */}
                        <section className="mt-8 mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-lg font-bold text-gray-900 border-b-2 border-indigo-600 inline-block pb-1">
                                    Deal Corner
                                </h2>
                                <Clock className="w-4 h-4 text-indigo-600" />
                            </div>

                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <Clock className="w-16 h-16 text-indigo-400 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">🚀 Exciting Deals Coming Soon!</h3>
                                    <p className="text-gray-500 max-w-md">
                                        We're working on bringing you the best deals and discounts.
                                        Stay tuned for amazing offers!
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">50% Off</span>
                                        <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">Buy 1 Get 1</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Free Shipping</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Product Section */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 border-b-2 border-indigo-600 inline-block pb-1">
                                    All Products
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {filteredProducts.length} of {totalProducts} products
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
                                                    <button className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition">
                                                        <Heart className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                                    </button>
                                                </div>
                                                <h4 className="text-xs font-semibold text-gray-800 line-clamp-2">
                                                    {product.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs font-bold text-indigo-600">
                                                        Rs. {product.price}
                                                    </p>
                                                    {product.compareAtPrice && (
                                                        <p className="text-xs text-gray-400 line-through">
                                                            Rs. {product.compareAtPrice}
                                                        </p>
                                                    )}
                                                </div>
                                                {product.brand && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {product.brand}
                                                    </p>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No products found in this category.</p>
                                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
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