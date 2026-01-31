const settingsService = require('../services/settings.service');

/**
 * Get public settings (no authentication required)
 */
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await settingsService.getPublicSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public settings'
    });
  }
};

/**
 * Get all settings grouped by category (admin only)
 */
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

/**
 * Get settings by category (admin only)
 */
exports.getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    const settings = await settingsService.getSettingsByCategory(category.toUpperCase());
    res.json({
      success: true,
      category: category.toUpperCase(),
      settings
    });
  } catch (error) {
    console.error('Get settings by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

/**
 * Get all categories (admin only)
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await settingsService.getCategories();
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Update multiple settings (admin only)
 */
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data. Expected an object with key-value pairs.'
      });
    }
    
    if (Object.keys(settings).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No settings provided'
      });
    }
    
    const result = await settingsService.updateSettings(settings);
    
    if (result.errors && result.errors.length > 0) {
      return res.status(207).json({
        success: false,
        message: `Updated ${result.updated} settings with ${result.errors.length} errors`,
        updated: result.updated,
        errors: result.errors
      });
    }
    
    res.json({
      success: true,
      message: `Successfully updated ${result.updated} settings`,
      updated: result.updated
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

/**
 * Update a single setting (admin only)
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Setting key is required'
      });
    }
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }
    
    await settingsService.updateSetting(key, value);
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      key,
      value
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to update setting'
    });
  }
};

/**
 * Create a new setting (admin only)
 */
exports.createSetting = async (req, res) => {
  try {
    const { key, value, category, dataType, description, isPublic } = req.body;
    
    if (!key || !category) {
      return res.status(400).json({
        success: false,
        message: 'Key and category are required'
      });
    }
    
    const result = await settingsService.createSetting(
      key,
      value,
      category.toUpperCase(),
      dataType || 'STRING',
      description || '',
      isPublic || false
    );
    
    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      setting: result.setting
    });
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(error.message.includes('duplicate') ? 409 : 500).json({
      success: false,
      message: error.message || 'Failed to create setting'
    });
  }
};

/**
 * Delete a setting (admin only)
 */
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Setting key is required'
      });
    }
    
    await settingsService.deleteSetting(key);
    
    res.json({
      success: true,
      message: 'Setting deleted successfully',
      key
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting'
    });
  }
};

/**
 * Reload settings from database (admin only)
 */
exports.reloadSettings = async (req, res) => {
  try {
    const result = await settingsService.reloadSettings();
    
    res.json({
      success: true,
      message: 'Settings reloaded successfully'
    });
  } catch (error) {
    console.error('Reload settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reload settings'
    });
  }
};
