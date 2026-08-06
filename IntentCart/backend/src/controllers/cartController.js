import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { triggerPriceDropNotification } from './customerNotificationController.js';

// ==================== CART MANAGEMENT ====================

// @desc    Get cart
// @route   GET /api/customer/cart
// @access  Private (Customer)
export const getCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    let cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images stock');

    if (!cart) {
      cart = await Cart.create({ customerId, items: [], subtotal: 0, total: 0 });
    }

    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add to cart
// @route   POST /api/customer/cart
// @access  Private (Customer)
export const addToCart = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = new Cart({ customerId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        total: quantity * product.price
      });
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
    cart.total = cart.subtotal - cart.discount;

    await cart.save();

    // Get updated cart with populated products
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images stock');

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update cart item
// @route   PUT /api/customer/cart/:itemId
// @access  Private (Customer)
export const updateCartItem = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check stock
    const product = await Product.findById(item.productId);
    if (product && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    item.quantity = quantity;
    item.total = quantity * item.price;

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.total, 0);
    cart.total = cart.subtotal - cart.discount;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images stock');

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove from cart
// @route   DELETE /api/customer/cart/:itemId
// @access  Private (Customer)
export const removeFromCart = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.total, 0);
    cart.total = cart.subtotal - cart.discount;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images stock');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/customer/cart/clear
// @access  Private (Customer)
export const clearCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });
    if (cart) {
      cart.items = [];
      cart.subtotal = 0;
      cart.total = 0;
      cart.discount = 0;
      cart.couponCode = null;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};