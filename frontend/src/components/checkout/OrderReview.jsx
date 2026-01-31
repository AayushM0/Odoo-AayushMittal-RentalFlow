import { useState } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../services/api';

function OrderReview({ billingData, quotation, cartItems, onConfirm, onBack }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmOrder = async () => {
    setCreating(true);
    setError(null);

    try {
      const itemsByVendor = cartItems.reduce((acc, item) => {
        if (!acc[item.vendorId]) {
          acc[item.vendorId] = [];
        }
        acc[item.vendorId].push({
          variant_id: item.variantId,
          quantity: item.quantity,
          start_date: item.startDate,
          end_date: item.endDate
        });
        return acc;
      }, {});

      const orderPromises = Object.entries(itemsByVendor).map(
        async ([vendorId, items]) => {
          const response = await api.post('/orders', {
            vendor_id: parseInt(vendorId),
            items,
            customer_notes: '',
            billing_address: billingData.billingAddress,
            shipping_address: billingData.shippingAddress
          });
          return response.data.data;
        }
      );

      const orders = await Promise.all(orderPromises);
      const firstOrder = orders[0];
      onConfirm(firstOrder.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Your Order</h2>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Billing Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Name:</p>
            <p className="font-medium">{billingData.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Email:</p>
            <p className="font-medium">{billingData.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone:</p>
            <p className="font-medium">{billingData.phone}</p>
          </div>
          {billingData.company && (
            <div>
              <p className="text-gray-600">Company:</p>
              <p className="font-medium">{billingData.company}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Billing Address</h3>
          <p className="text-sm">
            {billingData.billingAddress.street}<br />
            {billingData.billingAddress.city}, {billingData.billingAddress.state}<br />
            {billingData.billingAddress.pincode}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Shipping Address</h3>
          <p className="text-sm">
            {billingData.shippingAddress.street}<br />
            {billingData.shippingAddress.city}, {billingData.shippingAddress.state}<br />
            {billingData.shippingAddress.pincode}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Order Items</h3>
        <div className="space-y-3">
          {cartItems.map(item => (
            <div key={item.id} className="flex gap-4 pb-3 border-b last:border-b-0">
              <img
                src={item.productImage}
                alt={item.productName}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-medium">{item.productName}</h4>
                <p className="text-sm text-gray-600">SKU: {item.variantSku}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(item.startDate).toLocaleDateString()} -{' '}
                    {new Date(item.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                <p className="font-medium">₹{(item.pricePerUnit * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-4">Pricing Summary</h3>
        
        {quotation.quotations.map((quote, index) => (
          <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
            <p className="text-sm font-medium mb-2">Vendor #{index + 1}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>₹{parseFloat(quote.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST ({quote.tax_rate * 100}%):</span>
                <span>₹{parseFloat(quote.tax_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between text-lg font-bold pt-4 border-t">
          <span>Total Amount:</span>
          <span className="text-blue-600">₹{quotation.totalAmount}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={creating}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleConfirmOrder}
          disabled={creating}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating Order...' : 'Confirm & Proceed to Payment'}
        </button>
      </div>
    </div>
  );
}

export default OrderReview;
