import { DollarSign, Calendar } from 'lucide-react';

function RefundDisplay({ refunds }) {
  if (!refunds || refunds.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5" />
        Refund History
      </h3>

      <div className="space-y-3">
        {refunds.map((refund, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 bg-blue-50 border-blue-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-blue-900">
                  Refund #{index + 1}
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-700 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(refund.refund_date).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600">
                ₹{parseFloat(refund.amount).toFixed(2)}
              </span>
            </div>

            {refund.refund_id && (
              <p className="text-xs text-blue-600 font-mono mb-1">
                Refund ID: {refund.refund_id}
              </p>
            )}

            {refund.reason && (
              <p className="text-sm text-gray-700 mt-2">
                <strong>Reason:</strong> {refund.reason}
              </p>
            )}

            <div className="mt-2 pt-2 border-t border-blue-300">
              <p className="text-xs text-blue-700">
                <strong>Status:</strong> {refund.status || 'Processed'}
              </p>
              {refund.expected_date && (
                <p className="text-xs text-blue-700">
                  Expected in account by: {new Date(refund.expected_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Refunds typically take 5-7 business days to reflect in your account
      </p>
    </div>
  );
}

export default RefundDisplay;
