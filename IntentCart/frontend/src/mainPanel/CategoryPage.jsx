import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Home, ChevronDown } from 'lucide-react';
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

    // Active filters
    const [selectedPrice, setSelectedPrice] = useState(500);
    const [selectedCategories, setSelectedCategories] = useState([]);

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
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: When clicking a subcategory, append to the current path
    const handleSubcategoryNavigate = (slug) => {
        // Get the current path segments
        const currentPathSegments = path ? path.split('/') : [];
        
        // Check if this subcategory is already in the path (prevent duplicates)
        if (currentPathSegments.includes(slug)) {
            // If already at this level, don't navigate
            return;
        }
        
        // Build the new path by appending the slug
        const newPath = [...currentPathSegments, slug].join('/');
        navigate(`/category/${newPath}`);
    };

    // ✅ FIXED: Handle breadcrumb click - navigate to that level
    const handleBreadcrumbClick = (slug) => {
        navigate(`/category/${slug}`);
    };

    const handleCheckboxToggle = (id) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

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
                <Link
                    to="/"
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full bg-white text-gray-800">

            {/* Header Section   */}
            <Header />

            {/* Banner */}
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

                {/* Hero Banner */}
                <div className="relative w-full h-[260px] sm:h-[320px] bg-slate-900 rounded-xl overflow-hidden mb-8 flex items-center justify-between px-8 text-white">
                    <button
                        aria-label="Previous slide"
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-black flex items-center justify-center transition"
                    >
                        &lt;
                    </button>

                    <div className="z-10 max-w-md text-center">
                        <span className="text-xs uppercase tracking-widest text-indigo-300 font-semibold block mb-2">
                            Brand in Focus
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
                            {categoryData?.name || "Featured"} Collection
                        </h1>
                        <p className="text-lg font-medium mt-2 text-gray-200">Flat 50% Off</p>
                    </div>

                    <button
                        aria-label="Next slide"
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-black flex items-center justify-center transition"
                    >
                        &gt;
                    </button>
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full md:w-56 shrink-0 space-y-6">
                        {/* Subcategory Filter */}
                        {subcategories.length > 0 && (
                            <div className="border-b pb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-sm text-gray-900">Subcategories</h3>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="space-y-2 text-xs text-gray-600">
                                    {subcategories.map((sub) => (
                                        <label key={sub._id} className="flex items-center justify-between cursor-pointer">
                                            <span>{sub.name}</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(sub._id)}
                                                onChange={() => handleCheckboxToggle(sub._id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Filter */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-sm text-gray-900">Max Price: ${selectedPrice}</h3>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="500"
                                value={selectedPrice}
                                onChange={(e) => setSelectedPrice(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-semibold">
                                <span>$50</span>
                                <span>$500</span>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Grid */}
                    <main className="flex-1">
                        <div className="bg-indigo-600 text-white font-bold text-center py-2.5 rounded-md mb-6 text-sm tracking-wide shadow-sm">
                            Shop New Arrivals
                        </div>

                        {/* Subcategories Grid */}
                        {subcategories.length > 0 && (
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
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Product Section */}
                        <section className="mt-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-indigo-600 inline-block pb-1">
                                Deal Corner
                            </h2>

                            {products.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map((product) => (
                                        <Link
                                            key={product._id}
                                            to={`/product/${product.slug}`}
                                            className="group flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition p-2"
                                        >
                                            <div className="w-full aspect-[4/5] bg-gray-100 rounded-md overflow-hidden mb-2">
                                                {product.image || (product.images && product.images.length > 0) ? (
                                                    <img
                                                        src={product.image || product.images[0]?.url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="text-xs font-semibold text-gray-800 line-clamp-2">
                                                {product.name}
                                            </h4>
                                            <p className="text-xs font-bold text-indigo-600 mt-1">
                                                Rs. {product.price}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">No products found in this category.</p>
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>
            {/* Footer Section  */}
            <Footer />
        </div>
    );
}