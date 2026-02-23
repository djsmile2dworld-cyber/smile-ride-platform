const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));

// Protected routes
router.get('/verify', authenticate, asyncHandler(authController.verifyToken));
router.get('/me', authenticate, asyncHandler(authController.getCurrentUser));
router.put('/me', authenticate, asyncHandler(authController.updateProfile));
router.post('/change-password', authenticate, asyncHandler(authController.changePassword));
router.post('/logout', authenticate, asyncHandler(authController.logout));

// Device management
router.post('/device', authenticate, asyncHandler(authController.registerDevice));
router.delete('/device/:deviceId', authenticate, asyncHandler(authController.unregisterDevice));

module.exports = router;