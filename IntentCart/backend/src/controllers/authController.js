import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'IntentCart1028', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Get redirect URL based on role
const getRedirectUrl = (role) => {
  const redirectMap = {
    admin: '/admin-dashboard',
    merchant: '/merchant-dashboard',
    customer: '/',
    shipper: '/shipping-dashboard'
  };
  return redirectMap[role] || '/';
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    // console.log('=== SIGNUP REQUEST STARTED ===');
    // console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      username,
      email,
      password,
      role,
      businessName,
      businessDescription,
      businessAddress,
      businessPhone,
      shipperDetails
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Username';
      // console.log(`${field} already exists`);
      return res.status(400).json({
        success: false,
        message: `${field} already registered`
      });
    }

    // Prepare user data
    const userData = {
      username,
      email,
      password,
      role: role || 'customer',
      isApproved: role === 'admin' ? true : false,
      isActive: true
    };

    // Add merchant fields if role is merchant
    if (role === 'merchant') {
      if (!businessName) {
        // console.log('Business name missing for merchant');
        return res.status(400).json({
          success: false,
          message: 'Business name is required for merchants'
        });
      }
      userData.businessName = businessName;
      userData.businessDescription = businessDescription || '';
      userData.businessAddress = businessAddress || '';
      userData.businessPhone = businessPhone || '';
      // console.log('Merchant data prepared');
    }

    // Add shipper fields if role is shipper
    if (role === 'shipper') {
      // console.log('Processing shipper registration...');
      // console.log('shipperDetails received:', JSON.stringify(shipperDetails, null, 2));

      // Validate required shipper fields
      if (!shipperDetails?.branch) {
        // console.log('Branch missing for shipper');
        return res.status(400).json({
          success: false,
          message: 'Branch is required for shippers'
        });
      }
      if (!shipperDetails?.vehicleNumber) {
        // console.log('Vehicle number missing for shipper');
        return res.status(400).json({
          success: false,
          message: 'Vehicle number is required for shippers'
        });
      }
      if (!shipperDetails?.licenseNumber) {
        // console.log('License number missing for shipper');
        return res.status(400).json({
          success: false,
          message: 'License number is required for shippers'
        });
      }

      userData.shipperDetails = {
        branch: shipperDetails.branch,
        assignedRegion: shipperDetails.assignedRegion || '',
        vehicleNumber: shipperDetails.vehicleNumber,
        licenseNumber: shipperDetails.licenseNumber,
        experience: parseInt(shipperDetails.experience) || 0,
        currentStatus: 'available',
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        rating: 0,
        lastLocation: {
          type: 'Point',
          coordinates: [0, 0],
          updatedAt: new Date()
        },
        assignedOrders: []
      };

      userData.performanceMetrics = {
        onTimeDelivery: 0,
        averageDeliveryTime: 0,
        customerRating: 0,
        totalEarnings: 0,
        weeklyEarnings: 0
      };

      userData.isApproved = true;
      // console.log('Shipper data prepared, isApproved set to:', userData.isApproved);
    }

    // For customers, auto-approve
    if (role === 'customer') {
      userData.isApproved = true;
      // console.log('Customer data prepared, isApproved set to true');
    }

    // console.log('Creating user with final data:', JSON.stringify(userData, null, 2));

    // Create user
    const user = await User.create(userData);
    // console.log('User created successfully with ID:', user._id);

    // Generate token
    const token = generateToken(user._id);

    // Prepare response based on role
    const responseUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      redirectUrl: getRedirectUrl(user.role)
    };

    // Add role-specific data to response
    if (role === 'merchant') {
      responseUser.businessName = user.businessName;
      responseUser.isApproved = user.isApproved;
    }

    if (role === 'shipper') {
      responseUser.isApproved = user.isApproved;
      responseUser.shipperDetails = user.shipperDetails;
      // console.log('Shipper response data:', JSON.stringify(responseUser, null, 2));
    }

    // console.log('=== SIGNUP COMPLETED SUCCESSFULLY ===');
    // console.log('Response:', JSON.stringify({
    //   success: true,
    //   message: role === 'shipper' ? 'Shipper registered successfully!' : 'User registered successfully',
    //   user: responseUser
    // }, null, 2));

    res.status(201).json({
      success: true,
      message: role === 'shipper'
        ? 'Shipper registered successfully!'
        : 'User registered successfully',
      token,
      user: responseUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error stack:', error.stack);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user - Decides which panel to redirect
// @route   POST /api/auth/signin
// @access  Public
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // console.log('=== LOGIN ATTEMPT ===');
    // console.log('Email:', email);

    // CHECK 1: Is this the SUPER ADMIN from .env?
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD?.trim();
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME?.trim() || 'admin';

    // Check if email matches super admin AND password matches
    if (email === superAdminEmail && password === superAdminPassword) {
      // console.log('Super Admin login detected!');

      let adminUser = await User.findOne({ email: superAdminEmail });

      if (!adminUser) {
        // console.log('Creating Super Admin in database...');
        adminUser = await User.create({
          username: superAdminUsername,
          email: superAdminEmail,
          password: superAdminPassword,
          role: 'admin',
          isApproved: true,
          isActive: true
        });
        // console.log('Super Admin created successfully');
      } else {
        // console.log('Super Admin found in database');
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          await adminUser.save();
          // console.log('Updated user role to admin');
        }
      }

      const token = generateToken(adminUser._id);
      adminUser.lastLogin = new Date();
      await adminUser.save();

      const userResponse = {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: 'admin',
        redirectUrl: '/admin-dashboard'
      };

      // console.log('Admin login successful:', JSON.stringify(userResponse, null, 2));

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        user: userResponse
      });
    }

    // CHECK 2: Regular user login
    // console.log('Looking for regular user with email:', email);
    const user = await User.findOne({ email });

    if (!user) {
      // console.log('User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // console.log('User found:', {
    //   id: user._id,
    //   username: user.username,
    //   email: user.email,
    //   role: user.role,
    //   isActive: user.isActive,
    //   isApproved: user.isApproved,
    //   hasShipperDetails: !!user.shipperDetails,
    //   shipperBranch: user.shipperDetails?.branch
    // });

    // Check if account is active
    if (!user.isActive) {
      // console.log('Account is inactive');
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    // Check if shipper is approved
    if (user.role === 'shipper' && !user.isApproved) {
      // console.log('Shipper not approved - isApproved:', user.isApproved);
      return res.status(403).json({
        success: false,
        message: 'Your shipper account is pending approval. Please wait for admin approval.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // console.log('Password verified successfully');

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Prepare response based on role
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      redirectUrl: getRedirectUrl(user.role)
    };

    // Add role-specific data
    if (user.role === 'merchant') {
      userResponse.businessName = user.businessName;
      userResponse.isApproved = user.isApproved;
    }

    if (user.role === 'shipper') {
      userResponse.isApproved = user.isApproved;
      userResponse.shipperDetails = user.shipperDetails;
      userResponse.performanceMetrics = user.performanceMetrics;
      // console.log('Shipper data in response:', {
      //   isApproved: user.isApproved,
      //   shipperDetails: user.shipperDetails ? 'Present' : 'Missing',
      //   branch: user.shipperDetails?.branch,
      //   vehicleNumber: user.shipperDetails?.vehicleNumber,
      //   status: user.shipperDetails?.currentStatus
      // });
    }

    // console.log('=== LOGIN SUCCESSFUL ===');
    // console.log('User response:', JSON.stringify(userResponse, null, 2));
    // console.log('Redirecting to:', userResponse.redirectUrl);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    let userData = req.user.toJSON();

    res.status(200).json({
      success: true,
      user: {
        ...userData,
        redirectUrl: getRedirectUrl(req.user.role)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['username', 'email', 'businessName', 'businessDescription', 'businessAddress', 'businessPhone'];
    const updateKeys = Object.keys(updates);

    if (updateKeys.includes('password')) {
      return res.status(400).json({
        success: false,
        message: 'Use the change password endpoint'
      });
    }
    if (updateKeys.includes('role')) {
      return res.status(400).json({
        success: false,
        message: 'Role cannot be changed'
      });
    }

    const isValidOperation = updateKeys.every(key => allowedUpdates.includes(key));
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates'
      });
    }

    if (updates.email || updates.username) {
      const existingUser = await User.findOne({
        $or: [
          { email: updates.email },
          { username: updates.username }
        ],
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...user.toJSON(),
        redirectUrl: getRedirectUrl(user.role)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user._id);

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};