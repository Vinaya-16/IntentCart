import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Loader2, ChevronRight, Home, Heart,
    ShoppingCart, Star, Minus, Plus,
    Truck, Shield, RotateCcw, CheckCircle,
    Share2, Eye, Clock, XCircle,
    ShoppingBag
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import eventTracker from '../utils/eventTracker.js';

const API_BASE_URI = import.meta.env.VITE_APP_URL;
const API_URL = `${API_BASE_URI}` || 'http://localhost:5000/api';

export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [isWishlist, setIsWishlist] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

    // Use ref to track if product view has been tracked
    const productTrackedRef = useRef(false);

    useEffect(() => {
        if (slug) {
            fetchProduct(slug);
        }
    }, [slug]);

    const fetchProduct = async (productSlug) => {
        try {
            setLoading(true);
            setError('');
            // Reset tracking flag when fetching new product
            productTrackedRef.current = false;

            const response = await fetch(`${API_URL}/product/${productSlug}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Product not found');
            }

            const data = await response.json();
            setProduct(data.product);
            setSimilarProducts(data.similarProducts || []);

            // Check wishlist status
            const token = localStorage.getItem('token');
            if (token && data.product) {
                try {
                    const wishlistCheck = await fetch(`${API_URL}/customer/wishlist/check/${data.product._id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const wishlistData = await wishlistCheck.json();
                    if (wishlistData.success) {
                        setIsWishlist(wishlistData.inWishlist);
                    }
                } catch (err) {
                    console.error('Error checking wishlist:', err);
                }
            }

            // Set primary image as selected
            if (data.product.images && data.product.images.length > 0) {
                const primary = data.product.images.find(img => img.isPrimary) || data.product.images[0];
                setSelectedImage(primary);
            }
        } catch (err) {
            console.error('Error fetching product:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Track product view - only once per product
    useEffect(() => {
        if (product && !productTrackedRef.current) {
            eventTracker.trackProductView(product._id, {
                name: product.name,
                price: product.price,
                category: product.category?.name
            });
            productTrackedRef.current = true;
        }
    }, [product]);

    const handleQuantityChange = (type) => {
        if (type === 'increment' && quantity < (product?.stock || 10)) {
            setQuantity(q => q + 1);
        } else if (type === 'decrement' && quantity > 1) {
            setQuantity(q => q - 1);
        }
    };

    // Update handleAddToCart function
    const handleAddToCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login first');
                navigate('/intentCart-auth');
                return;
            }

            setIsAddingToCart(true);
            setError('');

            const response = await fetch(`${API_URL}/customer/cart`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: product._id,
                    quantity: quantity
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add to cart');
            }

            // Track add to cart
            const cartItems = [{ productId: product._id, name: product.name, price: product.price, quantity }];
            const total = product.price * quantity;
            await eventTracker.trackAddToCart(product._id, { name: product.name, price: product.price, quantity }, cartItems, total);

            alert(`Added ${quantity} item(s) to cart!`);
        } catch (err) {
            console.error('Error adding to cart:', err);
            setError(err.message);
            alert(err.message);
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Update handleWishlistToggle function
    const handleWishlistToggle = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login first');
                navigate('/intentCart-auth');
                return;
            }

            setIsTogglingWishlist(true);
            setError('');

            const method = isWishlist ? 'DELETE' : 'POST';
            const url = isWishlist
                ? `${API_URL}/customer/wishlist/${product._id}`
                : `${API_URL}/customer/wishlist`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: method === 'POST' ? JSON.stringify({ productId: product._id }) : undefined
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update wishlist');
            }

            // Track wishlist action
            if (isWishlist) {
                await eventTracker.trackWishlistRemove(product._id, { name: product.name, price: product.price });
            } else {
                await eventTracker.trackWishlistAdd(product._id, { name: product.name, price: product.price });
            }

            setIsWishlist(!isWishlist);
            alert(isWishlist ? 'Removed from wishlist' : 'Added to wishlist');
        } catch (err) {
            console.error('Error updating wishlist:', err);
            setError(err.message);
            alert(err.message);
        } finally {
            setIsTogglingWishlist(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product?.name,
                text: `Check out ${product?.name}`,
                url: window.location.href
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard?.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            }).catch(() => {
                // Fallback if clipboard API fails
                prompt('Copy this link:', window.location.href);
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="min-h-[500px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
                    <p className="text-gray-500 mt-2">{error || 'The product you are looking for does not exist.'}</p>
                    <Link to="/" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                        Continue Shopping
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const isInStock = product.stock > 0;
    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discountPercent = hasDiscount ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                        <Link to="/" className="flex items-center hover:text-indigo-600">
                            <Home className="w-3.5 h-3.5 mr-1" /> Home
                        </Link>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <Link to={`/category/${product.category?.slug}`} className="hover:text-indigo-600">
                            {product.category?.name}
                        </Link>
                        {product.subcategory && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <Link to={`/category/${product.category?.slug}/${product.subcategory?.slug}`} className="hover:text-indigo-600">
                                    {product.subcategory.name}
                                </Link>
                            </>
                        )}
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-800 font-medium truncate">{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Product Detail */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Column - Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                            {selectedImage ? (
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.alt || product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ShoppingBag className="w-20 h-20" />
                                </div>
                            )}
                            {hasDiscount && (
                                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                    {discountPercent}% OFF
                                </span>
                            )}
                            {!isInStock && (
                                <span className="absolute top-4 right-4 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                    Out of Stock
                                </span>
                            )}
                        </div>

                        {/* Thumbnail Images */}
                        {product.images && product.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {product.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(img)}
                                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition ${selectedImage?.url === img.url ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.alt || product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Product Info */}
                    <div className="space-y-6">
                        {/* Product Name & Brand */}
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
                            {product.merchant && (
                                <p className="text-sm text-gray-500 mt-1">
                                    by <span className="font-medium text-gray-700">{product.merchant.businessName || product.merchant.username}</span>
                                    {product.merchant.isVerified && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                                            <CheckCircle className="w-3.5 h-3.5" /> Verified Seller
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Ratings */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= Math.round(product.ratings?.average || 0)
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {product.ratings?.average?.toFixed(1) || 0}
                            </span>
                            <span className="text-sm text-gray-400">
                                ({product.ratings?.count || 0} reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold text-indigo-600">
                                Rs. {product.price}
                            </span>
                            {hasDiscount && (
                                <span className="text-lg text-gray-400 line-through">
                                    Rs. {product.compareAtPrice}
                                </span>
                            )}
                            {hasDiscount && (
                                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                    Save {discountPercent}%
                                </span>
                            )}
                        </div>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {product.shortDescription}
                            </p>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            {isInStock ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-emerald-600">In Stock</span>
                                    <span className="text-sm text-gray-400">({product.stock} available)</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-600">Out of Stock</span>
                                </>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        {isInStock && (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                    <button
                                        onClick={() => handleQuantityChange('decrement')}
                                        disabled={quantity <= 1}
                                        className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-12 text-center font-medium">{quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange('increment')}
                                        disabled={quantity >= product.stock}
                                        className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleAddToCart}
                                disabled={!isInStock || isAddingToCart}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAddingToCart ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        {isInStock ? 'Add to Cart' : 'Out of Stock'}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleWishlistToggle}
                                disabled={isTogglingWishlist}
                                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                {isTogglingWishlist ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                                ) : (
                                    <Heart className={`w-5 h-5 ${isWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                                )}
                            </button>
                            <button
                                onClick={handleShare}
                                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                <Share2 className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Shipping Info */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="flex items-center gap-3 text-sm">
                                <Truck className="w-4 h-4 text-indigo-600" />
                                <span className="text-gray-600">Free Delivery</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <RotateCcw className="w-4 h-4 text-indigo-600" />
                                <span className="text-gray-600">7 Day Returns</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="w-4 h-4 text-indigo-600" />
                                <span className="text-gray-600">Secure Payment</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Eye className="w-4 h-4 text-indigo-600" />
                                <span className="text-gray-600">{product.views || 0} Views</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Tabs */}
                <div className="mt-12 border-t">
                    <div className="flex gap-6 border-b">
                        {['description', 'specifications', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-sm font-medium capitalize transition border-b-2 ${activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="py-6">
                        {activeTab === 'description' && (
                            <div className="prose max-w-none">
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {product.description || 'No description available.'}
                                </p>
                                {product.tags && product.tags.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {product.tags.map((tag, index) => (
                                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {product.sku && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-500">SKU</span>
                                            <span className="font-medium">{product.sku}</span>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-500">Category</span>
                                            <span className="font-medium">{product.category.name}</span>
                                        </div>
                                    )}
                                    {product.weight && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-500">Weight</span>
                                            <span className="font-medium">{product.weight} kg</span>
                                        </div>
                                    )}
                                    {product.dimensions && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-500">Dimensions</span>
                                            <span className="font-medium">
                                                {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Reviews coming soon!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Similar Products */}
                {similarProducts.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">You May Also Like</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {similarProducts.map((item) => (
                                <Link
                                    key={item._id}
                                    to={`/product/${item.slug}`}
                                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                                    onClick={() => {
                                        eventTracker.trackProductView(item._id, {
                                            name: item.name,
                                            price: item.price,
                                            category: product.category?.name
                                        });
                                    }}
                                >
                                    <div className="aspect-square bg-gray-100 overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <ShoppingBag className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                                        <p className="text-sm font-bold text-indigo-600 mt-1">Rs. {item.price}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}