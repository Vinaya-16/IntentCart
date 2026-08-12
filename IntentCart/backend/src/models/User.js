import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'merchant', 'customer'],
    default: 'customer',
    required: [true, 'Role is required']
  },

  // ==================== PERSONAL INFO ====================
  name: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  dob: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  stateZip: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },

  // ==================== AVATAR & IMAGES ====================
  avatarUrl: {
    type: String,
    trim: true,
    default: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250'
  },
  coverImage: {
    type: String,
    trim: true,
    default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200'
  },

  // ==================== ACCOUNT STATUS ====================
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },

  // ==================== MERCHANT SPECIFIC ====================
  merchantStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  businessName: {
    type: String,
    trim: true
  },
  businessDescription: {
    type: String,
    trim: true
  },
  businessAddress: {
    type: String,
    trim: true
  },
  businessPhone: {
    type: String,
    trim: true
  },

  // Merchant Risk Score Fields
  riskScore: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  riskPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  riskFactors: {
    type: Object,
    default: {}
  },
  riskAssessedAt: {
    type: Date,
    default: null
  },
  riskAssessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  riskAssessmentHistory: [{
    score: String,
    percentage: Number,
    factors: Object,
    assessedAt: Date,
    assessedBy: mongoose.Schema.Types.ObjectId
  }],

  // ==================== CUSTOMER SPECIFIC ====================
  tier: {
    type: String,
    enum: ['Silver Member', 'Gold Member', 'Platinum Member'],
    default: 'Silver Member'
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  wishlistCount: {
    type: Number,
    default: 0
  },

  // ==================== ADDRESSES ====================
  addresses: [{
    type: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home'
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zip: {
      type: String,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],

  // ==================== PAYMENTS ====================
  payments: [{
    brand: {
      type: String,
      enum: ['Visa', 'Mastercard', 'Amex', 'Card', 'American Express', 'Discover'],
      default: 'Card'
    },
    last4: {
      type: String,
      required: true
    },
    expiry: {
      type: String,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }]

}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);
export default User;