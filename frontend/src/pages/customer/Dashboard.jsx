import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

function Dashboard() {
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
      const response = await api.get('/customers/dashboard');
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
  const activeRentals = dashboardData?.active_rentals || [];
  const recentOrders = dashboardData?.recent_orders || [];
  const pendingInvoices = dashboardData?.pending_invoices || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your rentals
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_orders || 0}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Rentals</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.active_rentals || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Currently rented</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{parseFloat(stats.total_spent || 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pending Payments</h3>
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{parseFloat(stats.pending_amount || 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pending_invoices || 0} invoice(s)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              to="/products"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Browse Products</p>
            </Link>
            <Link
              to="/cart"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">View Cart</p>
            </Link>
            <Link
              to="/quotations"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Quotations</p>
            </Link>
            <Link
              to="/invoices"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
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
                  {activeRentals.slice(0, 3).map((rental) => (
                    <div
                      key={rental.id}
                      className="border rounded-lg p-4 hover:shadow transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{rental.product_name}</p>
                          <p className="text-sm text-gray-600">Order #{rental.order_number}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {rental.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Return by: {new Date(rental.end_date).toLocaleDateString()}
                        </span>
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
                  <p className="text-gray-500">No recent orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="border rounded-lg p-4 hover:shadow transition-shadow block"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Order #{order.order_number}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
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
                      <p className="text-sm font-medium text-gray-900">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {pendingInvoices.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Pending Invoices</h2>
                <Link to="/invoices" className="text-blue-600 hover:text-blue-700 text-sm">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pendingInvoices.slice(0, 3).map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/invoices/${invoice.id}`}
                    className="border-2 border-red-200 bg-red-50 rounded-lg p-4 hover:shadow transition-shadow block"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      ₹{parseFloat(invoice.amount_due).toFixed(2)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
