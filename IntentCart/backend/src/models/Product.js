import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Merchant ID is required']
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [300, 'Short description cannot exceed 300 characters']
    },

    // Category fields
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    microCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    compareAtPrice: {
        type: Number,
        min: [0, 'Price cannot be negative']
    },
    // In Product model
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    costPerItem: {
        type: Number,
        min: [0, 'Cost per item cannot be negative']
    },
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    sku: {
        type: String,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    weight: {
        type: Number,
        min: [0, 'Weight cannot be negative']
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    images: {
        type: [{
            url: {
                type: String,
                required: true
            },
            alt: {
                type: String,
                default: ''
            },
            isPrimary: {
                type: Boolean,
                default: false
            }
        }],
        default: []
    },
    videos: [{
        url: String,
        title: String
    }],
    variants: [{
        name: String,
        options: [{
            value: String,
            price: Number,
            stock: Number,
            sku: String
        }]
    }],
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'inactive'],
        default: 'draft'
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvalReason: {
        type: String,
        trim: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    views: {
        type: Number,
        default: 0
    },
    metaTitle: {
        type: String,
        trim: true,
        maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    seoKeywords: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Create slug from name before saving
productSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '-');
    }
    next();
});

// Index for faster queries
productSchema.index({ merchantId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ approvalStatus: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;