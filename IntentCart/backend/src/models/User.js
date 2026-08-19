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
    enum: ['admin', 'merchant', 'customer', 'shipper'],
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
    default: ''
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
    default: false
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
    default: 'pending'
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
  riskNotes: {
    type: [String],
    default: []
  },

  // ==================== CUSTOMER SPECIFIC ====================
  tier: {
    type: String,
    enum: ['Silver Member', 'Gold Member', 'Platinum Member'],
    default: 'Platinum Member'
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

  // ==================== SHIPPER DETAILS (ROOT LEVEL) ====================
  shipperDetails: {
    branch: {
      type: String,
      trim: true
    },
    assignedRegion: {
      type: String,
      trim: true
    },
    vehicleNumber: {
      type: String,
      trim: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    experience: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    successfulDeliveries: {
      type: Number,
      default: 0
    },
    failedDeliveries: {
      type: Number,
      default: 0
    },
    currentStatus: {
      type: String,
      enum: ['available', 'busy', 'offline', 'on_break'],
      default: 'available'
    },
    lastLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    // THIS IS THE KEY FIX - Add assignedOrders at root level
    assignedOrders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }]
  },

  // ==================== PERFORMANCE METRICS (ROOT LEVEL) ====================
  performanceMetrics: {
    onTimeDelivery: {
      type: Number,
      default: 0
    },
    averageDeliveryTime: {
      type: Number,
      default: 0
    },
    customerRating: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    weeklyEarnings: {
      type: Number,
      default: 0
    }
  },

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
    },
    shippingPreferences: {
      maxWeight: {
        type: Number,
        default: 100
      },
      serviceRadius: {
        type: Number,
        default: 50
      },
      preferredAreas: [{
        type: String,
        trim: true
      }],
      workingHours: {
        start: {
          type: String,
          default: '09:00'
        },
        end: {
          type: String,
          default: '18:00'
        }
      }
    }
  }]

}, {
  timestamps: true
});

// Add 2dsphere index for location queries
userSchema.index({ 'shipperDetails.lastLocation': '2dsphere' });

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