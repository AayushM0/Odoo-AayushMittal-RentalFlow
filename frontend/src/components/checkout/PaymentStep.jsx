import { useState } from 'react';
import { CheckCircle, CreditCard } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

function PaymentStep({ orderId, onSuccess, onBack }) {
  const [processing, setProcessing] = useState(false);
  const { clearCart } = useCart();

  const handleMarkAsPaid = () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      clearCart(); // Clear the cart
      setProcessing(false);
      onSuccess({ orderId, status: 'PAID' });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payment</h2>
      <div className="border rounded-lg p-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Order Created Successfully!</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-blue-800 mb-1">
              <strong>Order ID:</strong> {orderId}
            </p>
            <p className="text-xs text-blue-600">
              You can track this order in your dashboard
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a simplified payment flow for development.
              In production, integrate with a real payment gateway (Razorpay, Stripe, etc.)
            </p>
          </div>

          <button
            onClick={handleMarkAsPaid}
            disabled={processing}
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {processing ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Mark as Paid & Complete Order
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Click above to simulate successful payment
          </p>
        </div>
      </div>
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          disabled={processing}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default PaymentStep;
