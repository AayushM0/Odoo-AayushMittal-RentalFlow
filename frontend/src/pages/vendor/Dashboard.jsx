import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

function VendorDashboard() {
  const { user } = useAuth();
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
      const response = await api.get('/vendors/dashboard');
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
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
  const pendingActions = dashboardData?.pending_actions || {};
  const activeRentals = dashboardData?.active_rentals || [];
  const inventoryStatus = dashboardData?.inventory_status || [];
  const recentOrders = dashboardData?.recent_orders || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Vendor Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{parseFloat(stats.total_revenue || 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{parseFloat(stats.monthly_revenue || 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.monthly_orders || 0} order(s)
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Rentals</h3>
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.active_rentals || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Currently rented out</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Outstanding</h3>
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{parseFloat(stats.outstanding_amount || 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pending payments</p>
          </div>
        </div>

        {(pendingActions.pending_pickups > 0 || 
          pendingActions.pending_returns > 0 || 
          pendingActions.pending_quotations > 0) && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-2">
                  Action Required
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {pendingActions.pending_pickups > 0 && (
                    <Link
                      to="/vendor/pickups"
                      className="block p-3 bg-white rounded border border-yellow-300 hover:shadow transition-shadow"
                    >
                      <p className="text-sm text-gray-600">Pending Pickups</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {pendingActions.pending_pickups}
                      </p>
                    </Link>
                  )}
                  {pendingActions.pending_returns > 0 && (
                    <Link
                      to="/vendor/returns"
                      className="block p-3 bg-white rounded border border-yellow-300 hover:shadow transition-shadow"
                    >
                      <p className="text-sm text-gray-600">Pending Returns</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {pendingActions.pending_returns}
                      </p>
                    </Link>
                  )}
                  {pendingActions.pending_quotations > 0 && (
                    <Link
                      to="/quotations"
                      className="block p-3 bg-white rounded border border-yellow-300 hover:shadow transition-shadow"
                    >
                      <p className="text-sm text-gray-600">Pending Quotations</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {pendingActions.pending_quotations}
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              to="/dashboard/create-product"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <Plus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Add Product</p>
            </Link>
            <Link
              to="/vendor/pickups"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Manage Pickups</p>
            </Link>
            <Link
              to="/vendor/returns"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Manage Returns</p>
            </Link>
            <Link
              to="/invoices"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Invoices</p>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Active Rentals</h2>
                <Link to="/orders" className="text-blue-600 hover:text-blue-700 text-sm">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {activeRentals.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No active rentals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRentals.slice(0, 5).map((rental) => (
                    <div
                      key={rental.id}
                      className="border rounded-lg p-4 hover:shadow transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{rental.product_name}</p>
                          <p className="text-sm text-gray-600">
                            Customer: {rental.customer_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Order #{rental.order_number}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {rental.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Return: {new Date(rental.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Inventory Status</h2>
                <Link to="/dashboard/my-products" className="text-blue-600 hover:text-blue-700 text-sm">
                  Manage
                </Link>
              </div>
            </div>
            <div className="p-6">
              {inventoryStatus.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No products yet</p>
                  <Link
                    to="/dashboard/create-product"
                    className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                  >
                    Add your first product
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventoryStatus.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center pb-3 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-600">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          item.available_stock < 5 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.available_stock}/{item.total_stock}
                        </p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mt-8">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <Link to="/orders" className="text-blue-600 hover:text-blue-700 text-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex justify-between items-center border rounded-lg p-4 hover:shadow transition-shadow"
                  >
                    <div>
                      <p className="font-medium">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        Customer: {order.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
