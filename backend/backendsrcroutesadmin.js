const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin', 'support'));

// Dashboard
router.get('/dashboard', asyncHandler(adminController.getDashboardStats));
router.get('/live-monitor', asyncHandler(adminController.getLiveMonitorData));

// User management
router.get('/users', asyncHandler(adminController.getUsers));
router.get('/users/:userId', asyncHandler(adminController.getUserDetail));
router.put('/users/:userId/status', asyncHandler(adminController.updateUserStatus));
router.put('/users/:userId/verify', asyncHandler(adminController.verifyDriver));
router.delete('/users/:userId', asyncHandler(adminController.deleteUser));

// Driver management
router.get('/drivers/pending', asyncHandler(adminController.getPendingDrivers));
router.get('/drivers/online', asyncHandler(adminController.getOnlineDrivers));
router.post('/drivers/:userId/approve', asyncHandler(adminController.approveDriver));
router.post('/drivers/:userId/reject', asyncHandler(adminController.rejectDriver));

// Ride/Assignment management
router.get('/assignments/pending', asyncHandler(adminController.getPendingAssignments));
router.post('/assignments/manual', asyncHandler(adminController.manualAssignDriver));
router.post('/assignments/batch', asyncHandler(adminController.batchAssignDrivers));
router.post('/rides/:rideId/reassign', asyncHandler(adminController.reassignDriver));
router.post('/rides/:rideId/cancel', asyncHandler(adminController.cancelRide));

// Analytics & Reports
router.get('/analytics', asyncHandler(adminController.getAnalytics));
router.get('/analytics/revenue', asyncHandler(adminController.getRevenueAnalytics));
router.get('/analytics/rides', asyncHandler(adminController.getRideAnalytics));
router.get('/analytics/drivers', asyncHandler(adminController.getDriverAnalytics));
router.post('/reports/export', asyncHandler(adminController.exportReport));

// System settings
router.get('/settings', asyncHandler(adminController.getSettings));
router.put('/settings', asyncHandler(adminController.updateSettings));
router.get('/logs', asyncHandler(adminController.getAdminLogs));
router.get('/logs/audit', asyncHandler(adminController.getAuditTrail));

// Support tickets
router.get('/tickets', asyncHandler(adminController.getSupportTickets));
router.put('/tickets/:ticketId', asyncHandler(adminController.updateTicket));
router.post('/tickets/:ticketId/escalate', asyncHandler(adminController.escalateTicket));

module.exports = router;