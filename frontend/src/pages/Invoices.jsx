import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STATUS_COLORS = {
  UNPAID: 'bg-red-100 text-red-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const response = await api.get('/invoices', { params });
      setInvoices(response.data.data.invoices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId, invoiceNumber) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Invoices</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'].map(status => (
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
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 mb-6">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">No invoices found</h2>
          <p className="text-gray-500">
            {filter === 'ALL'
              ? 'You don\'t have any invoices yet'
              : `No invoices with status "${filter}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map(invoice => (
            <div
              key={invoice.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {invoice.invoice_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Order #{invoice.order?.order_number || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Issued {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[invoice.status]
                  }`}
                >
                  {invoice.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{parseFloat(invoice.total_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount Paid</p>
                  <p className="text-lg font-medium text-green-600">
                    ₹{parseFloat(invoice.amount_paid).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount Due</p>
                  <p className="text-lg font-medium text-red-600">
                    ₹{(parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium">
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleDownload(invoice.id, invoice.invoice_number)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <Link
                  to={`/invoices/${invoice.id}`}
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

export default Invoices;
