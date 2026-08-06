import User from '../models/User.js';
import Notification from '../models/Notifications.js';

// ==================== CUSTOMER PROFILE ====================

// @desc    Get customer profile
// @route   GET /api/customer/profile
// @access  Private (Customer)
export const getCustomerProfile = async (req, res) => {
    try {
        const customer = await User.findById(req.user._id).select('-password');
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Format profile data
        const profileData = {
            id: customer._id,
            name: customer.name || customer.username || 'Customer',
            email: customer.email,
            phone: customer.phone || '',
            avatar: customer.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
            cover: customer.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
            memberSince: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            }) : 'January 2022',
            tier: customer.tier || 'Silver Member',
            stats: {
                orders: customer.totalOrders || 0,
                rewardPoints: customer.rewardPoints || 0,
                wishlist: customer.wishlistCount || 0
            },
            addresses: customer.addresses || [],
            payments: customer.payments || []
        };

        res.status(200).json({
            success: true,
            profile: profileData
        });
    } catch (error) {
        console.error('Error fetching customer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update customer profile
// @route   PUT /api/customer/profile
// @access  Private (Customer)
export const updateCustomerProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const customerId = req.user._id;

        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if email is taken
        if (email && email !== customer.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: customerId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        // Update fields
        if (name) customer.name = name;
        if (email) customer.email = email;
        if (phone) customer.phone = phone;

        await customer.save();

        // Create notification
        await Notification.create({
            title: 'Profile Updated',
            message: 'Your profile has been updated successfully.',
            type: 'success',
            category: 'Updates',
            panel: 'customer',
            customerId: customerId,
            isGlobal: false
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            }
        });
    } catch (error) {
        console.error('Error updating customer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update customer avatar
// @route   PUT /api/customer/avatar
// @access  Private (Customer)
export const updateCustomerAvatar = async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        const customerId = req.user._id;

        if (!avatarUrl) {
            return res.status(400).json({
                success: false,
                message: 'Avatar URL is required'
            });
        }

        const customer = await User.findByIdAndUpdate(
            customerId,
            { avatarUrl },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            avatarUrl: customer.avatarUrl
        });
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Add address
// @route   POST /api/customer/addresses
// @access  Private (Customer)
export const addAddress = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { type, street, city, state, zip, isDefault } = req.body;

        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // If this is default, unset other defaults
        if (isDefault) {
            customer.addresses.forEach(addr => addr.isDefault = false);
        }

        customer.addresses.push({
            type: type || 'Home',
            street,
            city,
            state,
            zip,
            isDefault: isDefault || false
        });

        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            addresses: customer.addresses
        });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete address
// @route   DELETE /api/customer/addresses/:id
// @access  Private (Customer)
export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user._id;

        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        customer.addresses = customer.addresses.filter(addr => addr._id.toString() !== id);
        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
            addresses: customer.addresses
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Add payment method
// @route   POST /api/customer/payments
// @access  Private (Customer)
export const addPaymentMethod = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { brand, last4, expiry, isDefault } = req.body;

        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // If this is default, unset other defaults
        if (isDefault) {
            customer.payments.forEach(p => p.isDefault = false);
        }

        customer.payments.push({
            brand: brand || 'Card',
            last4,
            expiry,
            isDefault: isDefault || false
        });

        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Payment method added successfully',
            payments: customer.payments
        });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete payment method
// @route   DELETE /api/customer/payments/:id
// @access  Private (Customer)
export const deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user._id;

        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        customer.payments = customer.payments.filter(p => p._id.toString() !== id);
        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Payment method deleted successfully',
            payments: customer.payments
        });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};