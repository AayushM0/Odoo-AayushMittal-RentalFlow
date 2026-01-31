const db = require('../config/database');

// In-memory cache for settings
let settingsCache = {};
let cacheInitialized = false;

/**
 * Load all settings into cache
 */
async function loadSettings() {
  try {
    const result = await db.query('SELECT * FROM system_settings');
    
    settingsCache = {};
    result.rows.forEach(setting => {
      settingsCache[setting.setting_key] = parseSettingValue(
        setting.setting_value,
        setting.data_type
      );
    });
    
    cacheInitialized = true;
    console.log(`✅ Loaded ${result.rows.length} settings into cache`);
    return { success: true };
  } catch (error) {
    console.error('Load settings error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Parse setting value based on data type
 */
function parseSettingValue(value, dataType) {
  if (value === null || value === undefined) return null;
  
  switch (dataType) {
    case 'NUMBER':
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    case 'BOOLEAN':
      return value === 'true' || value === '1' || value === true;
    case 'JSON':
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    default:
      return String(value);
  }
}

/**
 * Convert value to string for database storage
 */
function stringifySettingValue(value, dataType) {
  if (value === null || value === undefined) return '';
  
  switch (dataType) {
    case 'BOOLEAN':
      return value ? 'true' : 'false';
    case 'JSON':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

/**
 * Get a setting value from cache
 */
function getSetting(key, defaultValue = null) {
  if (!cacheInitialized) {
    console.warn('Settings cache not initialized');
    return defaultValue;
  }
  return settingsCache[key] !== undefined ? settingsCache[key] : defaultValue;
}

/**
 * Get all settings by category
 */
async function getSettingsByCategory(category) {
  try {
    const result = await db.query(
      'SELECT * FROM system_settings WHERE category = $1 ORDER BY setting_key',
      [category]
    );
    
    return result.rows.map(s => ({
      ...s,
      setting_value: parseSettingValue(s.setting_value, s.data_type)
    }));
  } catch (error) {
    console.error('Get settings by category error:', error);
    throw error;
  }
}

/**
 * Get all public settings (for frontend)
 */
async function getPublicSettings() {
  try {
    const result = await db.query(
      'SELECT setting_key, setting_value, data_type FROM system_settings WHERE is_public = TRUE'
    );
    
    const publicSettings = {};
    result.rows.forEach(s => {
      publicSettings[s.setting_key] = parseSettingValue(s.setting_value, s.data_type);
    });
    
    return publicSettings;
  } catch (error) {
    console.error('Get public settings error:', error);
    throw error;
  }
}

/**
 * Get all settings grouped by category (admin only)
 */
async function getAllSettings() {
  try {
    const result = await db.query(
      'SELECT * FROM system_settings ORDER BY category, setting_key'
    );
    
    // Group by category
    const grouped = {};
    result.rows.forEach(s => {
      if (!grouped[s.category]) {
        grouped[s.category] = [];
      }
      grouped[s.category].push({
        ...s,
        setting_value: parseSettingValue(s.setting_value, s.data_type)
      });
    });
    
    return grouped;
  } catch (error) {
    console.error('Get all settings error:', error);
    throw error;
  }
}

/**
 * Get all categories
 */
async function getCategories() {
  try {
    const result = await db.query(
      'SELECT DISTINCT category FROM system_settings ORDER BY category'
    );
    return result.rows.map(r => r.category);
  } catch (error) {
    console.error('Get categories error:', error);
    throw error;
  }
}

/**
 * Update a single setting
 */
async function updateSetting(key, value) {
  try {
    // Get current setting to check data type
    const result = await db.query(
      'SELECT data_type FROM system_settings WHERE setting_key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Setting '${key}' not found`);
    }
    
    const dataType = result.rows[0].data_type;
    
    // Validate value based on data type
    if (dataType === 'NUMBER' && isNaN(parseFloat(value))) {
      throw new Error(`Invalid number value for setting '${key}'`);
    }
    
    // Convert value to string for storage
    const stringValue = stringifySettingValue(value, dataType);
    
    await db.query(
      'UPDATE system_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
      [stringValue, key]
    );
    
    // Update cache
    settingsCache[key] = parseSettingValue(stringValue, dataType);
    
    console.log(`✅ Updated setting: ${key} = ${stringValue}`);
    return { success: true };
  } catch (error) {
    console.error('Update setting error:', error);
    throw error;
  }
}

/**
 * Update multiple settings at once
 */
async function updateSettings(updates) {
  const errors = [];
  const succeeded = [];
  
  try {
    for (const [key, value] of Object.entries(updates)) {
      try {
        await updateSetting(key, value);
        succeeded.push(key);
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }
    
    if (errors.length > 0) {
      console.warn(`Updated ${succeeded.length} settings with ${errors.length} errors`);
    }
    
    return { 
      success: errors.length === 0,
      updated: succeeded.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Update settings error:', error);
    throw error;
  }
}

/**
 * Create a new setting
 */
async function createSetting(key, value, category, dataType = 'STRING', description = '', isPublic = false) {
  try {
    const stringValue = stringifySettingValue(value, dataType);
    
    const result = await db.query(
      `INSERT INTO system_settings (setting_key, setting_value, category, data_type, description, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [key, stringValue, category, dataType, description, isPublic]
    );
    
    // Update cache
    settingsCache[key] = parseSettingValue(stringValue, dataType);
    
    console.log(`✅ Created setting: ${key}`);
    return { success: true, setting: result.rows[0] };
  } catch (error) {
    console.error('Create setting error:', error);
    throw error;
  }
}

/**
 * Delete a setting
 */
async function deleteSetting(key) {
  try {
    await db.query('DELETE FROM system_settings WHERE setting_key = $1', [key]);
    
    // Remove from cache
    delete settingsCache[key];
    
    console.log(`✅ Deleted setting: ${key}`);
    return { success: true };
  } catch (error) {
    console.error('Delete setting error:', error);
    throw error;
  }
}

/**
 * Reload settings from database
 */
async function reloadSettings() {
  console.log('Reloading settings from database...');
  return await loadSettings();
}

// Auto-load settings on module initialization
loadSettings().catch(err => {
  console.error('Failed to load settings on startup:', err);
});

module.exports = {
  getSetting,
  getSettingsByCategory,
  getPublicSettings,
  getAllSettings,
  getCategories,
  updateSetting,
  updateSettings,
  createSetting,
  deleteSetting,
  loadSettings,
  reloadSettings
};
