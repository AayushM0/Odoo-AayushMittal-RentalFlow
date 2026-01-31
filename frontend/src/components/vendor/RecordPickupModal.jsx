import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../../services/api'

function RecordPickupModal({ reservation, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    condition_notes: '',
    actual_pickup_date: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await api.post('/pickups', {
        reservation_id: reservation.reservation_id,
        condition_notes: formData.condition_notes,
        actual_pickup_date: formData.actual_pickup_date
      })
      
      alert('Pickup recorded successfully!')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record pickup')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Record Pickup</h2>
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
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Actual Pickup Date
            </label>
            <input
              type="date"
              value={formData.actual_pickup_date}
              onChange={(e) =>
                setFormData({ ...formData, actual_pickup_date: e.target.value })
              }
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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
              placeholder="Record the condition of items at pickup..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Document any damage or issues at the time of pickup
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
              {submitting ? 'Recording...' : 'Record Pickup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecordPickupModal
