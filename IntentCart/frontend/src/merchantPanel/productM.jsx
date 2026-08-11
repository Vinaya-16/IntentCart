import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    RefreshCw,
    Megaphone,
    Bell,
    User,
    ChevronDown,
    Search,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    WifiOff,
    X,
    Image,
    Link2,
    Cross,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Header from './components/header.jsx';
import Sidebar from './components/sidebar.jsx';

const API_URL = 'http://localhost:5000/api/merchant';

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [stats, setStats] = useState({
        totalProducts: 0,
        outOfStock: 0,
        totalInventoryValue: 0,
        activeProducts: 0,
        pendingProducts: 0,
        lowStock: 0
    });
    const [isServerDown, setIsServerDown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProductsCount, setTotalProductsCount] = useState(0);
    const itemsPerPage = 10;

    // New Product Form State
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        shortDescription: '',
        categoryId: '',
        subcategoryId: '',
        microCategoryId: '',
        price: '',
        compareAtPrice: '',
        costPerItem: '',
        stock: '',
        sku: '',
        status: 'draft',
        imageUrl: '',
        images: []
    });

    // Image URL state for modal
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);

    const getToken = () => localStorage.getItem('token');

    // Fetch dashboard stats
    const fetchStats = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/dashboard-stats`, {
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
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();

            if (data.success) {
                setStats({
                    totalProducts: data.stats.totalProducts || 0,
                    activeProducts: data.stats.activeProducts || 0,
                    pendingProducts: data.stats.pendingProducts || 0,
                    outOfStock: data.stats.outOfStock || 0,
                    lowStock: data.stats.lowStock || 0,
                    totalInventoryValue: data.stats.totalInventoryValue || 0
                });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    // Fetch products with pagination
    const fetchProducts = async (page = 1) => {
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

            const response = await fetch(
                `${API_URL}/products?page=${page}&limit=${itemsPerPage}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/intentCart-auth';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            if (data.success) {
                setProducts(data.products || []);
                setTotalPages(data.pages || 1);
                setTotalProductsCount(data.total || 0);
                setCurrentPage(data.currentPage || page);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
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

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch categories');

            const data = await response.json();

            if (data.success) {
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories');
        } finally {
            setLoadingCategories(false);
        }
    };

    // Helper: Get flat categories for dropdowns
    const getFlatCategories = (categories, level = 0, prefix = '') => {
        let result = [];
        const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

        for (const cat of sorted) {
            result.push({
                _id: cat._id,
                name: prefix + cat.name,
                level: level,
                parentId: cat.parentId,
                originalName: cat.name,
                children: cat.children || []
            });

            if (cat.children && cat.children.length > 0) {
                const children = getFlatCategories(cat.children, level + 1, prefix + '— ');
                result = result.concat(children);
            }
        }

        return result;
    };

    // Get all flat categories for dropdown
    const flatCategories = useMemo(() => {
        return getFlatCategories(categories);
    }, [categories]);

    // Add image to product
    const handleAddImage = () => {
        if (!imageUrlInput.trim()) {
            setError('Please enter an image URL');
            return;
        }

        try {
            new URL(imageUrlInput);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        setProductForm({
            ...productForm,
            images: [...productForm.images, {
                url: imageUrlInput,
                alt: productForm.name || 'Product image',
                isPrimary: productForm.images.length === 0
            }]
        });
        setImageUrlInput('');
        setShowImageModal(false);
        setError('');
    };

    // Remove image
    const handleRemoveImage = (index) => {
        const newImages = productForm.images.filter((_, i) => i !== index);
        if (newImages.length > 0 && productForm.images[index].isPrimary) {
            newImages[0].isPrimary = true;
        }
        setProductForm({
            ...productForm,
            images: newImages
        });
    };

    // Set primary image
    const handleSetPrimary = (index) => {
        const newImages = productForm.images.map((img, i) => ({
            ...img,
            isPrimary: i === index
        }));
        setProductForm({
            ...productForm,
            images: newImages
        });
    };

    // Create product
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setActionLoading('create');
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            if (!productForm.categoryId) {
                setError('Please select a category');
                setActionLoading(null);
                return;
            }

            const formattedImages = productForm.images.map(img => ({
                url: img.url,
                alt: img.alt || productForm.name || 'Product image',
                isPrimary: img.isPrimary || false
            }));

            const productData = {
                name: productForm.name,
                description: productForm.description,
                shortDescription: productForm.shortDescription || '',
                categoryId: productForm.categoryId,
                subcategoryId: productForm.subcategoryId || null,
                microCategoryId: productForm.microCategoryId || null,
                price: parseFloat(productForm.price),
                compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
                costPerItem: productForm.costPerItem ? parseFloat(productForm.costPerItem) : null,
                stock: parseInt(productForm.stock) || 0,
                sku: productForm.sku || '',
                status: productForm.status || 'draft',
                images: formattedImages
            };

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create product');
            }

            const data = await response.json();

            setSuccess('Product created successfully!');
            setShowAddModal(false);
            resetForm();
            fetchProducts(currentPage);
            fetchStats();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error creating product:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Update product
    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setActionLoading('update');
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            if (!productForm.categoryId) {
                setError('Please select a category');
                setActionLoading(null);
                return;
            }

            const formattedImages = productForm.images.map(img => ({
                url: img.url,
                alt: img.alt || productForm.name || 'Product image',
                isPrimary: img.isPrimary || false
            }));

            const productData = {
                name: productForm.name.trim(),
                description: productForm.description.trim(),
                shortDescription: productForm.shortDescription?.trim() || '',
                categoryId: productForm.categoryId,
                subcategoryId: productForm.subcategoryId || null,
                microCategoryId: productForm.microCategoryId || null,
                price: parseFloat(productForm.price) || 0,
                compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
                costPerItem: productForm.costPerItem ? parseFloat(productForm.costPerItem) : null,
                stock: parseInt(productForm.stock) || 0,
                sku: productForm.sku?.trim() || '',
                status: productForm.status || 'draft',
                images: formattedImages
            };

            const response = await fetch(`${API_URL}/products/${editingProduct._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update product');
            }

            const data = await response.json();

            setSuccess('Product updated successfully!');
            setEditingProduct(null);
            resetForm();
            setShowAddModal(false);
            fetchProducts(currentPage);
            fetchStats();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Delete product
    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        setActionLoading(id);
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete product');
            }

            setSuccess('Product deleted successfully!');
            fetchProducts(currentPage);
            fetchStats();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Update stock
    const handleUpdateStock = async (id, currentStock) => {
        const newStock = prompt('Enter new stock quantity:', currentStock);
        if (newStock === null) return;

        const stock = parseInt(newStock);
        if (isNaN(stock) || stock < 0) {
            setError('Please enter a valid stock number');
            return;
        }

        setActionLoading(id);
        try {
            const token = getToken();
            if (!token) {
                setError('Please login first');
                setActionLoading(null);
                return;
            }

            const response = await fetch(`${API_URL}/products/${id}/stock`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ stock })
            });

            if (!response.ok) {
                throw new Error('Failed to update stock');
            }

            const data = await response.json();
            setSuccess('Stock updated successfully!');
            fetchProducts(currentPage);
            fetchStats();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating stock:', err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Reset form
    const resetForm = () => {
        setProductForm({
            name: '',
            description: '',
            shortDescription: '',
            categoryId: '',
            subcategoryId: '',
            microCategoryId: '',
            price: '',
            compareAtPrice: '',
            costPerItem: '',
            stock: '',
            sku: '',
            status: 'draft',
            imageUrl: '',
            images: []
        });
        setImageUrlInput('');
    };

    // Edit product - populate form
    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || '',
            description: product.description || '',
            shortDescription: product.shortDescription || '',
            categoryId: product.categoryId?._id || product.categoryId || '',
            subcategoryId: product.subcategoryId?._id || product.subcategoryId || '',
            microCategoryId: product.microCategoryId?._id || product.microCategoryId || '',
            price: product.price || '',
            compareAtPrice: product.compareAtPrice || '',
            costPerItem: product.costPerItem || '',
            stock: product.stock || '',
            sku: product.sku || '',
            status: product.status || 'draft',
            images: product.images || []
        });
        setShowAddModal(true);
    };

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.categoryId?.name && p.categoryId.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchProducts(page);
        }
    };

    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="text-emerald-500 font-semibold">Active</span>;
            case 'draft':
                return <span className="text-gray-500 font-semibold">Draft</span>;
            case 'pending':
                return <span className="text-amber-500 font-semibold">Pending</span>;
            case 'inactive':
                return <span className="text-red-500 font-semibold">Inactive</span>;
            default:
                return <span>{status}</span>;
        }
    };

    // Get stock status
    const getStockStatus = (stock) => {
        if (stock === 0) return { text: 'Out Of Stock', color: 'text-red-500' };
        if (stock <= 10) return { text: 'Low Stock', color: 'text-amber-500' };
        return { text: 'In Stock', color: 'text-emerald-500' };
    };

    // Get approval status badge
    const getApprovalStatus = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center gap-1 text-emerald-500"><CheckCircle className="w-3 h-3" /> Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" /> Rejected</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1 text-amber-500"><AlertCircle className="w-3 h-3" /> Pending</span>;
            default:
                return <span className="text-gray-500">-</span>;
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchStats();
        fetchProducts(1);
        fetchCategories();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <div className="flex-1 overflow-y-auto">
                    <main className="flex-1 p-8 overflow-y-auto">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                                <X className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        {/* Server Down */}
                        {isServerDown && (
                            <div className="mb-4 p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center">
                                <WifiOff className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                                <h3 className="text-lg font-semibold mb-2">Server Connection Lost</h3>
                                <p className="mb-4">{error}</p>
                                <button
                                    onClick={() => { fetchStats(); fetchProducts(currentPage); }}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Products</h3>
                                <p className="text-3xl font-extrabold text-[#1e427b]">{stats.totalProducts}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Active Products</h3>
                                <p className="text-3xl font-extrabold text-emerald-600">{stats.activeProducts}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Out Of Stock</h3>
                                <p className="text-3xl font-extrabold text-red-500">{stats.outOfStock}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-slate-600 text-sm font-medium mb-2">Total Inventory Value</h3>
                                <p className="text-3xl font-extrabold text-[#1e427b]">
                                    Rs. {stats.totalInventoryValue.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* PAGE HEADING */}
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-[#1e427b]">Product Management</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Pending Approval: {stats.pendingProducts}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>Low Stock: {stats.lowStock}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>Total: {totalProductsCount} products</span>
                            </div>
                        </div>

                        {/* ACTION BAR */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="relative w-full sm:w-96">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    resetForm();
                                    setEditingProduct(null);
                                    setShowAddModal(true);
                                }}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0f2d5c] hover:bg-blue-900 text-white font-medium px-4 py-2 rounded-lg text-sm shadow transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Product
                            </button>
                        </div>

                        {/* PRODUCTS TABLE */}
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e427b] border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#2c5282] text-white text-xs font-semibold uppercase tracking-wider">
                                                <th className="py-3 px-4">Image</th>
                                                <th className="py-3 px-4">Product</th>
                                                <th className="py-3 px-4">Category</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4 text-center">Stock</th>
                                                <th className="py-3 px-4 text-center">Price</th>
                                                <th className="py-3 px-4 text-center">Approval</th>
                                                <th className="py-3 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-sm">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map((product) => {
                                                    const stockStatus = getStockStatus(product.stock);
                                                    const categoryName = product.categoryId?.name || 'Uncategorized';
                                                    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                                                    return (
                                                        <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-3 px-4">
                                                                <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                                                                    {product.images && product.images.length > 0 ? (
                                                                        (() => {
                                                                            const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
                                                                            return primaryImage && primaryImage.url ? (
                                                                                <img
                                                                                    src={primaryImage.url}
                                                                                    alt={product.name || 'Product'}
                                                                                    className="w-full h-full object-cover"
                                                                                    loading="lazy"
                                                                                    onError={(e) => {
                                                                                        e.target.style.display = 'none';
                                                                                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>';
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">
                                                                                    <Image className="w-6 h-6" />
                                                                                </div>
                                                                            );
                                                                        })()
                                                                    ) : (
                                                                        <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">
                                                                            <Image className="w-6 h-6" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div>
                                                                    <div className="font-semibold text-slate-800">{product.name}</div>
                                                                    {product.sku && <div className="text-xs text-gray-400">SKU: {product.sku}</div>}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-600">
                                                                {categoryName}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {getStatusBadge(product.status)}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className={`font-semibold ${stockStatus.color}`}>
                                                                        {product.stock}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleUpdateStock(product._id, product.stock)}
                                                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                                                        title="Update Stock"
                                                                    >
                                                                        <RefreshCw className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                                <div className="text-xs text-gray-400">{stockStatus.text}</div>
                                                            </td>
                                                            <td className="py-3 px-4 text-center font-medium text-slate-800">
                                                                Rs. {product.price}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                {getApprovalStatus(product.approvalStatus)}
                                                                {product.approvalReason && (
                                                                    <div className="text-xs text-gray-400 mt-1">{product.approvalReason}</div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEditProduct(product)}
                                                                        className="text-slate-500 hover:text-blue-600 transition-colors"
                                                                        title="Edit Product"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteProduct(product._id)}
                                                                        disabled={actionLoading === product._id}
                                                                        className="text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                                                        title="Delete Product"
                                                                    >
                                                                        {actionLoading === product._id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-8 text-slate-500">
                                                        {searchTerm ? `No products found matching "${searchTerm}"` : 'No products yet. Click "Add New Product" to get started.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                                        <div className="text-sm text-slate-500">
                                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalProductsCount)} of {totalProductsCount} products
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (totalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNum = totalPages - 4 + i;
                                                    } else {
                                                        pageNum = currentPage - 2 + i;
                                                    }
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pageNum === currentPage
                                                                    ? 'bg-[#0f2d5c] text-white'
                                                                    : 'hover:bg-slate-100 text-slate-600'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ADD/EDIT PRODUCT MODAL - Same as before */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h3 className="text-lg font-bold text-[#1e427b]">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingProduct(null);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
                            {/* Form fields - same as before */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                                    <input
                                        type="text"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        value={productForm.sku}
                                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                                    <select
                                        value={productForm.categoryId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setProductForm({
                                                ...productForm,
                                                categoryId: val,
                                                subcategoryId: '',
                                                microCategoryId: ''
                                            });
                                        }}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {loadingCategories ? (
                                            <option disabled>Loading categories...</option>
                                        ) : (
                                            flatCategories
                                                .filter(c => c.level === 0)
                                                .map(c => (
                                                    <option key={c._id} value={c._id}>{c.originalName}</option>
                                                ))
                                        )}
                                    </select>
                                </div>

                                {productForm.categoryId && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Subcategory</label>
                                        <select
                                            value={productForm.subcategoryId}
                                            onChange={(e) => setProductForm({
                                                ...productForm,
                                                subcategoryId: e.target.value,
                                                microCategoryId: ''
                                            })}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                        >
                                            <option value="">Select Subcategory</option>
                                            {loadingCategories ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                flatCategories
                                                    .filter(c => c.level === 1 && c.parentId === productForm.categoryId)
                                                    .map(c => (
                                                        <option key={c._id} value={c._id}>{c.originalName}</option>
                                                    ))
                                            )}
                                        </select>
                                    </div>
                                )}

                                {productForm.subcategoryId && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Micro Category</label>
                                        <select
                                            value={productForm.microCategoryId}
                                            onChange={(e) => setProductForm({ ...productForm, microCategoryId: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                        >
                                            <option value="">Select Micro Category</option>
                                            {loadingCategories ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                flatCategories
                                                    .filter(c => c.level === 2 && c.parentId === productForm.subcategoryId)
                                                    .map(c => (
                                                        <option key={c._id} value={c._id}>{c.originalName}</option>
                                                    ))
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Product Images</label>

                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        placeholder="Enter image URL..."
                                        value={imageUrlInput}
                                        onChange={(e) => setImageUrlInput(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddImage}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>

                                {productForm.images.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3 mt-2">
                                        {productForm.images.map((img, index) => (
                                            <div key={index} className="relative group">
                                                <div className={`aspect-square rounded-lg overflow-hidden border-2 ${img.isPrimary ? 'border-blue-500' : 'border-gray-200'}`}>
                                                    {img.url ? (
                                                        <img
                                                            src={img.url}
                                                            alt={img.alt || 'Product image'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Cpath d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <Image className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetPrimary(index)}
                                                        className={`p-1 rounded-full ${img.isPrimary ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                                                        title="Set as primary"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                                                        title="Remove image"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {img.isPrimary && (
                                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {productForm.images.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-2">No images added yet. Add image URLs above.</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                                <textarea
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Short Description</label>
                                <input
                                    type="text"
                                    value={productForm.shortDescription}
                                    onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                    maxLength="300"
                                    placeholder="Brief description (max 300 chars)"
                                />
                            </div>

                            {/* Pricing & Stock */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Compare at Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productForm.compareAtPrice}
                                        onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stock *</label>
                                    <input
                                        type="number"
                                        value={productForm.stock}
                                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Cost Per Item</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={productForm.costPerItem}
                                    onChange={(e) => setProductForm({ ...productForm, costPerItem: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                    min="0"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                <select
                                    value={productForm.status}
                                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active (Submit for Approval)</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {productForm.status === 'active' && (
                                    <p className="text-xs text-amber-500 mt-1">Product will be sent for admin approval</p>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingProduct(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'create' || actionLoading === 'update'}
                                    className="px-5 py-2 bg-[#0f2d5c] text-white rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {(actionLoading === 'create' || actionLoading === 'update') ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {editingProduct ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        editingProduct ? 'Update Product' : 'Create Product'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;