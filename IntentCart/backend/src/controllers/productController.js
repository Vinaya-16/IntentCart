import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Notification from '../models/Notifications.js';

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

// ==================== PRODUCT PERFORMANCE PREDICTION ====================

// @desc    Predict product performance
// @route   POST /api/merchant/products/predict-performance
// @access  Private (Merchant)
export const predictProductPerformance = async (req, res) => {
    try {
        const merchantId = req.user._id;
        const { predictionType } = req.body;

        // Get all active products for this merchant
        const products = await Product.find({
            merchantId,
            status: 'active'
        }).populate('categoryId', 'name');

        // Get all completed/delivered orders for this merchant
        const orders = await Order.find({
            merchantId,
            status: { $in: ['delivered', 'completed'] }
        });

        // Calculate product performance
        const productPerformance = [];

        for (const product of products) {
            // Count sales for this product
            const productOrders = orders.filter(order =>
                order.items?.some(item =>
                    item.productId?.toString() === product._id.toString()
                )
            );

            const totalSales = productOrders.length;
            const totalRevenue = productOrders.reduce((sum, order) => {
                const item = order.items?.find(i =>
                    i.productId?.toString() === product._id.toString()
                );
                return sum + (item?.total || 0);
            }, 0);

            // Calculate average order value
            const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

            // Calculate performance score based on prediction type
            let score = 0;
            let category = product.categoryId?.name || 'Uncategorized';

            switch (predictionType) {
                case 'bestSeller':
                    // Score based on sales volume, revenue, and views
                    score = Math.min(100, Math.round(
                        (totalSales * 0.4) +
                        (avgOrderValue / 100 * 0.3) +
                        (product.views || 0) / 10 * 0.3
                    ));
                    break;
                case 'poorSeller':
                    // Score based on low sales, high stock, and low views
                    score = Math.min(100, Math.round(
                        ((100 - totalSales) * 0.5) +
                        (product.stock > 100 ? 30 : 0) +
                        ((product.views || 0) < 50 ? 20 : 0)
                    ));
                    break;
                case 'highReturnRisk':
                    // Score based on return rate, negative reviews, and quality issues
                    const returnRate = product.returnRate || 0.05 + (Math.random() * 0.15); // 5-20% fallback
                    score = Math.min(100, Math.round(
                        (returnRate * 100 * 0.5) +
                        (product.ratings?.average < 3 ? 30 : 0) +
                        (product.approvalStatus === 'pending' ? 20 : 0)
                    ));
                    break;
                default:
                    score = 50;
            }

            productPerformance.push({
                _id: product._id,
                name: product.name,
                category: category,
                sales: totalSales,
                revenue: Math.round(totalRevenue),
                stock: product.stock || 0,
                views: product.views || 0,
                rating: product.ratings?.average || 0,
                score: Math.min(100, Math.max(0, score)),
                returnRate: Math.round((product.returnRate || 0.05) * 100),
                image: product.images?.length > 0 ? product.images[0].url : null
            });
        }

        // Sort by score (highest first for all types)
        const sortedProducts = productPerformance.sort((a, b) => b.score - a.score);

        // Get top 10 products
        const topProducts = sortedProducts.slice(0, 10);

        // Calculate summary stats
        const totalProducts = products.length;
        const predictedCount = topProducts.length;
        const avgScore = topProducts.reduce((sum, p) => sum + p.score, 0) / (topProducts.length || 1);

        // Calculate confidence based on data quality
        const confidence = Math.min(95, Math.round(
            60 + (totalProducts > 10 ? 10 : 0) +
            (orders.length > 50 ? 15 : 0) +
            (avgScore > 50 ? 10 : 0)
        ));

        // Determine trend
        let trend = 'stable';
        if (predictionType === 'bestSeller' && avgScore > 70) trend = 'up';
        else if (predictionType === 'poorSeller' && avgScore < 30) trend = 'down';

        // Generate recommendations
        let recommendation = '';
        if (predictionType === 'bestSeller') {
            recommendation = 'Consider increasing stock for these products. Run targeted marketing campaigns to boost sales further.';
        } else if (predictionType === 'poorSeller') {
            recommendation = 'Review pricing, update product images/descriptions, or consider running promotional offers to improve sales.';
        } else if (predictionType === 'highReturnRisk') {
            recommendation = 'Review product quality, update descriptions to set correct expectations, and consider quality control improvements.';
        }

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                predictedCount,
                confidence,
                trend,
                avgScore: Math.round(avgScore),
                predictionType,
                topProducts,
                recommendation
            },
            message: 'Product performance prediction completed successfully'
        });

    } catch (error) {
        console.error('Error predicting product performance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};