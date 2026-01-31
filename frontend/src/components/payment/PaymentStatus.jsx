import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  SUCCESS: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Payment Successful!',
    description: 'Your payment has been processed successfully.'
  },
  FAILED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Payment Failed',
    description: 'Your payment could not be processed.'
  },
  PENDING: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Payment Pending',
    description: 'Your payment is being processed.'
  },
  REFUNDED: {
    icon: AlertCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Payment Refunded',
    description: 'This payment has been refunded to your account.'
  }
};

function PaymentStatus({ status, amount, paymentId, transactionDate, message }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <div className={`border-2 rounded-lg p-6 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center gap-4 mb-4">
        <Icon className={`w-12 h-12 ${config.color}`} />
        <div>
          <h3 className={`text-xl font-bold ${config.color}`}>{config.title}</h3>
          <p className="text-sm text-gray-600">{message || config.description}</p>
        </div>
      </div>

      {amount && (
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold">₹{parseFloat(amount).toFixed(2)}</span>
          </div>
          {paymentId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-mono text-sm">{paymentId}</span>
            </div>
          )}
          {transactionDate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{new Date(transactionDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentStatus;
