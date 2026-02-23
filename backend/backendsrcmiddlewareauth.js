const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['passwordHash'] }
    });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Account suspended' });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.userType
      });
    }
    
    next();
  };
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['passwordHash'] }
      });
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };