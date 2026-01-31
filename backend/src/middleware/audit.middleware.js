const auditService = require('../services/audit.service');

/**
 * Middleware to automatically log API requests
 * Usage: app.use(auditLogger('ACTION_NAME', 'ENTITY_TYPE'))
 * 
 * @param {string} action - The action being performed (use AuditActions constants)
 * @param {string} entityType - The entity type being acted upon (optional)
 * @returns {Function} Express middleware function
 */
function auditLogger(action, entityType = null) {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Store original json function
    const originalJson = res.json;

    // Override send to capture response
    res.send = function (data) {
      logAuditEvent(req, res, action, entityType);
      return originalSend.call(this, data);
    };

    // Override json to capture response
    res.json = function (data) {
      logAuditEvent(req, res, action, entityType);
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Helper function to log the audit event
 */
function logAuditEvent(req, res, action, entityType) {
  // Determine status based on response
  const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED';
  
  // Get IP address (handle proxy scenarios)
  const ipAddress = req.ip || 
                    req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress;

  // Extract entity ID from various sources
  const entityId = req.params.id || 
                   req.body?.id || 
                   req.body?.product_id || 
                   req.body?.order_id ||
                   null;

  // Log the audit event (async but don't await to avoid blocking)
  auditService.logAudit({
    userId: req.user?.id || null,
    userEmail: req.user?.email || null,
    action,
    entityType,
    entityId,
    description: `${req.method} ${req.originalUrl || req.path}`,
    ipAddress,
    userAgent: req.get('user-agent'),
    requestMethod: req.method,
    requestPath: req.originalUrl || req.path,
    status
  }).catch(err => {
    console.error('Audit middleware error:', err.message);
  });
}

/**
 * Middleware to log with change tracking
 * Captures before/after state for updates
 * 
 * @param {string} action - The action being performed
 * @param {string} entityType - The entity type
 * @param {Function} getOriginalData - Function to fetch original data
 */
function auditWithChanges(action, entityType, getOriginalData) {
  return async (req, res, next) => {
    let originalData = null;

    // Fetch original data before the operation
    if (getOriginalData && req.params.id) {
      try {
        originalData = await getOriginalData(req.params.id);
      } catch (error) {
        console.error('Failed to fetch original data for audit:', error.message);
      }
    }

    // Store original send function
    const originalSend = res.send;
    const originalJson = res.json;

    // Override to capture response and log changes
    const logWithChanges = function (data) {
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED';
      
      let changes = null;
      if (status === 'SUCCESS' && originalData && req.body) {
        changes = {
          before: originalData,
          after: req.body
        };
      }

      const ipAddress = req.ip || 
                        req.headers['x-forwarded-for']?.split(',')[0] || 
                        req.connection?.remoteAddress;

      const entityId = req.params.id || req.body?.id || null;

      auditService.logAudit({
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        action,
        entityType,
        entityId,
        description: `${req.method} ${req.originalUrl || req.path}`,
        ipAddress,
        userAgent: req.get('user-agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl || req.path,
        changes,
        status
      }).catch(err => {
        console.error('Audit middleware error:', err.message);
      });
    };

    res.send = function (data) {
      logWithChanges();
      return originalSend.call(this, data);
    };

    res.json = function (data) {
      logWithChanges();
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Simple audit logger for specific actions
 * Use this when you want to manually log within a controller
 * 
 * @param {Object} req - Express request object
 * @param {string} action - The action to log
 * @param {Object} options - Additional options
 */
async function logAction(req, action, options = {}) {
  const ipAddress = req.ip || 
                    req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection?.remoteAddress;

  return auditService.logAudit({
    userId: req.user?.id || null,
    userEmail: req.user?.email || null,
    action,
    entityType: options.entityType || null,
    entityId: options.entityId || null,
    description: options.description || `${req.method} ${req.path}`,
    ipAddress,
    userAgent: req.get('user-agent'),
    requestMethod: req.method,
    requestPath: req.originalUrl || req.path,
    changes: options.changes || null,
    status: options.status || 'SUCCESS'
  });
}

module.exports = {
  auditLogger,
  auditWithChanges,
  logAction
};
