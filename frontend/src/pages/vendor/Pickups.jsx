import { useState, useEffect } from 'react'
import { Calendar, Package, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import RecordPickupModal from '../../components/vendor/RecordPickupModal'

function Pickups() {
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPendingPickups()
  }, [])

  const fetchPendingPickups = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/pickups/pending')
      setPickups(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending pickups')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordClick = (reservation) => {
    setSelectedReservation(reservation)
    setShowModal(true)
  }

  const handlePickupRecorded = () => {
    setShowModal(false)
    setSelectedReservation(null)
    fetchPendingPickups()
  }

  const isOverdue = (pickupDate) => {
    return new Date(pickupDate) < new Date()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading pending pickups...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pending Pickups</h1>
        <button
          onClick={fetchPendingPickups}
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

      {pickups.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">No Pending Pickups</h2>
          <p className="text-gray-500">All orders have been picked up</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pickups.map(pickup => {
            const overdue = isOverdue(pickup.pickup_date)
            
            return (
              <div
                key={pickup.reservation_id}
                className={`bg-white border-2 rounded-lg p-6 ${
                  overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">
                        Order #{pickup.order_number}
                      </h3>
                      {overdue && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Reservation ID: {pickup.reservation_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Customer: {pickup.customer_name}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="font-medium">{pickup.product_name}</p>
                    <p className="text-sm text-gray-600">SKU: {pickup.variant_sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-medium">{pickup.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Scheduled Pickup</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
                        {new Date(pickup.pickup_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleRecordClick(pickup)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Record Pickup
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && selectedReservation && (
        <RecordPickupModal
          reservation={selectedReservation}
          onSuccess={handlePickupRecorded}
          onClose={() => {
            setShowModal(false)
            setSelectedReservation(null)
          }}
        />
      )}
    </div>
  )
}

export default Pickups
