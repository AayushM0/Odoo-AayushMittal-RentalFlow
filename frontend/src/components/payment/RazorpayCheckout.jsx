import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

function RazorpayCheckout({ orderId, onSuccess, onError }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);

  useEffect(() => {
    createPaymentOrder();
  }, [orderId]);

  const createPaymentOrder = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/create-order', {
        order_id: orderId
      });
      setPaymentOrder(response.data.data);
    } catch (error) {
      onError?.('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      onError?.('Failed to load Razorpay SDK');
      return;
    }

    if (!paymentOrder) {
      onError?.('Payment order not initialized');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      order_id: paymentOrder.razorpayOrderId || paymentOrder.razorpay_order_id,
      name: 'Rental ERP',
      description: `Payment for Order #${paymentOrder.order_number || paymentOrder.order?.order_number}`,
      image: '/logo.png',
      
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: {
        color: '#2563eb'
      },
      handler: async function (response) {
        try {
          const verifyResponse = await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          onSuccess?.(verifyResponse.data.data);
        } catch (error) {
          onError?.(error.response?.data?.message || 'Payment verification failed');
        }
      },
      modal: {
        ondismiss: function() {
          onError?.('Payment cancelled by user');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  return (
    <div className="space-y-4">
      {paymentOrder && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Amount to Pay:</span>
            <span className="text-lg font-bold text-blue-600">
              ₹{(paymentOrder.amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order Number:</span>
            <span className="font-medium">{paymentOrder.order_number || paymentOrder.order?.order_number}</span>
          </div>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !paymentOrder}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        {loading ? 'Initializing...' : 'Pay with Razorpay'}
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Secure payment powered by Razorpay
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supports UPI, Cards, Net Banking, and Wallets
        </p>
      </div>
    </div>
  );
}

export default RazorpayCheckout;
