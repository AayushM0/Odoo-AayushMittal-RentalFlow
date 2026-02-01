import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Package, Calendar, MapPin, User, 
  CreditCard, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PICKED_UP: 'bg-purple-100 text-purple-800 border-purple-200',
  RETURNED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
}

const STATUS_ICONS = {
  PENDING: AlertCircle,
  CONFIRMED: CheckCircle,
  PICKED_UP: Package,
  RETURNED: CheckCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle
}

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  }, [id])

  const fetchOrderDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching order details for ID:', id);
      const response = await api.get(`/orders/${id}`)
      console.log('Order response:', response.data);
      setOrder(response.data.data)
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    setCancelling(true)
    try {
      await api.put(`/orders/${id}/cancel`)
      alert('Order cancelled successfully')
      fetchOrderDetails()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleContinuePayment = async () => {
    setProcessing(true)
    
    try {
      await api.post(`/orders/${id}/mark-payment-complete`, {
        method: 'Manual',
        paymentId: `PAY-${Date.now()}`
      })
      alert('Payment marked as completed!')
      fetchOrderDetails()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment as complete')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <XCircle className="w-20 h-20 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Order Not Found</h2>
        <p className="text-gray-500 mb-8">{error}</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Orders
        </button>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[order.status] || AlertCircle
  
  // Safe parsing of order items
  let orderItems = []
  try {
    orderItems = typeof order.items === 'string' 
      ? JSON.parse(order.items || '[]')
      : (order.items || [])
  } catch (e) {
    console.error('Failed to parse order items:', e)
    orderItems = []
  }

  console.log('Rendering OrderDetail, order:', order, 'items:', orderItems)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>

        <div className={`rounded-lg border-2 p-6 mb-6 ${STATUS_COLORS[order.status]}`}>
          <div className="flex items-center gap-4">
            <StatusIcon className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
              <p className="text-sm">
                Status: <strong>{order.status.replace('_', ' ')}</strong>
              </p>
              <p className="text-xs mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product_name || `Product ${item.variant_id}`}</h3>
                      <p className="text-sm text-gray-600">
                        Variant ID: {item.variant_id} | Qty: {item.quantity}
                      </p>
                      {item.duration && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {item.duration} {item.unit}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{parseFloat(item.line_total).toFixed(2)}</p>
                      <p className="text-xs text-gray-600">
                        ₹{parseFloat(item.price_per_unit).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Billing Address
                </h3>
                {order.billing_address ? (
                  <div className="text-sm text-gray-700">
                    <p>{order.billing_address.street}</p>
                    <p>
                      {order.billing_address.city}, {order.billing_address.state}
                    </p>
                    <p>{order.billing_address.pincode}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No billing address</p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h3>
                {order.shipping_address ? (
                  <div className="text-sm text-gray-700">
                    <p>{order.shipping_address.street}</p>
                    <p>
                      {order.shipping_address.city}, {order.shipping_address.state}
                    </p>
                    <p>{order.shipping_address.pincode}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No shipping address</p>
                )}
              </div>
            </div>

            {order.customer_notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold mb-3">Customer Notes</h3>
                <p className="text-sm text-gray-700">{order.customer_notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{parseFloat(order.subtotal || order.total_amount).toFixed(2)}</span>
                </div>
                {order.tax_amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span>₹{parseFloat(order.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-base">
                  <span>Total:</span>
                  <span className="text-blue-600">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">
                    {order.payment_status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span>{order.payment_method || 'N/A'}</span>
                </div>
              </div>
            </div>

            {user?.role === 'CUSTOMER' && order.status === 'PENDING' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold mb-4">Actions</h3>
                <div className="space-y-3">
                  {(!order.payment_status || order.payment_status === 'Pending') && (
                    <>
                      <button
                        onClick={handleContinuePayment}
                        disabled={processing}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            Continue Payment
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500">
                        Complete your payment to confirm this order
                      </p>
                    </>
                  )}
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling || processing}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                  <p className="text-xs text-gray-500">
                    You can only cancel orders before they are confirmed
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
