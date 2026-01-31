import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Calendar, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-purple-100 text-purple-800',
  RETURNED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = filter !== 'ALL' ? { status: filter } : {}
      const response = await api.get('/orders', { params })
      setOrders(response.data.data.orders || response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getOrderItemsCount = (order) => {
    try {
      const items = JSON.parse(order.items || '[]')
      return items.reduce((sum, item) => sum + item.quantity, 0)
    } catch {
      return 0
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {user.role === 'CUSTOMER' ? 'My Orders' : 'Vendor Orders'}
        </h1>
        <Link
          to="/products"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'COMPLETED', 'CANCELLED'].map(
          status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 mb-6">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">No orders found</h2>
          <p className="text-gray-500 mb-8">
            {filter === 'ALL'
              ? 'You haven\'t placed any orders yet'
              : `No orders with status "${filter}"`}
          </p>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All Orders
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[order.status]
                  }`}
                >
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Items</p>
                  <p className="text-lg font-medium">{getOrderItemsCount(order)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className="text-lg font-medium">
                    {order.payment_status || 'Pending'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Link
                  to={`/orders/${order.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
