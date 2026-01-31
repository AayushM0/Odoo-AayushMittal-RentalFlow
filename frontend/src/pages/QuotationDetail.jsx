import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQuotationDetail();
  }, [id]);

  const fetchQuotationDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/quotations/${id}`);
      setQuotation(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this quotation?')) return;

    setActionLoading(true);
    try {
      await api.post(`/quotations/${id}/approve`);
      alert('Quotation approved successfully!');
      fetchQuotationDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    setActionLoading(true);
    try {
      await api.post(`/quotations/${id}/reject`, { reason });
      alert('Quotation rejected');
      fetchQuotationDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!confirm('Convert this quotation to an order?')) return;

    setActionLoading(true);
    try {
      const itemsData = quotation.items;
      const items = typeof itemsData === 'string' ? JSON.parse(itemsData) : itemsData;
      const response = await api.post('/orders', {
        items: items.map(item => ({
          variantId: item.variant_id,
          quantity: item.quantity,
          startDate: item.start_date,
          endDate: item.end_date
        }))
      });
      
      alert('Order created successfully!');
      navigate(`/orders/${response.data.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading quotation...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <XCircle className="w-20 h-20 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Quotation Not Found</h2>
        <p className="text-gray-500 mb-8">{error}</p>
        <button
          onClick={() => navigate('/quotations')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Quotations
        </button>
      </div>
    );
  }

  const items = JSON.parse(quotation.items || '[]');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate('/quotations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Quotations
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Quotation #{quotation.id}</h1>
              <p className="text-sm text-gray-600">
                Requested on {new Date(quotation.created_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                quotation.status === 'APPROVED'
                  ? 'bg-green-100 text-green-800'
                  : quotation.status === 'REJECTED'
                  ? 'bg-red-100 text-red-800'
                  : quotation.status === 'EXPIRED'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {quotation.status}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Quotation Items</h2>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="pb-3 border-b last:border-b-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Variant ID: {item.variant_id}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.start_date).toLocaleDateString()} -{' '}
                      {new Date(item.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{parseFloat(item.line_total).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">
                      ₹{parseFloat(item.price_per_unit).toFixed(2)} per unit
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Pricing Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>₹{parseFloat(quotation.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GST ({(quotation.tax_rate * 100).toFixed(0)}%):</span>
              <span>₹{parseFloat(quotation.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-blue-600">₹{parseFloat(quotation.total_amount).toFixed(2)}</span>
            </div>
          </div>
          {quotation.valid_until && (
            <p className="text-sm text-gray-600 mt-4">
              Valid until: {new Date(quotation.valid_until).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-bold mb-2">Notes</h3>
            <p className="text-sm text-gray-700">{quotation.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold mb-4">Actions</h3>
          
          {user.role === 'VENDOR' && quotation.status === 'PENDING' && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
            </div>
          )}

          {user.role === 'CUSTOMER' && quotation.status === 'APPROVED' && (
            <button
              onClick={handleConvertToOrder}
              disabled={actionLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Convert to Order
            </button>
          )}

          {quotation.status === 'REJECTED' && (
            <div className="p-4 bg-red-50 text-red-600 rounded">
              This quotation has been rejected
            </div>
          )}

          {quotation.status === 'EXPIRED' && (
            <div className="p-4 bg-gray-50 text-gray-600 rounded">
              This quotation has expired
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuotationDetail;
