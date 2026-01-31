import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Home, FileText } from 'lucide-react';
import api from '../services/api';

function PaymentConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const orderId = searchParams.get('order_id');
    const paymentId = searchParams.get('payment_id');

    if (!orderId || !paymentId) {
      setStatus('error');
      return;
    }

    try {
      const response = await api.get(`/payments/status/${orderId}`);
      const data = response.data.data;
      
      setPaymentData(data);
      setStatus(data.payment_status === 'PAID' ? 'success' : 'failed');
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {status === 'success' ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600">
                Thank you for your payment. Your order has been confirmed.
              </p>
            </div>

            {paymentData && (
              <div className="border rounded-lg p-6 mb-6 bg-gray-50">
                <h3 className="font-semibold mb-4">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{paymentData.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-green-600">
                      ₹{parseFloat(paymentData.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span>{paymentData.payment_method || 'Razorpay'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs">
                      {paymentData.payment_id}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/orders/${paymentData?.order_id}`)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                View Order
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-600">
                We couldn't process your payment. Please try again.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/cart')}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry Payment
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentConfirmation;
