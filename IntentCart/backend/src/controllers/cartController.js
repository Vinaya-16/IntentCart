// controllers/cartController.js
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AbandonedCart from '../models/AbandonedCart.js';
import { triggerPriceDropNotification } from './customerNotificationController.js';

// ==================== CART MANAGEMENT ====================

// @desc    Get cart
// @route   GET /api/customer/cart
// @access  Private (Customer)
export const getCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    let cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images stock merchantId');

    if (!cart) {
      cart = await Cart.create({
        customerId,
        items: [],
        subtotal: 0,
        total: 0
      });
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

    // Get merchantId from product
    const merchantId = product ? product.merchantId : null;

    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = new Cart({
        customerId,
        merchantId: merchantId,
        items: [],
        subtotal: 0,
        total: 0,
        discount: 0
      });
    }

    // If cart is empty, set merchantId
    if (cart.items.length === 0) {
      cart.merchantId = merchantId;
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.price;
      // Update merchantId in existing item
      existingItem.merchantId = merchantId;
    } else {
      // Add merchantId to the item
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        total: quantity * product.price,
        merchantId: merchantId  
      });
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
    cart.total = cart.subtotal - (cart.discount || 0);

    await cart.save();

    // Get updated cart with populated products
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images stock merchantId');

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

    const cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images stock merchantId');

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
    cart.total = cart.subtotal - (cart.discount || 0);

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images stock merchantId');

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


// @desc    Get cart items count
// @route   GET /api/customer/cart/count
// @access  Private (Customer)
export const getCartCount = async (req, res) => {
  try {
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });

    const count = cart && cart.items ? cart.items.length : 0;

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check if cart exists and has items
// @route   GET /api/customer/cart/exists
// @access  Private (Customer)
export const cartExists = async (req, res) => {
  try {
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });

    const exists = cart && cart.items && cart.items.length > 0;

    res.status(200).json({
      success: true,
      exists,
      itemCount: exists ? cart.items.length : 0
    });
  } catch (error) {
    console.error('Error checking cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/customer/cart/coupon
// @access  Private (Customer)
export const applyCoupon = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { couponCode, discountAmount } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images stock merchantId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate coupon logic here (integrate with your coupon model)
    const discount = discountAmount || cart.subtotal * 0.1; // 10% discount example

    cart.discount = discount;
    cart.couponCode = couponCode;
    cart.total = cart.subtotal - discount;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images stock merchantId');

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/customer/cart/coupon
// @access  Private (Customer)
export const removeCoupon = async (req, res) => {
  try {
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images stock merchantId');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.discount = 0;
    cart.couponCode = null;
    cart.total = cart.subtotal;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images stock merchantId');

    res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      cart: updatedCart
    });
  } catch (error) {
    console.error('Error removing coupon:', error);
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

    const cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images stock merchantId');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find the item being removed
    const removedItem = cart.items.find(item => item._id.toString() === itemId);

    if (!removedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Get merchant ID from the product
    const product = await Product.findById(removedItem.productId);
    const merchantId = product ? product.merchantId : null;

    // Save cart state before removal for abandoned cart tracking
    const cartSnapshot = {
      items: cart.items.map(item => ({
        productId: item.productId._id || item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal: cart.subtotal,
      total: cart.total,
      discount: cart.discount,
      couponCode: cart.couponCode
    };

    // Remove the item from cart
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.total, 0);
    cart.total = cart.subtotal - cart.discount;

    await cart.save();

    // Create abandoned cart record for the removed item
    if (merchantId) {
      try {
        const abandonedCart = new AbandonedCart({
          customerId: customerId,
          merchantId: merchantId,
          items: [{
            productId: removedItem.productId._id || removedItem.productId,
            quantity: removedItem.quantity,
            price: removedItem.price,
            total: removedItem.total
          }],
          subtotal: removedItem.total,
          total: removedItem.total,
          discount: 0,
          couponCode: null,
          removalType: 'single_item',
          removedItemsCount: 1,
          status: 'abandoned'
        });

        await abandonedCart.save();
        // console.log(`Abandoned cart tracked for product ${removedItem.productId}`);
      } catch (trackError) {
        console.error('Error tracking abandoned item:', trackError);
        // Don't fail the main operation if tracking fails
      }
    }

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

    const cart = await Cart.findOne({ customerId })
      .populate('items.productId', 'name price images stock merchantId');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // If cart has items, track them as abandoned
    if (cart.items.length > 0) {
      // Group items by merchant
      const itemsByMerchant = {};

      for (const item of cart.items) {
        const product = await Product.findById(item.productId);
        const merchantId = product ? product.merchantId : null;

        if (merchantId) {
          if (!itemsByMerchant[merchantId]) {
            itemsByMerchant[merchantId] = {
              merchantId: merchantId,
              items: [],
              subtotal: 0
            };
          }

          itemsByMerchant[merchantId].items.push({
            productId: item.productId._id || item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          });
          itemsByMerchant[merchantId].subtotal += item.total;
        }
      }

      // Create abandoned cart records for each merchant
      for (const merchantId in itemsByMerchant) {
        try {
          const merchantData = itemsByMerchant[merchantId];

          const abandonedCart = new AbandonedCart({
            customerId: customerId,
            merchantId: merchantId,
            items: merchantData.items,
            subtotal: merchantData.subtotal,
            total: merchantData.subtotal,
            discount: 0,
            couponCode: null,
            removalType: 'clear_all',
            removedItemsCount: merchantData.items.length,
            status: 'abandoned'
          });

          await abandonedCart.save();
          // console.log(`Abandoned carts tracked for merchant ${merchantId}: ${merchantData.items.length} items`);
        } catch (trackError) {
          console.error('Error tracking abandoned items on clear:', trackError);
          // Don't fail the main operation if tracking fails
        }
      }
    }

    // Clear the cart
    cart.items = [];
    cart.subtotal = 0;
    cart.total = 0;
    cart.discount = 0;
    cart.couponCode = null;
    await cart.save();

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