const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const auditController = require('../controllers/audit.controller');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get audit statistics
router.get('/stats', auditController.getAuditStats);

// Get available actions
router.get('/actions', auditController.getAvailableActions);

// Export audit logs to CSV
router.get('/export', auditController.exportAuditLogs);

// Get user activity
router.get('/user/:userId', auditController.getUserActivity);

// Get entity activity
router.get('/entity/:entityType/:entityId', auditController.getEntityActivity);

// Get specific audit log by ID
router.get('/:id', auditController.getAuditLogById);

// Get all audit logs with filters
router.get('/', auditController.getAuditLogs);

module.exports = router;
