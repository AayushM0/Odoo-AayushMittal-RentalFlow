import api from '../services/api';

// Cache for public settings
let publicSettings = {};
let settingsLoaded = false;

/**
 * Load public settings from the server
 */
export async function loadPublicSettings() {
  try {
    const response = await api.get('/settings/public');
    publicSettings = response.data.settings;
    settingsLoaded = true;
    console.log('✅ Public settings loaded:', Object.keys(publicSettings).length, 'settings');
    return publicSettings;
  } catch (error) {
    console.error('Load public settings error:', error);
    return {};
  }
}

/**
 * Get a setting value by key
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if setting not found
 * @returns {*} Setting value or default value
 */
export function getSetting(key, defaultValue = null) {
  if (!settingsLoaded) {
    console.warn('Settings not loaded yet. Call loadPublicSettings() first.');
  }
  return publicSettings[key] !== undefined ? publicSettings[key] : defaultValue;
}

/**
 * Get all public settings
 * @returns {Object} All public settings
 */
export function getAllSettings() {
  return { ...publicSettings };
}

/**
 * Check if settings are loaded
 * @returns {boolean}
 */
export function areSettingsLoaded() {
  return settingsLoaded;
}

/**
 * Reload public settings from server
 */
export async function reloadPublicSettings() {
  console.log('Reloading public settings...');
  return await loadPublicSettings();
}

// Commonly used settings helpers
export const getAppName = () => getSetting('app_name', 'Rental ERP');
export const getAppDescription = () => getSetting('app_description', 'Equipment Rental Management System');
export const getCurrency = () => getSetting('currency', 'INR');
export const getCurrencySymbol = () => getSetting('currency_symbol', '₹');
export const getContactEmail = () => getSetting('contact_email', '');
export const getContactPhone = () => getSetting('contact_phone', '');
export const getMinRentalDays = () => getSetting('min_rental_days', 1);
export const getMaxRentalDays = () => getSetting('max_rental_days', 365);
export const getLateFeePercentage = () => getSetting('late_fee_percentage', 10);
export const getSecurityDepositPercentage = () => getSetting('security_deposit_percentage', 20);
export const isCODEnabled = () => getSetting('cod_enabled', true);
export const isRazorpayEnabled = () => getSetting('razorpay_enabled', false);

// Export default for convenience
export default {
  loadPublicSettings,
  reloadPublicSettings,
  getSetting,
  getAllSettings,
  areSettingsLoaded,
  // Helpers
  getAppName,
  getAppDescription,
  getCurrency,
  getCurrencySymbol,
  getContactEmail,
  getContactPhone,
  getMinRentalDays,
  getMaxRentalDays,
  getLateFeePercentage,
  getSecurityDepositPercentage,
  isCODEnabled,
  isRazorpayEnabled
};
