import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import api from '../../services/api'

function RecordReturnModal({ reservation, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    condition_notes: '',
    actual_return_date: new Date().toISOString().split('T')[0]
  })
  const [lateFee, setLateFee] = useState(null)
  const [loadingFee, setLoadingFee] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    calculateLateFee()
  }, [formData.actual_return_date])

  const calculateLateFee = async () => {
    setLoadingFee(true)
    try {
      const response = await api.post('/returns/calculate-late-fee', {
        endDate: reservation.expected_return_date,
        returnDate: formData.actual_return_date,
        basePrice: reservation.base_price || 1000
      })
      setLateFee(response.data.data)
    } catch (err) {
      console.error('Failed to calculate late fee:', err)
    } finally {
      setLoadingFee(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await api.post('/returns', {
        orderId: reservation.order_id,
        reservationId: reservation.reservation_id,
        pickupId: reservation.pickup_id,
        conditionNotes: formData.condition_notes
      })
      
      alert('Return recorded successfully!')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record return')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Record Return</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600 mb-1">Order #{reservation.order_number}</p>
          <p className="font-medium">{reservation.product_name}</p>
          <p className="text-sm text-gray-600">Quantity: {reservation.quantity}</p>
          <p className="text-sm text-gray-600">
            Expected: {new Date(reservation.expected_return_date).toLocaleDateString()}
          </p>
        </div>

        {reservation.is_overdue && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Overdue Return</p>
              <p className="text-yellow-700">
                This item is {reservation.days_overdue} day(s) overdue
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Actual Return Date
            </label>
            <input
              type="date"
              value={formData.actual_return_date}
              onChange={(e) =>
                setFormData({ ...formData, actual_return_date: e.target.value })
              }
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {lateFee && lateFee.isLate && lateFee.lateFee > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800 mb-1">Late Fee Applied</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{parseFloat(lateFee.lateFee).toFixed(2)}
              </p>
              <p className="text-xs text-red-700 mt-1">
                {lateFee.daysLate} day(s) late × 20% daily rate
              </p>
            </div>
          )}

          {loadingFee && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-600 text-sm rounded">
              Calculating late fee...
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Condition Notes
            </label>
            <textarea
              value={formData.condition_notes}
              onChange={(e) =>
                setFormData({ ...formData, condition_notes: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Record the condition of items at return..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Document any damage or issues at the time of return
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecordReturnModal
