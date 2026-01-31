const auditService = require('../services/audit.service');

/**
 * Get audit logs with filters
 * @route GET /api/audit
 * @access Admin only
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const filters = {
      userId: req.query.user_id,
      action: req.query.action,
      entityType: req.query.entity_type,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      status: req.query.status,
      page: req.query.page || 1,
      limit: req.query.limit || 50
    };

    const result = await auditService.getAuditLogs(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

/**
 * Get audit log by ID
 * @route GET /api/audit/:id
 * @access Admin only
 */
exports.getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await auditService.getAuditLogById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
};

/**
 * Get audit statistics
 * @route GET /api/audit/stats
 * @access Admin only
 */
exports.getAuditStats = async (req, res) => {
  try {
    const days = req.query.days || 30;
    const stats = await auditService.getAuditStats(days);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Get user activity history
 * @route GET /api/audit/user/:userId
 * @access Admin only
 */
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 10;
    
    const activity = await auditService.getUserActivity(userId, limit);

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
};

/**
 * Get entity activity history
 * @route GET /api/audit/entity/:entityType/:entityId
 * @access Admin only
 */
exports.getEntityActivity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const activity = await auditService.getEntityActivity(entityType, entityId);

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Get entity activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entity activity',
      error: error.message
    });
  }
};

/**
 * Export audit logs to CSV
 * @route GET /api/audit/export
 * @access Admin only
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const filters = {
      userId: req.query.user_id,
      action: req.query.action,
      entityType: req.query.entity_type,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      status: req.query.status,
      page: 1,
      limit: 10000 // Large limit for export
    };

    const result = await auditService.getAuditLogs(filters);

    // Convert to CSV
    const headers = [
      'ID',
      'Timestamp',
      'User Email',
      'User ID',
      'Action',
      'Entity Type',
      'Entity ID',
      'Description',
      'IP Address',
      'Request Method',
      'Request Path',
      'Status'
    ];

    const rows = result.logs.map(log => [
      log.id,
      new Date(log.created_at).toISOString(),
      log.user_email || '',
      log.user_id || '',
      log.action,
      log.entity_type || '',
      log.entity_id || '',
      log.description || '',
      log.ip_address || '',
      log.request_method || '',
      log.request_path || '',
      log.status
    ]);

    // Escape CSV fields (handle commas, quotes, newlines)
    const escapeCsvField = (field) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit_logs_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    // Log the export action
    await auditService.logAudit({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: auditService.AuditActions.DATA_EXPORT,
      description: 'Exported audit logs to CSV',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS'
    });

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
};

/**
 * Get available actions for filtering
 * @route GET /api/audit/actions
 * @access Admin only
 */
exports.getAvailableActions = async (req, res) => {
  try {
    const actions = Object.values(auditService.AuditActions);
    
    res.json({
      success: true,
      actions
    });
  } catch (error) {
    console.error('Get available actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available actions',
      error: error.message
    });
  }
};
