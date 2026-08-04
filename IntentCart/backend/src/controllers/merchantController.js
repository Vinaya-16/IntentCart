import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Notification from '../models/Notifications.js';

// ==================== CATEGORY MANAGEMENT ====================

const buildCategoryTree = (categories, parentId = null) => {
    const result = [];

    // Filter categories by parentId
    const filtered = categories.filter(cat => {
        if (parentId === null) {
            return !cat.parentId || cat.parentId === null;
        }
        return cat.parentId && cat.parentId.toString() === parentId.toString();
    });

    // Sort by order
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const category of filtered) {
        // Recursively get children
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

// Helper function to create notification
const createNotification = async (title, message, type, category, metadata = {}) => {
    try {
        await Notification.create({
            title,
            message,
            type: type || 'info',
            category: category || 'General',
            panel: 'admin',
            isGlobal: true,
            metadata
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// ==================== CATEGORY MANAGEMENT ====================

// @desc    Get all categories for merchant (with tree structure)
// @route   GET /api/merchant/categories
// @access  Private (Merchant)
export const getCategories = async (req, res) => {
    try {
        // Get all active categories
        const categories = await Category.find({ isActive: true })
            .sort({ level: 1, order: 1 })
            .lean(); // Use lean() for better performance

        // console.log(`Found ${categories.length} categories in database`);

        // Log categories for debugging
        categories.forEach(cat => {
            // console.log(`  - ${cat.name} (Level: ${cat.level}, Parent: ${cat.parentId || 'None'})`);
        });

        // Build category tree
        const categoryTree = buildCategoryTree(categories);

        // console.log(`Built tree with ${categoryTree.length} top-level categories`);

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

        // Format for dropdown with indentation
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

// In seedCategories.js, after creating categories, verify parent relationships
const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // console.log('Connected to MongoDB');

        await Category.deleteMany({});
        // console.log('Cleared existing categories');

        const categoryMap = {};

        // First pass: Create all categories
        for (const cat of categories) {
            const category = new Category({
                name: cat.name,
                level: cat.level,
                order: cat.order || 0,
                isActive: true
            });
            await category.save();
            categoryMap[cat.name] = category;
            //   console.log(`Created: ${cat.name} (Level: ${cat.level})`);
        }

        // Second pass: Set parent relationships
        for (const cat of categories) {
            if (cat.parentName) {
                const parent = categoryMap[cat.parentName];
                const child = categoryMap[cat.name];
                if (parent && child) {
                    child.parentId = parent._id;
                    await child.save();
                    //   console.log(`Linked: ${cat.name} -> ${cat.parentName}`);
                }
            }
        }

        // console.log(`\nSeeded ${categories.length} categories successfully!`);

        // Verify
        const allCategories = await Category.find().lean();
        const topLevel = allCategories.filter(c => !c.parentId);
        const withParent = allCategories.filter(c => c.parentId);
        // console.log(`Top level: ${topLevel.length}, With parent: ${withParent.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
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

        // console.log('Creating product for merchant:', merchantId);
        // console.log('Images received:', productData.images);

        // Check if merchant is approved
        const merchant = await User.findById(merchantId);
        if (!merchant || !merchant.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Your merchant account is not approved yet'
            });
        }

        // Validate category
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

        // Prepare product data including images
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

        // Add optional fields
        if (productData.subcategoryId) {
            productFields.subcategoryId = productData.subcategoryId;
        }
        if (productData.microCategoryId) {
            productFields.microCategoryId = productData.microCategoryId;
        }
        if (productData.compareAtPrice) {
            productFields.compareAtPrice = parseFloat(productData.compareAtPrice);
        }
        if (productData.costPerItem) {
            productFields.costPerItem = parseFloat(productData.costPerItem);
        }
        if (productData.sku) {
            productFields.sku = productData.sku;
        }

        // Create product
        const product = await Product.create(productFields);

        // console.log('Product created with images:', product.images);

        // Update category product count
        await Category.findByIdAndUpdate(productData.categoryId, {
            $inc: { productCount: 1 }
        });

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

        // console.log('Updating product:', id);
        // console.log('Update data:', updates);
        // console.log('Images received:', updates.images);

        const product = await Product.findOne({ _id: id, merchantId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Build update object - including images
        const updateData = {};

        // Handle images specifically
        if (updates.images !== undefined) {
            updateData.images = updates.images;
        }

        // Handle other fields
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

        // If status is being changed to active, set approval status to pending
        if (updates.status === 'active' && product.status !== 'active') {
            updateData.approvalStatus = 'pending';
        }

        // console.log('Update data to save:', updateData);

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // console.log('Product updated with images:', updatedProduct.images);

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

        const product = await Product.findOneAndDelete({ _id: id, merchantId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update category product count
        if (product.categoryId) {
            await Category.findByIdAndUpdate(product.categoryId, {
                $inc: { productCount: -1 }
            });
        }

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

        const product = await Product.findOneAndUpdate(
            { _id: id, merchantId },
            { stock },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            product
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

        const totalProducts = await Product.countDocuments({ merchantId });
        const activeProducts = await Product.countDocuments({
            merchantId,
            status: 'active',
            approvalStatus: 'approved'
        });
        const pendingProducts = await Product.countDocuments({
            merchantId,
            approvalStatus: 'pending'
        });
        const outOfStock = await Product.countDocuments({
            merchantId,
            stock: 0,
            status: 'active'
        });
        const lowStock = await Product.countDocuments({
            merchantId,
            stock: { $gt: 0, $lte: 10 },
            status: 'active'
        });

        // Get total inventory value
        const products = await Product.find({ merchantId, status: 'active' });
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

// @desc    Create merchant notification (for internal use)
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

// ==================== MERCHANT NOTIFICATION TRIGGERS ====================

// @desc    Create notification for product approval
// @route   Internal use only
export const notifyMerchantProductApproved = async (merchantId, productName, productId) => {
    try {
        await Notification.create({
            title: 'Product Approved!',
            message: `Your product "${productName}" has been approved and is now live in the marketplace.`,
            type: 'success',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'View Product',
            metadata: { productId, productName }
        });
    } catch (error) {
        console.error('Error creating product approval notification:', error);
    }
};

// @desc    Create notification for product rejection
export const notifyMerchantProductRejected = async (merchantId, productName, reason) => {
    try {
        await Notification.create({
            title: 'Product Rejected',
            message: `Your product "${productName}" was rejected. Reason: ${reason || 'No reason provided'}`,
            type: 'alert',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            metadata: { productName, reason }
        });
    } catch (error) {
        console.error('Error creating product rejection notification:', error);
    }
};

// @desc    Create notification for new order
export const notifyMerchantNewOrder = async (merchantId, orderId, customerName) => {
    try {
        await Notification.create({
            title: 'New Order Received!',
            message: `You have received a new order #${orderId} from ${customerName}.`,
            type: 'order',
            category: 'Orders',
            panel: 'merchant',
            merchantId: merchantId,
            actionLink: `/merchant/orders/${orderId}`,
            actionLabel: 'View Order',
            metadata: { orderId, customerName }
        });
    } catch (error) {
        console.error('Error creating new order notification:', error);
    }
};

// @desc    Create notification for low stock
export const notifyMerchantLowStock = async (merchantId, productName, productId, stock) => {
    try {
        await Notification.create({
            title: 'Low Stock Alert!',
            message: `Your product "${productName}" is running low on stock (${stock} remaining). Please restock soon.`,
            type: 'alert',
            category: 'Products',
            panel: 'merchant',
            merchantId: merchantId,
            actionLink: `/merchant/products/${productId}`,
            actionLabel: 'Update Stock',
            metadata: { productId, productName, stock }
        });
    } catch (error) {
        console.error('Error creating low stock notification:', error);
    }
};

// @desc    Create notification for merchant approval
export const notifyMerchantApproved = async (merchantId, businessName) => {
    try {
        await Notification.create({
            title: 'Welcome to IntentCart! 🎉',
            message: `Your merchant account "${businessName}" has been approved. You can now start listing your products!`,
            type: 'success',
            category: 'Updates',
            panel: 'merchant',
            merchantId: merchantId,
            actionLink: '/merchant/dashboard',
            actionLabel: 'Go to Dashboard',
            metadata: { businessName }
        });
    } catch (error) {
        console.error('Error creating merchant approval notification:', error);
    }
};

// @desc    Create notification for merchant rejection
export const notifyMerchantRejected = async (merchantId, businessName, reason) => {
    try {
        await Notification.create({
            title: 'Merchant Application Update',
            message: `Your merchant application "${businessName}" has been reviewed. Status: Rejected. Reason: ${reason || 'No reason provided'}`,
            type: 'alert',
            category: 'Updates',
            panel: 'merchant',
            merchantId: merchantId,
            metadata: { businessName, reason }
        });
    } catch (error) {
        console.error('Error creating merchant rejection notification:', error);
    }
};