import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
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
  merchantStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  isActive: {
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
  // Merchant specific fields
  businessName: {
    type: String,
    trim: true,
    required: function () {
      return this.role === 'merchant';
    }
  },
  businessDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  businessAddress: {
    type: String,
    trim: true
  },
  businessPhone: {
    type: String,
    trim: true
  },
  businessLogo: {
    type: String,
    default: null
  },
  businessStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function () {
      return this.role === 'merchant' ? 'pending' : 'approved';
    }
  },
  // Admin specific fields
  adminPermissions: {
    type: [String],
    default: [],
    enum: ['users', 'products', 'orders', 'reviews', 'settings', 'analytics']
  },
  // Add these to your userSchema
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
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
  mobile: {
    type: String,
    trim: true
  },
  phone: {
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
  avatarUrl: {
    type: String,
    trim: true
  }
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