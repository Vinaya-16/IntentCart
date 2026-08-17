import User from "../models/User.js";

// @desc    Update shipper status
// @route   PUT /api/auth/shipper/status
// @access  Private (Shipper only)
export const updateShipperStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['available', 'busy', 'offline', 'on_break'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid statuses: available, busy, offline, on_break'
            });
        }

        // Check if user is a shipper
        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Only shippers can update their status'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user.shipperDetails) {
            user.shipperDetails = {};
        }

        user.shipperDetails.currentStatus = status;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Shipper status updated successfully',
            currentStatus: status
        });
    } catch (error) {
        console.error('Update shipper status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update shipper location
// @route   PUT /api/auth/shipper/location
// @access  Private (Shipper only)
export const updateShipperLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Check if user is a shipper
        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Only shippers can update their location'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user.shipperDetails) {
            user.shipperDetails = {};
        }

        user.shipperDetails.lastLocation = {
            type: 'Point',
            coordinates: [longitude, latitude],
            updatedAt: new Date()
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            location: user.shipperDetails.lastLocation
        });
    } catch (error) {
        console.error('Update shipper location error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get shipper dashboard stats
// @route   GET /api/auth/shipper/dashboard
// @access  Private (Shipper only)
export const getShipperDashboard = async (req, res) => {
    try {
        // Check if user is a shipper
        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Shipper only.'
            });
        }

        const user = await User.findById(req.user._id)
            .populate('shipperDetails.assignedOrders', 'orderNumber status totalAmount shippingAddress customerName createdAt');

        const stats = {
            totalDeliveries: user.shipperDetails?.totalDeliveries || 0,
            successfulDeliveries: user.shipperDetails?.successfulDeliveries || 0,
            failedDeliveries: user.shipperDetails?.failedDeliveries || 0,
            successRate: user.shipperDetails?.totalDeliveries > 0
                ? ((user.shipperDetails.successfulDeliveries / user.shipperDetails.totalDeliveries) * 100).toFixed(2)
                : 0,
            rating: user.shipperDetails?.rating || 0,
            currentStatus: user.shipperDetails?.currentStatus || 'offline',
            assignedOrders: user.shipperDetails?.assignedOrders?.length || 0,
            performance: {
                onTimeDelivery: user.performanceMetrics?.onTimeDelivery || 0,
                averageDeliveryTime: user.performanceMetrics?.averageDeliveryTime || 0,
                customerRating: user.performanceMetrics?.customerRating || 0,
                totalEarnings: user.performanceMetrics?.totalEarnings || 0,
                weeklyEarnings: user.performanceMetrics?.weeklyEarnings || 0
            }
        };

        res.status(200).json({
            success: true,
            stats,
            shipperDetails: user.shipperDetails
        });
    } catch (error) {
        console.error('Get shipper dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get shipper profile
// @route   GET /api/auth/shipper/profile
// @access  Private (Shipper only)
export const getShipperProfile = async (req, res) => {
    try {
        // Check if user is a shipper
        if (req.user.role !== 'shipper') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Shipper only.'
            });
        }

        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('shipperDetails.assignedOrders', 'orderNumber status totalAmount shippingAddress customerName createdAt');

        res.status(200).json({
            success: true,
            shipper: user
        });
    } catch (error) {
        console.error('Get shipper profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all shippers (Admin only)
// @route   GET /api/auth/admin/shippers
// @access  Private (Admin only)
export const getAllShippers = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { status, search, page = 1, limit = 10 } = req.query;

        let query = { role: 'shipper' };

        if (status === 'pending') {
            query.isApproved = false;
        } else if (status === 'approved') {
            query.isApproved = true;
        }

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'shipperDetails.branch': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [shippers, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            shippers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all shippers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Approve or reject shipper (Admin only)
// @route   PUT /api/auth/admin/shippers/:shipperId/approve
// @access  Private (Admin only)
export const approveShipper = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { shipperId } = req.params;
        const { approve } = req.body;

        if (approve === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Approve status is required'
            });
        }

        const user = await User.findById(shipperId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Shipper not found'
            });
        }

        if (user.role !== 'shipper') {
            return res.status(400).json({
                success: false,
                message: 'User is not a shipper'
            });
        }

        user.isApproved = approve;
        await user.save();

        res.status(200).json({
            success: true,
            message: `Shipper ${approve ? 'approved' : 'rejected'} successfully`,
            shipper: {
                id: user._id,
                username: user.username,
                email: user.email,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        console.error('Approve shipper error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};