import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

function SystemSettings() {
  const [settings, setSettings] = useState({});
  const [activeCategory, setActiveCategory] = useState('GENERAL');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = [
    { key: 'GENERAL', label: 'General', icon: '⚙️', description: 'Basic app settings' },
    { key: 'EMAIL', label: 'Email', icon: '📧', description: 'SMTP configuration' },
    { key: 'PAYMENT', label: 'Payment', icon: '💳', description: 'Payment gateway settings' },
    { key: 'RENTAL', label: 'Rental', icon: '🏠', description: 'Rental policies' },
    { key: 'NOTIFICATION', label: 'Notifications', icon: '🔔', description: 'Notification preferences' },
    { key: 'BUSINESS', label: 'Business', icon: '🏢', description: 'Business information' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Fetch settings error:', error);
      showMessage('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleChange = (key, value, dataType) => {
    const categorySettings = [...(settings[activeCategory] || [])];
    const settingIndex = categorySettings.findIndex(s => s.setting_key === key);
    
    if (settingIndex !== -1) {
      let processedValue = value;
      
      // Process value based on data type
      if (dataType === 'NUMBER') {
        processedValue = value === '' ? '' : parseFloat(value);
      } else if (dataType === 'BOOLEAN') {
        processedValue = value;
      }
      
      categorySettings[settingIndex] = {
        ...categorySettings[settingIndex],
        setting_value: processedValue
      };
      
      setSettings({
        ...settings,
        [activeCategory]: categorySettings
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Flatten all settings into a single object
      const updates = {};
      Object.values(settings).flat().forEach(setting => {
        updates[setting.setting_key] = setting.setting_value;
      });

      const response = await api.put('/settings', { settings: updates });
      
      if (response.data.success) {
        showMessage(`Successfully updated ${response.data.updated} settings`, 'success');
      } else {
        showMessage('Some settings failed to update', 'warning');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      showMessage('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reload settings from the database? Any unsaved changes will be lost.')) {
      fetchSettings();
      showMessage('Settings reloaded from database', 'success');
    }
  };

  const renderSettingInput = (setting) => {
    const { setting_key, setting_value, data_type, description } = setting;

    switch (data_type) {
      case 'BOOLEAN':
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={setting_value === true || setting_value === 'true'}
                  onChange={(e) => handleChange(setting_key, e.target.checked, data_type)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="text-sm text-gray-700">
                {setting_value ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        );

      case 'NUMBER':
        return (
          <div className="space-y-1">
            <input
              type="number"
              value={setting_value === null || setting_value === undefined ? '' : setting_value}
              onChange={(e) => handleChange(setting_key, e.target.value, data_type)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter number"
            />
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-1">
            <input
              type="text"
              value={setting_value === null || setting_value === undefined ? '' : setting_value}
              onChange={(e) => handleChange(setting_key, e.target.value, data_type)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter value"
            />
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        );
    }
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDataTypeBadge = (dataType) => {
    const colors = {
      STRING: 'bg-blue-100 text-blue-800',
      NUMBER: 'bg-green-100 text-green-800',
      BOOLEAN: 'bg-purple-100 text-purple-800',
      JSON: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[dataType] || 'bg-gray-100 text-gray-800'}`}>
        {dataType}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              </div>
              <p className="text-gray-600">Configure application settings and behavior</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={loading || saving}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 flex items-center gap-2 transition-colors"
                title="Reload from database"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors shadow-md"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Message Banner */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-yellow-50 border border-yellow-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={
                message.type === 'success' ? 'text-green-800' :
                message.type === 'error' ? 'text-red-800' :
                'text-yellow-800'
              }>
                {message.text}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Categories</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeCategory === cat.key
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    title={cat.description}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{cat.label}</div>
                        {activeCategory !== cat.key && (
                          <div className="text-xs opacity-75">{cat.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
              ) : settings[activeCategory] && settings[activeCategory].length > 0 ? (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {categories.find(c => c.key === activeCategory)?.label} Settings
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {categories.find(c => c.key === activeCategory)?.description}
                    </p>
                  </div>

                  {settings[activeCategory].map((setting) => (
                    <div key={setting.setting_key} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-3">
                        <label className="block">
                          <span className="font-semibold text-gray-900 text-lg">
                            {formatLabel(setting.setting_key)}
                          </span>
                          {setting.is_public && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Public
                            </span>
                          )}
                        </label>
                        {getDataTypeBadge(setting.data_type)}
                      </div>
                      {renderSettingInput(setting)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-500">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No settings available in this category</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;
