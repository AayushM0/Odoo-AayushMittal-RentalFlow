import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Eye, CheckCircle, XCircle, Package, Calendar, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800'
};

function Quotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchQuotations();
  }, [filter]);

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      console.log('Fetching quotations with params:', params);
      const response = await api.get('/quotations', { params });
      console.log('Quotations response:', response.data);
      // Backend returns { success: true, data: quotations[] }
      const quotationsData = response.data.data || [];
      console.log('Quotations data:', quotationsData);
      setQuotations(quotationsData);
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError(err.response?.data?.error || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (quotationId) => {
    if (!confirm('Are you sure you want to approve this quotation?')) return;

    setActionLoading(prev => ({ ...prev, [quotationId]: 'approving' }));
    try {
      await api.post(`/quotations/${quotationId}/approve`, {
        modifiedData: null
      });
      alert('Quotation approved successfully!');
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve quotation');
    } finally {
      setActionLoading(prev => ({ ...prev, [quotationId]: null }));
    }
  };

  const handleReject = async (quotationId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setActionLoading(prev => ({ ...prev, [quotationId]: 'rejecting' }));
    try {
      await api.post(`/quotations/${quotationId}/reject`, { reason });
      alert('Quotation rejected');
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject quotation');
    } finally {
      setActionLoading(prev => ({ ...prev, [quotationId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading quotations...</p>
      </div>
    );
  }

  console.log('Rendering Quotations page, user:', user, 'quotations count:', quotations.length);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quotations</h1>
        {user?.role === 'CUSTOMER' && (
          <Link
            to="/quotations/request"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Request Quotation
          </Link>
        )}
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 mb-6">
          {error}
        </div>
      )}

      {/* Quotations List */}
      {quotations.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">No quotations found</h2>
          <p className="text-gray-500 mb-8">
            {filter === 'ALL'
              ? user?.role === 'CUSTOMER'
                ? 'Request your first quotation to get started'
                : 'No quotation requests yet'
              : `No quotations with status "${filter}"`}
          </p>
          {user?.role === 'CUSTOMER' && filter === 'ALL' && (
            <Link
              to="/quotations/request"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Request Quotation
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {quotations.map(quotation => {
            // Handle items - could be string or already parsed object
            let items = [];
            try {
              items = typeof quotation.items === 'string' 
                ? JSON.parse(quotation.items || '[]')
                : (quotation.items || []);
            } catch (e) {
              console.error('Failed to parse quotation items:', e);
              items = [];
            }
            
            const isVendor = user?.role === 'VENDOR';
            const isPending = quotation.status === 'PENDING';
            const isLoadingAction = actionLoading[quotation.id];

            return (
              <div
                key={quotation.id}
                className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Quotation #{quotation.id}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(quotation.created_at).toLocaleDateString()}
                        </div>
                        {isVendor && quotation.customer_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {quotation.customer_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        STATUS_COLORS[quotation.status]
                      }`}
                    >
                      {quotation.status}
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Products ({items.length})</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            {item.product_name || `Product (Variant ID: ${item.variant_id})`}
                          </p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>SKU: {item.sku || 'N/A'}</p>
                            <p>Quantity: {item.quantity} units</p>
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Duration: {item.rental_duration} days
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-blue-600">
                            ₹{parseFloat(item.line_total || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ₹{parseFloat(item.price_per_unit || 0).toFixed(2)} per unit
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Summary */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-medium">₹{parseFloat(quotation.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Tax (GST):</span>
                        <span className="font-medium">₹{parseFloat(quotation.tax || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-300">
                        <span className="font-bold text-gray-900">Total Amount:</span>
                        <span className="text-xl font-bold text-blue-600">
                          ₹{parseFloat(quotation.total_amount).toFixed(2)}
                        </span>
                      </div>
                      {quotation.valid_until && (
                        <p className="text-xs text-gray-600 pt-2">
                          Valid until: {new Date(quotation.valid_until).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {quotation.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Notes:</p>
                      <p className="text-sm text-gray-600">{quotation.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t bg-gray-50 flex justify-between items-center gap-3">
                  <Link
                    to={`/quotations/${quotation.id}`}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Details
                  </Link>

                  {isVendor && isPending && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(quotation.id)}
                        disabled={isLoadingAction}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {isLoadingAction === 'approving' ? 'Approving...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleReject(quotation.id)}
                        disabled={isLoadingAction}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                      >
                        <XCircle className="w-5 h-5" />
                        {isLoadingAction === 'rejecting' ? 'Rejecting...' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Quotations;
