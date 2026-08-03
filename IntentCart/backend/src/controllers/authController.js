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
    customer: '/'
  };
  return redirectMap[role] || '/';
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role, 
      businessName, 
      businessDescription, 
      businessAddress, 
      businessPhone 
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Username';
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
        return res.status(400).json({
          success: false,
          message: 'Business name is required for merchants'
        });
      }
      userData.businessName = businessName;
      userData.businessDescription = businessDescription || '';
      userData.businessAddress = businessAddress || '';
      userData.businessPhone = businessPhone || '';
    }

    // Create user
    const user = await User.create(userData);
    
    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        redirectUrl: getRedirectUrl(user.role)
      }
    });
  } catch (error) {
    console.error(error);
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
// src/controllers/authController.js - Updated signin function

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // console.log('Login attempt:', { email });

    // CHECK 1: Is this the SUPER ADMIN from .env?
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD?.trim();
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME?.trim() || 'admin';

    // Check if email matches super admin AND password matches
    if (email === superAdminEmail && password === superAdminPassword) {
      // console.log('Super Admin login detected!');
      
      // Check if super admin exists in DB
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
        // Ensure the role is set to admin
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          await adminUser.save();
          // console.log('Updated user role to admin');
        }
      }

      // Generate token
      const token = generateToken(adminUser._id);
      
      // Update last login
      adminUser.lastLogin = new Date();
      await adminUser.save();

      const userResponse = {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: 'admin', 
        redirectUrl: '/admin-dashboard'
      };

      // console.log('Admin login successful:', userResponse);

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        user: userResponse
      });
    }

    // CHECK 2: Regular user login
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Decide redirect URL based on role
    const redirectUrl = getRedirectUrl(user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        redirectUrl: redirectUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
    res.status(200).json({
      success: true,
      user: {
        ...req.user.toJSON(),
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