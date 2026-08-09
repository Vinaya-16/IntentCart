import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/authRoute.js';

import adminRoutes from './src/routes/adminRoutes.js';

import seedSuperAdmin from './src/utils/seeder.js';

import merchantRoute from './src/routes/merchantRoute.js';

import categoryRoute from './src/routes/categoryRoute.js';

import customerRoute from './src/routes/customerRoute.js';

import productRoute from './src/routes/productRoute.js';

import eventRoute from './src/routes/eventRoute.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

seedSuperAdmin();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/auth', limiter);

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/merchant', merchantRoute);

app.use('/api', categoryRoute);

app.use('/api/customer', customerRoute);

app.use('/api/product', productRoute);

app.use('/api/events', eventRoute);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;