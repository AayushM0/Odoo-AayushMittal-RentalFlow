import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Package } from 'lucide-react';
import api from '../services/api';

function QuotationRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Pre-filled product from navigation state (optional)
  const prefilledProduct = location.state?.product;
  const prefilledVariant = location.state?.variant;

  const [formData, setFormData] = useState({
    vendorId: prefilledProduct?.vendor_id || '',
    items: prefilledProduct ? [{
      product_id: prefilledProduct?.id || '',
      variant_id: prefilledVariant?.id || '',
      quantity: 1,
      start_date: '',
      end_date: ''
    }] : [{
      product_id: '',
      variant_id: '',
      quantity: 1,
      start_date: '',
      end_date: ''
    }],
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        product_id: '',
        variant_id: '',
        quantity: 1,
        start_date: '',
        end_date: ''
      }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation
    if (!formData.vendorId) {
      setError('Please select a vendor');
      setSubmitting(false);
      return;
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      setSubmitting(false);
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product_id || !item.variant_id || !item.start_date || !item.end_date || item.quantity < 1) {
        setError(`Item ${i + 1}: All fields are required`);
        setSubmitting(false);
        return;
      }

      if (new Date(item.start_date) >= new Date(item.end_date)) {
        setError(`Item ${i + 1}: End date must be after start date`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await api.post('/quotations', {
        vendorId: parseInt(formData.vendorId),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          variant_id: parseInt(item.variant_id),
          quantity: parseInt(item.quantity),
          start_date: item.start_date,
          end_date: item.end_date
        })),
        notes: formData.notes
      });

      alert('Quotation request submitted successfully!');
      navigate('/quotations');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quotation request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Request Quotation</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Vendor Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Vendor ID <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.vendorId}
            onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            disabled={!!prefilledProduct}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter vendor ID"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can find vendor ID on the product detail page
          </p>
        </div>

        {/* Items */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 text-sm hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Product ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Variant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.variant_id}
                      onChange={(e) => handleItemChange(index, 'variant_id', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Variant ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={item.start_date}
                      onChange={(e) => handleItemChange(index, 'start_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={item.end_date}
                      onChange={(e) => handleItemChange(index, 'end_date', e.target.value)}
                      min={item.start_date || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special requirements or questions..."
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuotationRequest;
