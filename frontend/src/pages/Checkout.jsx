import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import BillingForm from '../components/checkout/BillingForm';
import OrderReview from '../components/checkout/OrderReview';
import PaymentStep from '../components/checkout/PaymentStep';

const STEPS = [
  { id: 1, name: 'Billing Details', component: 'billing' },
  { id: 2, name: 'Review Order', component: 'review' },
  { id: 3, name: 'Payment', component: 'payment' }
];

function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, quotation, getQuotation } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [billingData, setBillingData] = useState(null);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    if (!quotation) {
      getQuotation().catch(err => {
        alert('Failed to get quotation. Please try again.');
        navigate('/cart');
      });
    }
  }, [cartItems, quotation, navigate, getQuotation]);

  const handleBillingSubmit = (data) => {
    setBillingData(data);
    setCurrentStep(2);
  };

  const handleReviewConfirm = (createdOrderId) => {
    setOrderId(createdOrderId);
    setCurrentStep(3);
  };

  const handlePaymentSuccess = () => {
    // Navigate to orders page with success message
    navigate('/dashboard/orders', { 
      state: { message: 'Order placed successfully! Payment marked as completed.' }
    });
  };

  const handleStepClick = (stepId) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  if (!quotation) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading quotation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step.id < currentStep
                      ? 'bg-green-500 border-green-500 text-white cursor-pointer'
                      : step.id === currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </button>
                <span
                  className={`ml-3 text-sm font-medium ${
                    step.id <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 1 && (
            <BillingForm
              initialData={billingData}
              onSubmit={handleBillingSubmit}
              onBack={() => navigate('/cart')}
            />
          )}
          {currentStep === 2 && (
            <OrderReview
              billingData={billingData}
              quotation={quotation}
              cartItems={cartItems}
              onConfirm={handleReviewConfirm}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && orderId && (
            <PaymentStep
              orderId={orderId}
              onSuccess={handlePaymentSuccess}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
