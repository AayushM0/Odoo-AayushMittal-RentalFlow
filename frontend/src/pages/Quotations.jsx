import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Eye } from 'lucide-react';
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

  useEffect(() => {
    fetchQuotations();
  }, [filter]);

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const response = await api.get('/quotations', { params });
      setQuotations(response.data.data.quotations || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quotations');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quotations</h1>
        {user.role === 'CUSTOMER' && (
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
              ? user.role === 'CUSTOMER'
                ? 'Request your first quotation to get started'
                : 'No quotation requests yet'
              : `No quotations with status "${filter}"`}
          </p>
          {user.role === 'CUSTOMER' && filter === 'ALL' && (
            <Link
              to="/quotations/request"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Request Quotation
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map(quotation => (
            <div
              key={quotation.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Quotation #{quotation.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Requested on {new Date(quotation.created_at).toLocaleDateString()}
                  </p>
                  {user.role === 'VENDOR' && quotation.customer && (
                    <p className="text-sm text-gray-600">
                      Customer: {quotation.customer.name}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[quotation.status]
                  }`}
                >
                  {quotation.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{parseFloat(quotation.total_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valid Until</p>
                  <p className="text-sm font-medium">
                    {quotation.valid_until
                      ? new Date(quotation.valid_until).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Items</p>
                  <p className="text-sm font-medium">
                    {JSON.parse(quotation.items || '[]').length}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to={`/quotations/${quotation.id}`}
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
  );
}

export default Quotations;
