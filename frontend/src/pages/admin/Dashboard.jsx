import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  Shield,
  Database,
  UserPlus,
  Settings
} from 'lucide-react';
import api from '../../services/api';

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = dashboardData?.statistics || {};
  const userStats = dashboardData?.user_statistics || {};
  const recentActivity = dashboardData?.recent_activity || [];
  const systemHealth = dashboardData?.system_health || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Platform overview and management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Administrator</span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.total_users || 0}
            </p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">+{stats.new_users_this_month || 0}</span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.total_orders || 0}
            </p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">+{stats.orders_this_month || 0}</span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Platform Revenue</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{parseFloat(stats.total_revenue || 0).toFixed(0)}
            </p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">
                +₹{parseFloat(stats.revenue_this_month || 0).toFixed(0)}
              </span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Rentals</h3>
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.active_rentals || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Currently in use</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">User Distribution</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-900">
                {userStats.customers || 0}
              </p>
              <p className="text-sm text-gray-600">Customers</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900">
                {userStats.vendors || 0}
              </p>
              <p className="text-sm text-gray-600">Vendors</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Activity className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-900">
                {userStats.active_today || 0}
              </p>
              <p className="text-sm text-gray-600">Active Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              to="/products"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">View Products</p>
            </Link>
            <Link
              to="/orders"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">View Orders</p>
            </Link>
            <Link
              to="/invoices"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">View Invoices</p>
            </Link>
            <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-center opacity-50 cursor-not-allowed">
              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="font-medium text-gray-600">Settings</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'order' ? 'bg-blue-600' :
                        activity.type === 'user' ? 'bg-green-600' :
                        activity.type === 'payment' ? 'bg-purple-600' :
                        'bg-gray-600'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">System Health</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Database</p>
                      <p className="text-xs text-green-700">Operational</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">API Server</p>
                      <p className="text-xs text-green-700">
                        Uptime: {systemHealth.api_uptime || '99.9'}%
                      </p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Storage</p>
                      <p className="text-xs text-blue-700">
                        {systemHealth.storage_used || 45}% used
                      </p>
                    </div>
                  </div>
                  <div className="text-blue-600 text-sm font-medium">
                    {systemHealth.storage_used || 45}%
                  </div>
                </div>

                {systemHealth.pending_issues > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">Pending Issues</p>
                        <p className="text-xs text-yellow-700">Requires attention</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                      {systemHealth.pending_issues}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Revenue Overview</h2>
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Revenue chart will be displayed here</p>
            <p className="text-sm text-gray-400 mt-2">
              Implement with Chart.js or Recharts in TODO 8.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
