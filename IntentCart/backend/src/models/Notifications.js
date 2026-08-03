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
    enum: ['user', 'alert', 'success', 'info', 'system'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['Under Review', 'Alerts', 'Updates', 'System', 'General'],
    default: 'General'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For admin notifications (system-wide)
  isGlobal: {
    type: Boolean,
    default: true
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // For actions (e.g., link to merchant, product, etc.)
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

// Index for faster queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isGlobal: 1 });

// Update readAt when read status changes
notificationSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read === true) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;