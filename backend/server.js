require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const reservationRoutes = require('./src/routes/reservation.routes');
const orderRoutes = require('./src/routes/order.routes');
const quotationRoutes = require('./src/routes/quotation.routes');
const pricingRoutes = require('./src/routes/pricing.routes');
const pickupRoutes = require('./src/routes/pickup.routes');
const returnRoutes = require('./src/routes/return.routes');
const invoiceRoutes = require('./src/routes/invoice.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const customerRoutes = require('./src/routes/customer.routes');
const vendorRoutes = require('./src/routes/vendor.routes');
const adminRoutes = require('./src/routes/admin.routes');
const adminUserRoutes = require('./src/routes/adminUser.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const searchRoutes = require('./src/routes/search.routes');
const auditRoutes = require('./src/routes/audit.routes');
const settingsRoutes = require('./src/routes/settings.routes');

require('./src/jobs/emailReminders');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true // Allow cookies to be sent
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logging

// Serve static images from 06_SRC/images folder
const path = require('path');
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Rental ERP Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API root route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Rental ERP API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      products: '/api/products',
      upload: '/api/upload',
      reservations: '/api/reservations',
      orders: '/api/orders',
      quotations: '/api/quotations',
      pricing: '/api/pricing',
      pickups: '/api/pickups',
      returns: '/api/returns',
      invoices: '/api/invoices',
      payments: '/api/payments',
      customers: '/api/customers',
      admin: '/api/admin',
      notifications: '/api/notifications',
      search: '/api/search',
      audit: '/api/audit',
      settings: '/api/settings'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

module.exports = app;
