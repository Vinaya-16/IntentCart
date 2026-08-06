import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { triggerPriceDropNotification } from '../utils/notificationTriggers.js';

// ==================== WISHLIST MANAGEMENT ====================

// @desc    Get wishlist
// @route   GET /api/customer/wishlist
// @access  Private (Customer)
export const getWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;

        let wishlist = await Wishlist.findOne({ customerId })
            .populate('products.productId', 'name price images stock slug ratings');

        if (!wishlist) {
            wishlist = await Wishlist.create({ customerId, products: [] });
        }

        res.status(200).json({
            success: true,
            wishlist
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Add to wishlist
// @route   POST /api/customer/wishlist
// @access  Private (Customer)
export const addToWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { productId } = req.body;

        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let wishlist = await Wishlist.findOne({ customerId });

        if (!wishlist) {
            wishlist = new Wishlist({ customerId, products: [] });
        }

        // Check if already in wishlist
        const exists = wishlist.products.some(
            item => item.productId.toString() === productId
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        wishlist.products.push({ productId });
        await wishlist.save();

        // Update user's wishlist count - NOW User is defined
        await User.findByIdAndUpdate(customerId, { $inc: { wishlistCount: 1 } });

        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate('products.productId', 'name price images stock slug');

        res.status(200).json({
            success: true,
            message: 'Added to wishlist',
            wishlist: updatedWishlist
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/customer/wishlist/:productId
// @access  Private (Customer)
export const removeFromWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ customerId });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        wishlist.products = wishlist.products.filter(
            item => item.productId.toString() !== productId
        );

        await wishlist.save();

        // Update user's wishlist count
        await User.findByIdAndUpdate(customerId, { $inc: { wishlistCount: -1 } });

        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate('products.productId', 'name price images stock slug');

        res.status(200).json({
            success: true,
            message: 'Removed from wishlist',
            wishlist: updatedWishlist
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Check if product is in wishlist
// @route   GET /api/customer/wishlist/check/:productId
// @access  Private (Customer)
export const checkWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ customerId });
        const inWishlist = wishlist
            ? wishlist.products.some(item => item.productId.toString() === productId)
            : false;

        res.status(200).json({
            success: true,
            inWishlist
        });
    } catch (error) {
        console.error('Error checking wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};