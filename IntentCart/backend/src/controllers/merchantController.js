import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Notification from '../models/Notifications.js';
import Recovery from "../models/Recovery.js";
import Event from "../models/Event.js";
import Order from "../models/Order.js";

// ==================== HELPER FUNCTIONS ====================

const buildCategoryTree = (categories, parentId = null) => {
    const result = [];

    const filtered = categories.filter(cat => {
        if (parentId === null) {
            return !cat.parentId || cat.parentId === null;
        }
        return cat.parentId && cat.parentId.toString() === parentId.toString();
    });

    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const category of filtered) {
        const children = buildCategoryTree(categories, category._id);

        result.push({
            _id: category._id,
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            level: category.level || 0,
            icon: category.icon || '',
            image: category.image || '',
            order: category.order || 0,
            merchantCount: category.merchantCount || 0,
            productCount: category.productCount || 0,
            isActive: category.isActive,
            parentId: category.parentId,
            children: children
        });
    }

    return result;
};

// ==================== MERCHANT NOTIFICATION TRIGGERS ====================

// Trigger: Product Created
const triggerProductCreatedNotification = async (merchantId, productName, productId) => {
    try {
        await Notification.create({
            title: 'Product Created',
            message: `Your product "${productName}" has been created and is pending admin approval.`,
            type: 'info',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName }
        });
        // console.log(`Product creation notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product creation notification:', error);
    }
};

// Trigger: Product Updated
const triggerProductUpdatedNotification = async (merchantId, productName, productId) => {
    try {
        await Notification.create({
            title: 'Product Updated',
            message: `Your product "${productName}" has been updated and is pending re-approval.`,
            type: 'info',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName }
        });
        // console.log(`Product update notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product update notification:', error);
    }
};

// Trigger: Product Deleted
const triggerProductDeletedNotification = async (merchantId, productName) => {
    try {
        await Notification.create({
            title: 'Product Deleted',
            message: `Your product "${productName}" has been deleted.`,
            type: 'alert',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            metadata: { productName }
        });
        // console.log(`Product deletion notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product deletion notification:', error);
    }
};

// Trigger: Product Approved (called by admin)
export const triggerProductApprovedNotification = async (merchantId, productName, productId) => {
    try {
        await Notification.create({
            title: 'Product Approved!',
            message: `Your product "${productName}" has been approved and is now live in the marketplace.`,
            type: 'success',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName }
        });
        // console.log(`Product approval notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product approval notification:', error);
    }
};

// Trigger: Product Rejected
export const triggerProductRejectedNotification = async (merchantId, productName, productId, reason) => {
    try {
        await Notification.create({
            title: 'Product Rejected',
            message: `Your product "${productName}" was rejected. Reason: ${reason || 'No reason provided'}`,
            type: 'alert',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Details',
            metadata: { productId, productName, reason }
        });
        // console.log(`Product rejection notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating product rejection notification:', error);
    }
};

// Trigger: Stock Updated
const triggerStockUpdatedNotification = async (merchantId, productName, productId, oldStock, newStock) => {
    try {
        await Notification.create({
            title: 'Stock Updated',
            message: `Your product "${productName}" stock has been updated from ${oldStock} to ${newStock}.`,
            type: 'info',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName, oldStock, newStock }
        });
        // console.log(`Stock update notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating stock update notification:', error);
    }
};

// Trigger: Low Stock
export const triggerLowStockNotification = async (merchantId, productName, productId, stock) => {
    try {
        await Notification.create({
            title: 'Low Stock Alert!',
            message: `Your product "${productName}" is running low on stock (${stock} remaining). Please restock soon.`,
            type: 'alert',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'Update Stock',
            metadata: { productId, productName, stock }
        });
        // console.log(`Low stock notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating low stock notification:', error);
    }
};

// Trigger: Merchant Approved
export const triggerMerchantApprovedNotification = async (merchantId, businessName) => {
    try {
        await Notification.create({
            title: 'Welcome to IntentCart!',
            message: `Your merchant account "${businessName}" has been approved. You can now start listing your products!`,
            type: 'success',
            category: 'Updates',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: '/merchant/dashboard',
            actionLabel: 'Go to Dashboard',
            metadata: { businessName }
        });
        // console.log(`Merchant approval notification sent to: ${merchantId}`);
    } catch (error) {
        console.error('Error creating merchant approval notification:', error);
    }
};

