const db = require('../config/database');

/**
 * Audit Actions - Standardized action types for logging
 */
const AuditActions = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  
  // User Management
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  CHANGE_USER_ROLE: 'CHANGE_USER_ROLE',
  ACTIVATE_USER: 'ACTIVATE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  
  // Product Management
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  UPLOAD_PRODUCT_IMAGE: 'UPLOAD_PRODUCT_IMAGE',
  
  // Order Management
  CREATE_ORDER: 'CREATE_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  CANCEL_ORDER: 'CANCEL_ORDER',
  CONFIRM_ORDER: 'CONFIRM_ORDER',
  COMPLETE_ORDER: 'COMPLETE_ORDER',
  
  // Quotation
  CREATE_QUOTATION: 'CREATE_QUOTATION',
  UPDATE_QUOTATION: 'UPDATE_QUOTATION',
  APPROVE_QUOTATION: 'APPROVE_QUOTATION',
  REJECT_QUOTATION: 'REJECT_QUOTATION',
  
  // Payment
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_INITIATED: 'REFUND_INITIATED',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  
  // Invoice
  CREATE_INVOICE: 'CREATE_INVOICE',
  UPDATE_INVOICE: 'UPDATE_INVOICE',
  SEND_INVOICE: 'SEND_INVOICE',
  
  // Pickup & Return
  SCHEDULE_PICKUP: 'SCHEDULE_PICKUP',
  COMPLETE_PICKUP: 'COMPLETE_PICKUP',
  SCHEDULE_RETURN: 'SCHEDULE_RETURN',
  COMPLETE_RETURN: 'COMPLETE_RETURN',
  
  // Notification
  SEND_NOTIFICATION: 'SEND_NOTIFICATION',
  SEND_EMAIL: 'SEND_EMAIL',
  
  // System
  SYSTEM_SETTINGS_CHANGED: 'SYSTEM_SETTINGS_CHANGED',
  DATA_EXPORT: 'DATA_EXPORT',
  BACKUP_CREATED: 'BACKUP_CREATED',
  DATABASE_MIGRATION: 'DATABASE_MIGRATION'
};

/**
 * Log an audit event
 * @param {Object} options - Audit log options
 */
async function logAudit({
  userId = null,
  userEmail = null,
  action,
  entityType = null,
  entityId = null,
  description = null,
  ipAddress = null,
  userAgent = null,
  requestMethod = null,
  requestPath = null,
  changes = null,
  status = 'SUCCESS'
}) {
  try {
    const query = `
      INSERT INTO audit_logs 
      (user_id, user_email, action, entity_type, entity_id, description, 
       ip_address, user_agent, request_method, request_path, changes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;
    
    const values = [
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      description,
      ipAddress,
      userAgent,
      requestMethod,
      requestPath,
      changes ? JSON.stringify(changes) : null,
      status
    ];
    
    const result = await db.query(query, values);
    
    console.log(`✅ Audit log created: ${action} by ${userEmail || userId || 'system'} [ID: ${result.rows[0].id}]`);
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ Audit log error:', error.message);
    // Don't throw - audit logging should not break the main flow
    // But log to console for debugging
  }
}

/**
 * Get audit logs with filters
 * @param {Object} filters - Filter options
 */
async function getAuditLogs({
  userId,
  action,
  entityType,
  startDate,
  endDate,
  status,
  page = 1,
  limit = 50
}) {
  try {
    let query = `
      SELECT 
        id,
        user_id,
        user_email,
        action,
        entity_type,
        entity_id,
        description,
        ip_address,
        request_method,
        request_path,
        status,
        created_at
      FROM audit_logs
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    if (action) {
      paramCount++;
      query += ` AND action = $${paramCount}`;
      params.push(action);
    }

    if (entityType) {
      paramCount++;
      query += ` AND entity_type = $${paramCount}`;
      params.push(entityType);
    }

    if (startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(query, params);

    return {
      logs: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    };
  } catch (error) {
    console.error('Get audit logs error:', error);
    throw error;
  }
}

/**
 * Get audit log by ID (with full details including changes)
 * @param {number} id - Audit log ID
 */
async function getAuditLogById(id) {
  try {
    const query = `SELECT * FROM audit_logs WHERE id = $1`;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const log = result.rows[0];
    
    // Parse JSON changes if present
    if (log.changes && typeof log.changes === 'string') {
      try {
        log.changes = JSON.parse(log.changes);
      } catch (e) {
        console.error('Failed to parse changes JSON:', e);
      }
    }

    return log;
  } catch (error) {
    console.error('Get audit log error:', error);
    throw error;
  }
}

/**
 * Get audit statistics
 * @param {number} days - Number of days to include in stats
 */
async function getAuditStats(days = 30) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(CASE WHEN action = 'USER_LOGIN' THEN 1 ELSE 0 END) as login_count,
        SUM(CASE WHEN action LIKE 'CREATE_%' THEN 1 ELSE 0 END) as create_count,
        SUM(CASE WHEN action LIKE 'UPDATE_%' THEN 1 ELSE 0 END) as update_count,
        SUM(CASE WHEN action LIKE 'DELETE_%' THEN 1 ELSE 0 END) as delete_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `;

    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Get audit stats error:', error);
    throw error;
  }
}

/**
 * Get recent activity for a user
 * @param {number} userId - User ID
 * @param {number} limit - Number of records
 */
async function getUserActivity(userId, limit = 10) {
  try {
    const query = `
      SELECT 
        id,
        action,
        entity_type,
        entity_id,
        description,
        status,
        created_at
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Get user activity error:', error);
    throw error;
  }
}

/**
 * Get activity by entity
 * @param {string} entityType - Entity type (e.g., 'PRODUCT', 'ORDER')
 * @param {number} entityId - Entity ID
 */
async function getEntityActivity(entityType, entityId) {
  try {
    const query = `
      SELECT 
        id,
        user_id,
        user_email,
        action,
        description,
        changes,
        status,
        created_at
      FROM audit_logs
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [entityType, entityId]);
    
    // Parse changes JSON for each log
    result.rows.forEach(log => {
      if (log.changes && typeof log.changes === 'string') {
        try {
          log.changes = JSON.parse(log.changes);
        } catch (e) {
          console.error('Failed to parse changes JSON:', e);
        }
      }
    });

    return result.rows;
  } catch (error) {
    console.error('Get entity activity error:', error);
    throw error;
  }
}

module.exports = {
  logAudit,
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getUserActivity,
  getEntityActivity,
  AuditActions
};
