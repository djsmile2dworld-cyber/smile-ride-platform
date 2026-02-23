require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const { testConnection } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const SocketService = require('./services/socketService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/drivers');
const deliveryRoutes = require('./routes/deliveries');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/uploads');

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize socket service
const socketService = new SocketService(io);
global.io = io;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, error: 'Too many requests, please try again later' });
  }
});
app.use('/api/', limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/uploads', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    
    httpServer.listen(PORT, () => {
      console.log(`
🚀 ===================================
   SMILE RIDE SERVER RUNNING
   Port: ${PORT}
   Environment: ${process.env.NODE_ENV}
   API: http://localhost:${PORT}/api
   Health: http://localhost:${PORT}/health
=================================== 🚀
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };