import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Package, ShoppingCart, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { getVendorStats, getCustomerStats, getRecentOrders } from '../services/dashboard'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Redirect to role-specific dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true })
        return
      }
      if (user.role === 'VENDOR') {
        navigate('/vendor/dashboard', { replace: true })
        return
      }
      if (user.role === 'CUSTOMER') {
        navigate('/customer/dashboard', { replace: true })
        return
      }
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const statsData = user?.role === 'VENDOR' 
          ? await getVendorStats() 
          : await getCustomerStats()
        
        setStats(statsData)

        const ordersData = await getRecentOrders(5)
        setRecentOrders(ordersData)
      } catch (err) {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatsConfig = () => {
    if (user?.role === 'VENDOR') {
      return [
        { icon: Package, label: 'My Products', value: stats?.productCount || 0, color: 'bg-blue-500' },
        { icon: ShoppingCart, label: 'Total Orders', value: stats?.orderCount || 0, color: 'bg-green-500' },
        { icon: FileText, label: 'Invoices', value: stats?.invoiceCount || 0, color: 'bg-purple-500' },
        { icon: TrendingUp, label: 'Revenue', value: formatCurrency(stats?.revenue || 0), color: 'bg-orange-500' },
      ]
    } else {
      return [
        { icon: Package, label: 'Available Products', value: stats?.availableProducts || 0, color: 'bg-blue-500' },
        { icon: ShoppingCart, label: 'My Orders', value: stats?.myOrders || 0, color: 'bg-green-500' },
        { icon: Clock, label: 'Pending', value: stats?.pending || 0, color: 'bg-yellow-500' },
        { icon: CheckCircle, label: 'Completed', value: stats?.completed || 0, color: 'bg-green-600' },
      ]
    }
  }

  const statsConfig = stats ? getStatsConfig() : []

  const vendorActions = [
    { label: 'Add New Product', color: 'bg-blue-50 hover:bg-blue-100', onClick: () => navigate('/dashboard/create-product') },
    { label: 'View Orders', color: 'bg-green-50 hover:bg-green-100', onClick: () => navigate('/dashboard/orders') },
    { label: 'Generate Invoice', color: 'bg-purple-50 hover:bg-purple-100', onClick: () => navigate('/dashboard/orders') },
  ]

  const customerActions = [
    { label: 'Browse Products', color: 'bg-blue-50 hover:bg-blue-100', onClick: () => navigate('/dashboard/products') },
    { label: 'View My Orders', color: 'bg-green-50 hover:bg-green-100', onClick: () => navigate('/dashboard/orders') },
    { label: 'Track Delivery', color: 'bg-purple-50 hover:bg-purple-100', onClick: () => navigate('/dashboard/orders') },
  ]

  const quickActions = user?.role === 'VENDOR' ? vendorActions : customerActions

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'VENDOR' ? 'Vendor Dashboard' : 'Customer Dashboard'}
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.name}! 
          <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
            {user?.role}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {user?.role === 'VENDOR' ? 'Recent Orders' : 'My Recent Orders'}
          </h2>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button 
                key={action.label}
                onClick={action.onClick}
                className={`w-full text-left px-4 py-2 ${action.color} rounded-lg transition`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
