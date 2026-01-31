import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Send, DollarSign } from 'lucide-react';
import api from '../services/api';

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  const fetchInvoiceDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/invoices/${id}`);
      const data = response.data.data;
      setInvoice(data);
      
      if (data.payments) {
        setPayments(Array.isArray(data.payments) ? data.payments : JSON.parse(data.payments || '[]'));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/invoices/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    setEmailing(true);
    try {
      await api.post(`/invoices/${id}/send-email`);
      alert('Invoice sent to your email!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send email');
    } finally {
      setEmailing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Invoice Not Found</h2>
        <p className="text-gray-500 mb-8">{error}</p>
        <button
          onClick={() => navigate('/invoices')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const lineItems = JSON.parse(invoice.line_items || '[]');
  const amountDue = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Invoices
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{invoice.invoice_number}</h1>
              <p className="text-gray-600">
                Issued on {new Date(invoice.created_at).toLocaleDateString()}
              </p>
              {invoice.order && (
                <Link
                  to={`/orders/${invoice.order.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Order #{invoice.order.order_number}
                </Link>
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                invoice.status === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : invoice.status === 'PARTIALLY_PAID'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {invoice.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={emailing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {emailing ? 'Sending...' : 'Email Invoice'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Line Items</h2>
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="flex justify-between pb-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                  </p>
                </div>
                <p className="font-bold">₹{parseFloat(item.total).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>₹{parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
              <span>₹{parseFloat(invoice.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total Amount:</span>
              <span className="text-blue-600">₹{parseFloat(invoice.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Amount Paid:</span>
              <span>₹{parseFloat(invoice.amount_paid).toFixed(2)}</span>
            </div>
            {amountDue > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Amount Due:</span>
                <span>₹{amountDue.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {payments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment History
            </h2>
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">Payment {index + 1}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                    {payment.payment_method && (
                      <p className="text-xs text-gray-500">
                        Method: {payment.payment_method}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    ₹{parseFloat(payment.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {amountDue > 0 && invoice.due_date && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Payment Due:</strong> By {new Date(invoice.due_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceDetail;
