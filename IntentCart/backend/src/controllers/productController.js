import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

// @desc    Get single product by slug
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({ 
            slug, 
            status: 'active', 
            approvalStatus: 'approved' 
        })
        .populate('merchantId', 'username businessName businessAddress businessPhone isApproved')
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .populate('microCategoryId', 'name slug');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Increment views
        product.views = (product.views || 0) + 1;
        await product.save();

        // Get similar products (same category)
        const similarProducts = await Product.find({
            categoryId: product.categoryId,
            _id: { $ne: product._id },
            status: 'active',
            approvalStatus: 'approved'
        })
        .limit(8)
        .select('name slug price images');

        // Get product images
        const images = product.images || [];
        const primaryImage = images.find(img => img.isPrimary) || images[0] || null;

        // Calculate rating
        const rating = product.ratings || { average: 0, count: 0 };

        res.status(200).json({
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                shortDescription: product.shortDescription,
                price: product.price,
                compareAtPrice: product.compareAtPrice || null,
                costPerItem: product.costPerItem || null,
                stock: product.stock,
                sku: product.sku || null,
                images: images,
                primaryImage: primaryImage,
                category: product.categoryId,
                subcategory: product.subcategoryId,
                microCategory: product.microCategoryId,
                merchant: {
                    _id: product.merchantId?._id,
                    username: product.merchantId?.username,
                    businessName: product.merchantId?.businessName,
                    businessAddress: product.merchantId?.businessAddress,
                    businessPhone: product.merchantId?.businessPhone,
                    isVerified: product.merchantId?.isApproved || false
                },
                tags: product.tags || [],
                variants: product.variants || [],
                weight: product.weight || null,
                dimensions: product.dimensions || null,
                status: product.status,
                approvalStatus: product.approvalStatus,
                isFeatured: product.isFeatured || false,
                views: product.views || 0,
                ratings: rating,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            },
            similarProducts: similarProducts.map(p => ({
                _id: p._id,
                name: p.name,
                slug: p.slug,
                price: p.price,
                image: p.images && p.images.length > 0 
                    ? (p.images.find(img => img.isPrimary) || p.images[0])?.url 
                    : null
            }))
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

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const relatedProducts = await Product.find({
            categoryId: product.categoryId,
            _id: { $ne: id },
            status: 'active',
            approvalStatus: 'approved'
        })
        .limit(10)
        .select('name slug price images');

        res.status(200).json({
            success: true,
            count: relatedProducts.length,
            products: relatedProducts
        });
    } catch (error) {
        console.error('Error fetching related products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
    try {
        const { id } = req.params;
        
        // This will be implemented when Review model is created
        // For now, return empty array
        res.status(200).json({
            success: true,
            reviews: [],
            averageRating: 0,
            totalReviews: 0
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};