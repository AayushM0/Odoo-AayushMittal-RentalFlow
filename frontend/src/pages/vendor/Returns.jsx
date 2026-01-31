import { useState, useEffect } from 'react'
import { Calendar, Package, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import RecordReturnModal from '../../components/vendor/RecordReturnModal'

function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPendingReturns()
  }, [])

  const fetchPendingReturns = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/returns/pending')
      setReturns(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending returns')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordClick = (reservation) => {
    setSelectedReservation(reservation)
    setShowModal(true)
  }

  const handleReturnRecorded = () => {
    setShowModal(false)
    setSelectedReservation(null)
    fetchPendingReturns()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading pending returns...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pending Returns</h1>
        <button
          onClick={fetchPendingReturns}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 mb-6">
          {error}
        </div>
      )}

      {returns.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">No Pending Returns</h2>
          <p className="text-gray-500">All items have been returned</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map(ret => (
            <div
              key={ret.reservation_id}
              className={`bg-white border-2 rounded-lg p-6 ${
                ret.is_overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold">
                      Order #{ret.order_number}
                    </h3>
                    {ret.is_overdue && (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Reservation ID: {ret.reservation_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Customer: {ret.customer_name}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Product</p>
                  <p className="font-medium">{ret.product_name}</p>
                  <p className="text-sm text-gray-600">SKU: {ret.variant_sku}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="font-medium">{ret.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expected Return</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className={`font-medium ${ret.is_overdue ? 'text-red-600' : ''}`}>
                      {new Date(ret.expected_return_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {ret.is_overdue && (
                  <div>
                    <p className="text-xs text-gray-500">Days Overdue</p>
                    <p className="font-bold text-red-600">{ret.days_overdue}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleRecordClick(ret)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Record Return
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedReservation && (
        <RecordReturnModal
          reservation={selectedReservation}
          onSuccess={handleReturnRecorded}
          onClose={() => {
            setShowModal(false)
            setSelectedReservation(null)
          }}
        />
      )}
    </div>
  )
}

export default Returns