// Trigger: Merchant Rejected
export const triggerMerchantRejectedNotification = async (merchantId, businessName, reason) => {
    try {
        await Notification.create({
            title: 'Merchant Application Update',
            message: `Your merchant application "${businessName}" has been reviewed. Status: Rejected. Reason: ${reason || 'No reason provided'}`,
            type: 'alert',
            category: 'Updates',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            metadata: { businessName, reason }
        });
        // console.log(`Merchant rejection notification sent to: ${merchantId}`);
    } catch (error) {
        console.error('Error creating merchant rejection notification:', error);
    }
};

// ==================== CATEGORY MANAGEMENT ====================

// @desc    Get all categories for merchant (with tree structure)
// @route   GET /api/merchant/categories
// @access  Private (Merchant)
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ level: 1, order: 1 })
            .lean();

        const categoryTree = buildCategoryTree(categories);

        res.status(200).json({
            success: true,
            count: categories.length,
            categories: categoryTree
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get categories for dropdown (flat structure)
// @route   GET /api/merchant/categories/flat
// @access  Private (Merchant)
export const getFlatCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ level: 1, order: 1 })
            .lean();

        const formattedCategories = categories.map(cat => ({
            id: cat._id,
            name: cat.level === 0 ? cat.name : `${'--'.repeat(cat.level)} ${cat.name}`,
            level: cat.level,
            parentId: cat.parentId,
            isActive: cat.isActive
        }));

        res.status(200).json({
            success: true,
            categories: formattedCategories
        });
    } catch (error) {
        console.error('Error fetching flat categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get categories by level (for nested dropdowns)
// @route   GET /api/merchant/categories/by-level
// @access  Private (Merchant)
export const getCategoriesByLevel = async (req, res) => {
    try {
        const { level, parentId } = req.query;

        let query = { isActive: true };

        if (level !== undefined) {
            query.level = parseInt(level);
        }

        if (parentId) {
            query.parentId = parentId;
        } else if (level === '0') {
            query.parentId = null;
        }

        const categories = await Category.find(query)
            .sort({ order: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: categories.length,
            categories: categories.map(cat => ({
                _id: cat._id,
                name: cat.name,
                level: cat.level,
                parentId: cat.parentId,
                order: cat.order
            }))
        });
    } catch (error) {
        console.error('Error fetching categories by level:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== PRODUCT MANAGEMENT ====================

// @desc    Get merchant products
// @route   GET /api/merchant/products
// @access  Private (Merchant)
export const getMerchantProducts = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { status, page = 1, limit = 20, search } = req.query;

        const query = { merchantId };

        if (status) query.status = status;
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(query)
            .populate('categoryId', 'name slug')
            .populate('subcategoryId', 'name slug')
            .populate('microCategoryId', 'name slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            products
        });
    } catch (error) {
        console.error('Error fetching merchant products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single product
// @route   GET /api/merchant/products/:id
// @access  Private (Merchant)
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user._id;

        const product = await Product.findOne({ _id: id, merchantId })
            .populate('categoryId', 'name slug')
            .populate('subcategoryId', 'name slug')
            .populate('microCategoryId', 'name slug');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create product 
// @route   POST /api/merchant/products
// @access  Private (Merchant)
export const createProduct = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const productData = req.body;

        const merchant = await User.findById(merchantId);
        if (!merchant || !merchant.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Your merchant account is not approved yet'
            });
        }

        if (!productData.categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        const category = await Category.findById(productData.categoryId);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        const productFields = {
            merchantId,
            name: productData.name,
            description: productData.description,
            shortDescription: productData.shortDescription || '',
            categoryId: productData.categoryId,
            price: parseFloat(productData.price) || 0,
            stock: parseInt(productData.stock) || 0,
            status: productData.status || 'draft',
            approvalStatus: 'pending',
            images: productData.images || []
        };

        if (productData.subcategoryId) productFields.subcategoryId = productData.subcategoryId;
        if (productData.microCategoryId) productFields.microCategoryId = productData.microCategoryId;
        if (productData.compareAtPrice) productFields.compareAtPrice = parseFloat(productData.compareAtPrice);
        if (productData.costPerItem) productFields.costPerItem = parseFloat(productData.costPerItem);
        if (productData.sku) productFields.sku = productData.sku;

        const product = await Product.create(productFields);

        await Category.findByIdAndUpdate(productData.categoryId, {
            $inc: { productCount: 1 }
        });

        // TRIGGER: Product Created
        await triggerProductCreatedNotification(merchantId, product.name, product._id);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update product 
// @route   PUT /api/merchant/products/:id
// @access  Private (Merchant)
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user._id;
        const updates = req.body;

        const product = await Product.findOne({ _id: id, merchantId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updateData = {};
        if (updates.images !== undefined) updateData.images = updates.images;

        const fields = ['name', 'description', 'shortDescription', 'categoryId',
            'subcategoryId', 'microCategoryId', 'price', 'compareAtPrice',
            'costPerItem', 'stock', 'sku', 'status'];

        for (const key of fields) {
            if (updates[key] !== undefined) {
                if (['price', 'compareAtPrice', 'costPerItem'].includes(key)) {
                    updateData[key] = parseFloat(updates[key]);
                } else if (key === 'stock') {
                    updateData[key] = parseInt(updates[key]);
                } else {
                    updateData[key] = updates[key];
                }
            }
        }

        if (updates.status === 'active' && product.status !== 'active') {
            updateData.approvalStatus = 'pending';
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // TRIGGER: Product Updated
        await triggerProductUpdatedNotification(merchantId, updatedProduct.name, updatedProduct._id);

        // TRIGGER: Low Stock if applicable
        if (updatedProduct.stock <= 10) {
            await triggerLowStockNotification(merchantId, updatedProduct.name, updatedProduct._id, updatedProduct.stock);
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete product 
// @route   DELETE /api/merchant/products/:id
// @access  Private (Merchant)
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user._id;

        const product = await Product.findOne({ _id: id, merchantId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const productName = product.name;

        await Product.findOneAndDelete({ _id: id, merchantId });

        if (product.categoryId) {
            await Category.findByIdAndUpdate(product.categoryId, {
                $inc: { productCount: -1 }
            });
        }

        // TRIGGER: Product Deleted
        await triggerProductDeletedNotification(merchantId, productName);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update product stock 
// @route   PUT /api/merchant/products/:id/stock
// @access  Private (Merchant)
export const updateProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user._id;
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid stock quantity is required'
            });
        }

        const product = await Product.findOne({ _id: id, merchantId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const oldStock = product.stock;
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: id, merchantId },
            { stock },
            { new: true }
        );

        // TRIGGER: Stock Updated
        await triggerStockUpdatedNotification(merchantId, updatedProduct.name, updatedProduct._id, oldStock, stock);

        // TRIGGER: Low Stock if applicable
        if (stock <= 10) {
            await triggerLowStockNotification(merchantId, updatedProduct.name, updatedProduct._id, stock);
        }

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get merchant dashboard stats
// @route   GET /api/merchant/dashboard-stats
// @access  Private (Merchant)
export const getMerchantDashboardStats = async (req, res) => {
    try {
        const merchantId = req.user._id;

        // Get all products for this merchant
        const totalProducts = await Product.countDocuments({ merchantId });

        // Active products (approved and active)
        const activeProducts = await Product.countDocuments({
            merchantId,
            status: 'active',
            approvalStatus: 'approved'
        });

        // Pending products (pending approval)
        const pendingProducts = await Product.countDocuments({
            merchantId,
            approvalStatus: 'pending'
        });

        // Out of stock (active products with 0 stock)
        const outOfStock = await Product.countDocuments({
            merchantId,
            stock: 0,
            status: 'active'
        });

        // Low stock (active products with stock between 1 and 10)
        const lowStock = await Product.countDocuments({
            merchantId,
            stock: { $gt: 0, $lte: 10 },
            status: 'active'
        });

        // Get total inventory value (sum of price * stock for active products)
        const products = await Product.find({
            merchantId,
            status: 'active',
            approvalStatus: 'approved'
        });
        const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

        res.status(200).json({
            success: true,
            stats: {
                totalProducts,
                activeProducts,
                pendingProducts,
                outOfStock,
                lowStock,
                totalInventoryValue
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get merchant dashboard stats
// @route   GET /api/merchant/dashboard-stats
// @access  Private (Merchant)
export const getDashboard = async (req, res) => {
    try {
        const merchantId = req.user._id;

        // 1. Get total active products
        const totalProducts = await Product.countDocuments({
            merchantId,
            status: 'active'
        });

        // 2. Fetch Order Statistics via Aggregation
        const orderStats = await Order.aggregate([
            { $match: { merchantId } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSales: {
                        $sum: { $ifNull: ["$totalAmount", { $ifNull: ["$total", { $ifNull: ["$amount", 0] }] }] }
                    },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $in: [{ $toLower: "$status" }, ["completed", "delivered"]] },
                                { $ifNull: ["$totalAmount", { $ifNull: ["$total", { $ifNull: ["$amount", 0] }] }] },
                                0
                            ]
                        }
                    },
                    completed: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "completed"] }, 1, 0] } },
                    delivered: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "delivered"] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "pending"] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "cancelled"] }, 1, 0] } },
                    processing: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "processing"] }, 1, 0] } },
                    shipped: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "shipped"] }, 1, 0] } }
                }
            }
        ]);

        const statsData = orderStats[0] || {
            totalOrders: 0,
            totalSales: 0,
            totalRevenue: 0,
            completed: 0,
            delivered: 0,
            pending: 0,
            cancelled: 0,
            processing: 0,
            shipped: 0
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get ALL Abandonments for this merchant
        const totalAbandonments = await Event.countDocuments({
            merchantId: merchantId,
            eventType: {
                $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned']
            }
        });

        // Get Recovered Carts (Where recoveryStatus === 'converted')
        const recoveredCarts = await Event.countDocuments({
            merchantId: merchantId,
            eventType: {
                $in: ['cart_abandoned', 'checkout_abandoned', 'product_abandoned', 'wishlist_abandoned']
            },
            recoveryStatus: 'converted'
        });

        // Get Recovery Attempts (Count of emails sent)
        const recoveryAttempts = await Event.countDocuments({
            merchantId: merchantId,
            eventType: 'recovery_email_sent'
        });

        // Dynamic rate calculations
        const totalCartsCreated = statsData.totalOrders + totalAbandonments;
        const cartAbandonmentRate = totalCartsCreated > 0
            ? Math.round((totalAbandonments / totalCartsCreated) * 100)
            : 0;

        const recoveryRate = totalAbandonments > 0
            ? Math.round((recoveredCarts / totalAbandonments) * 100)
            : 0;

        // 4. Monthly Trend Data (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const dailyTrend = await Order.aggregate([
            {
                $match: {
                    merchantId,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    Sales: {
                        $sum: { $ifNull: ["$totalAmount", { $ifNull: ["$total", { $ifNull: ["$amount", 0] }] }] }
                    },
                    Revenue: {
                        $sum: {
                            $cond: [
                                { $in: [{ $toLower: "$status" }, ["completed", "delivered"]] },
                                { $ifNull: ["$totalAmount", { $ifNull: ["$total", { $ifNull: ["$amount", 0] }] }] },
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        const monthlyTrend = await Order.aggregate([
            {
                $match: {
                    merchantId,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    Sales: {
                        $sum: { $ifNull: ["$totalAmount", { $ifNull: ["$total", { $ifNull: ["$amount", 0] }] }] }
                    },
                    Revenue: {
                        $sum: {
                            $cond: [
                                { $in: [{ $toLower: "$status" }, ["completed", "delivered"]] },
                                { $ifNull: ["$totalAmount", { $ifNull: ["$total", { $ifNull: ["$amount", 0] }] }] },
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const dailyData = dailyTrend.map(item => {
            const dateObj = new Date(item._id.year, item._id.month - 1, item._id.day);
            return {
                date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // e.g. "Aug 14"
                Sales: item.Sales,
                Revenue: item.Revenue
            };
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthlyTrend.map(item => ({
            month: months[item._id.month - 1],
            Sales: item.Sales,
            Revenue: item.Revenue
        }));

        // Calculate Y-Axis upper bound dynamically
        const maxVal = Math.max(...monthlyData.map(d => Math.max(d.Sales, d.Revenue)), 1000);
        const yAxisMax = Math.ceil(maxVal / 1000) * 1000;

        // Send Response
        res.status(200).json({
            success: true,
            stats: {
                totalProducts,
                totalOrders: statsData.totalOrders,
                totalSales: statsData.totalSales,
                totalRevenue: statsData.totalRevenue,
                cartAbandonmentRate,
                recoveryRate,
                totalAbandonments,
                recoveredCarts,
                recoveryAttempts,
                orderStatus: {
                    completed: statsData.completed,
                    delivered: statsData.delivered,
                    pending: statsData.pending,
                    cancelled: statsData.cancelled,
                    processing: statsData.processing,
                    shipped: statsData.shipped
                },
                dailyData, 
                chartConfig: { yAxisMax }
            }
        });

    } catch (error) {
        console.error('Error fetching merchant dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== MERCHANT NOTIFICATIONS ====================

// @desc    Get merchant notifications
// @route   GET /api/merchant/notifications
// @access  Private (Merchant)
export const getMerchantNotifications = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { limit = 50, page = 1, read } = req.query;

        let query = {
            panel: 'merchant',
            merchantId: merchantId
        };

        if (read !== undefined) {
            query.read = read === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            panel: 'merchant',
            merchantId: merchantId,
            read: false
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error('Error fetching merchant notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create merchant notification (manual)
// @route   POST /api/merchant/notifications
// @access  Private (Merchant)
export const createMerchantNotification = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { title, message, type, category, actionLink, actionLabel, metadata } = req.body;

        const notification = await Notification.create({
            title,
            message,
            type: type || 'info',
            category: category || 'General',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink,
            actionLabel,
            metadata
        });

        res.status(201).json({
            success: true,
            message: 'Merchant notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Error creating merchant notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark merchant notification as read
// @route   PUT /api/merchant/notifications/:id/read
// @access  Private (Merchant)
export const markMerchantNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, panel: 'merchant', merchantId: merchantId },
            {
                read: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Merchant notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking merchant notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark all merchant notifications as read
// @route   PUT /api/merchant/notifications/read-all
// @access  Private (Merchant)
export const markAllMerchantNotificationsAsRead = async (req, res) => {
    try {
        const merchantId = req.user._id;

        await Notification.updateMany(
            { panel: 'merchant', merchantId: merchantId, read: false },
            {
                read: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: 'All merchant notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all merchant notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete merchant notification
// @route   DELETE /api/merchant/notifications/:id
// @access  Private (Merchant)
export const deleteMerchantNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            panel: 'merchant',
            merchantId: merchantId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Merchant notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Merchant notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting merchant notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get merchant unread count
// @route   GET /api/merchant/notifications/unread-count
// @access  Private (Merchant)
export const getMerchantUnreadCount = async (req, res) => {
    try {
        const merchantId = req.user._id;

        const count = await Notification.countDocuments({
            panel: 'merchant',
            merchantId: merchantId,
            read: false
        });

        res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Error getting merchant unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==================== MERCHANT PROFILE MANAGEMENT ====================

// Trigger: Profile Updated
const triggerProfileUpdatedNotification = async (merchantId) => {
    try {
        await Notification.create({
            title: 'Profile Updated',
            message: 'Your merchant profile has been updated successfully.',
            type: 'success',
            category: 'Updates',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: '/merchant/profile',
            actionLabel: 'View Profile',
            metadata: { updatedAt: new Date() }
        });
        // console.log(`Profile update notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating profile update notification:', error);
    }
};

// Trigger: Password Changed
const triggerPasswordChangedNotification = async (merchantId) => {
    try {
        await Notification.create({
            title: 'Password Changed',
            message: 'Your account password has been changed successfully.',
            type: 'system',
            category: 'Security',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: '/merchant/profile',
            actionLabel: 'View Profile',
            metadata: { changedAt: new Date() }
        });
        // console.log(`Password change notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating password change notification:', error);
    }
};

// Trigger: Avatar Updated
const triggerAvatarUpdatedNotification = async (merchantId) => {
    try {
        await Notification.create({
            title: 'Profile Picture Updated',
            message: 'Your profile picture has been updated successfully.',
            type: 'success',
            category: 'Updates',
            panel: 'merchant',
            merchantId: merchantId,
            isGlobal: false,
            actionLink: '/merchant/profile',
            actionLabel: 'View Profile',
            metadata: { updatedAt: new Date() }
        });
        // console.log(`Avatar update notification sent to merchant: ${merchantId}`);
    } catch (error) {
        console.error('Error creating avatar update notification:', error);
    }
};

// @desc    Get merchant profile
// @route   GET /api/merchant/profile
// @access  Private (Merchant)
export const getMerchantProfile = async (req, res) => {
    try {
        const merchant = await User.findById(req.user._id).select('-password');

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        // Format profile data
        const profileData = {
            id: merchant._id,
            username: merchant.username,
            email: merchant.email,
            businessName: merchant.businessName || 'Merchant Store',
            businessDescription: merchant.businessDescription || '',
            businessAddress: merchant.businessAddress || '',
            businessPhone: merchant.businessPhone || '',
            phone: merchant.phone || merchant.businessPhone || '',
            avatarUrl: merchant.avatarUrl || '',
            initials: merchant.businessName
                ? merchant.businessName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
                : merchant.username?.slice(0, 2).toUpperCase() || 'MS',
            isApproved: merchant.isApproved,
            merchantStatus: merchant.merchantStatus || 'pending',
            createdAt: merchant.createdAt,
            currency: 'Rupee (Rs.)',
            role: merchant.role
        };

        res.status(200).json({
            success: true,
            profile: profileData
        });
    } catch (error) {
        console.error('Error fetching merchant profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update merchant profile
// @route   PUT /api/merchant/profile
// @access  Private (Merchant)
export const updateMerchantProfile = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { businessName, businessDescription, businessAddress, businessPhone, email, phone } = req.body;

        // Check if merchant exists
        const merchant = await User.findById(merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        // Build update object
        const updates = {};
        if (businessName) updates.businessName = businessName;
        if (businessDescription !== undefined) updates.businessDescription = businessDescription;
        if (businessAddress !== undefined) updates.businessAddress = businessAddress;
        if (businessPhone !== undefined) updates.businessPhone = businessPhone;
        if (phone !== undefined) updates.phone = phone;

        // Email update - check if it's not already taken
        if (email && email !== merchant.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: merchantId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
            updates.email = email;
        }

        // Update merchant
        const updatedMerchant = await User.findByIdAndUpdate(
            merchantId,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        // TRIGGER: Profile Updated Notification
        await triggerProfileUpdatedNotification(merchantId);

        // Format response
        const profileData = {
            id: updatedMerchant._id,
            username: updatedMerchant.username,
            email: updatedMerchant.email,
            businessName: updatedMerchant.businessName || 'Merchant Store',
            businessDescription: updatedMerchant.businessDescription || '',
            businessAddress: updatedMerchant.businessAddress || '',
            businessPhone: updatedMerchant.businessPhone || '',
            phone: updatedMerchant.phone || updatedMerchant.businessPhone || '',
            avatarUrl: updatedMerchant.avatarUrl || '',
            initials: updatedMerchant.businessName
                ? updatedMerchant.businessName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
                : updatedMerchant.username?.slice(0, 2).toUpperCase() || 'MS',
            isApproved: updatedMerchant.isApproved,
            merchantStatus: updatedMerchant.merchantStatus || 'pending',
            createdAt: updatedMerchant.createdAt,
            currency: 'Rupee (Rs.)',
            role: updatedMerchant.role
        };

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            profile: profileData
        });
    } catch (error) {
        console.error('Error updating merchant profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Change merchant password
// @route   PUT /api/merchant/change-password
// @access  Private (Merchant)
export const changeMerchantPassword = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all password fields'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get merchant with password
        const merchant = await User.findById(merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        // Verify current password
        const isPasswordValid = await merchant.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        merchant.password = newPassword;
        await merchant.save();

        // TRIGGER: Password Changed Notification
        await triggerPasswordChangedNotification(merchantId);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing merchant password:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update merchant avatar
// @route   PUT /api/merchant/avatar
// @access  Private (Merchant)
export const updateMerchantAvatar = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return res.status(400).json({
                success: false,
                message: 'Avatar URL is required'
            });
        }

        const merchant = await User.findByIdAndUpdate(
            merchantId,
            { avatarUrl },
            { new: true }
        ).select('-password');

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: 'Merchant not found'
            });
        }

        // TRIGGER: Avatar Updated Notification
        await triggerAvatarUpdatedNotification(merchantId);

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            avatarUrl: merchant.avatarUrl
        });
    } catch (error) {
        console.error('Error updating merchant avatar:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};