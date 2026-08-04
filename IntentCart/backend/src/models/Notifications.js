import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['user', 'alert', 'success', 'info', 'system', 'order', 'product', 'payment'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['Under Review', 'Alerts', 'Updates', 'System', 'General', 'Orders', 'Products', 'Payments'],
    default: 'General'
  },
  panel: {
    type: String,
    enum: ['admin', 'merchant', 'customer'],
    required: [true, 'Panel is required']
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionLink: {
    type: String,
    trim: true
  },
  actionLabel: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ panel: 1 });
notificationSchema.index({ merchantId: 1 });
notificationSchema.index({ customerId: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: -1 });

// Update readAt when read status changes
notificationSchema.pre('save', function (next) {
  if (this.isModified('read') && this.read === true) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;