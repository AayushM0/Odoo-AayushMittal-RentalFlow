require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');

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
      products: '/api/products'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

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
