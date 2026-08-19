// models/Driver.js
import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    // ==================== BASIC INFO ====================
    name: {
        type: String,
        required: [true, 'Driver name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    alternatePhone: {
        type: String,
        trim: true
    },

    // ==================== DRIVER SPECIFIC ====================
    driverId: {
        type: String,
        unique: true,
        trim: true
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true,
        trim: true
    },
    licenseExpiry: {
        type: Date,
        required: true
    },
    licenseImage: {
        type: String,
        default: ''
    },

    // ==================== VEHICLE DETAILS ====================
    vehicleType: {
        type: String,
        enum: ['bike', 'scooter', 'car', 'van', 'truck', 'auto'],
        required: true,
        default: 'bike'
    },
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    vehicleModel: {
        type: String,
        trim: true
    },
    vehicleImage: {
        type: String,
        default: ''
    },
    vehicleInsurance: {
        type: String,
        default: ''
    },
    vehicleInsuranceExpiry: {
        type: Date
    },

    // ==================== ASSIGNMENT ====================
    shipperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Shipper ID is required'],
        index: true
    },
    isAssigned: {
        type: Boolean,
        default: false
    },
    assignedAt: {
        type: Date
    },

    // ==================== STATUS & PERFORMANCE ====================
    status: {
        type: String,
        enum: ['available', 'busy', 'on_break', 'offline', 'unavailable'],
        default: 'available'
    },
    currentLocation: {
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
    address: {
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        zipCode: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            default: 'India'
        }
    },

    // ==================== PERFORMANCE METRICS ====================
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
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    experience: {
        type: Number,
        default: 0
    },

    // ==================== ASSIGNED ORDERS ====================
    assignedOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    }],
    currentLoad: {
        type: Number,
        default: 0
    },
    maxCapacity: {
        type: Number,
        default: 10
    },

    // ==================== DOCUMENTS ====================
    documents: [{
        type: {
            type: String,
            enum: ['aadhaar', 'pan', 'driving_license', 'vehicle_registration', 'insurance']
        },
        number: String,
        image: String,
        verified: {
            type: Boolean,
            default: false
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // ==================== ACCOUNT STATUS ====================
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastLogin: {
        type: Date
    },

    // ==================== NOTES ====================
    notes: {
        type: String,
        trim: true
    },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    }

}, {
    timestamps: true
});

// ==================== INDEXES ====================
driverSchema.index({ shipperId: 1, status: 1 });
driverSchema.index({ isAssigned: 1 });
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ vehicleNumber: 1 });
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ driverId: 1 });

// ==================== PRE-SAVE HOOK ====================
driverSchema.pre('save', function (next) {
    if (!this.driverId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.driverId = `DRV-${timestamp}${random}`;
    }
    next();
});

// ==================== VIRTUAL FIELDS ====================
driverSchema.virtual('deliverySuccessRate').get(function () {
    if (this.totalDeliveries === 0) return 0;
    return Math.round((this.successfulDeliveries / this.totalDeliveries) * 100);
});

driverSchema.virtual('isAvailable').get(function () {
    return this.status === 'available' && this.isActive;
});

// ==================== METHODS ====================
driverSchema.methods.canAcceptOrder = function () {
    return this.isAvailable && this.currentLoad < this.maxCapacity;
};

driverSchema.methods.assignOrder = function (orderId) {
    if (!this.canAcceptOrder()) return false;
    this.assignedOrders.push(orderId);
    this.currentLoad = this.assignedOrders.length;
    if (this.currentLoad >= this.maxCapacity) {
        this.status = 'busy';
    }
    return true;
};

driverSchema.methods.completeDelivery = function (success) {
    this.totalDeliveries += 1;
    if (success) {
        this.successfulDeliveries += 1;
    } else {
        this.failedDeliveries += 1;
    }
    // Update rating
    const rate = this.successfulDeliveries / this.totalDeliveries;
    this.rating = Math.round(rate * 5 * 10) / 10;
    return this.save();
};

driverSchema.methods.updateLocation = function (latitude, longitude) {
    this.currentLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
        updatedAt: new Date()
    };
    return this.save();
};

// ==================== STATIC METHODS ====================
driverSchema.statics.getAvailableDrivers = function (shipperId) {
    return this.find({
        shipperId: shipperId,
        isActive: true,
        status: 'available',
        currentLoad: { $lt: '$maxCapacity' }
    }).sort({ rating: -1 });
};

driverSchema.statics.getDriverStats = function (shipperId) {
    return this.aggregate([
        { $match: { shipperId: shipperId, isActive: true } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                totalDeliveries: { $sum: '$totalDeliveries' }
            }
        }
    ]);
};

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;