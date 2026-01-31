import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function BillingForm({ initialData, onSubmit, onBack }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(
    initialData || {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      gstin: user?.gstin || '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      sameAsBilling: true
    }
  );
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
      return;
    }

    if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        billingAddress: { ...formData.billingAddress, [field]: value }
      });
    } else if (name.startsWith('shipping.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        shippingAddress: { ...formData.shippingAddress, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.billingAddress.street.trim())
      newErrors['billing.street'] = 'Street is required';
    if (!formData.billingAddress.city.trim())
      newErrors['billing.city'] = 'City is required';
    if (!formData.billingAddress.state.trim())
      newErrors['billing.state'] = 'State is required';
    if (!formData.billingAddress.pincode.trim())
      newErrors['billing.pincode'] = 'Pincode is required';

    if (!formData.sameAsBilling) {
      if (!formData.shippingAddress.street.trim())
        newErrors['shipping.street'] = 'Street is required';
      if (!formData.shippingAddress.city.trim())
        newErrors['shipping.city'] = 'City is required';
      if (!formData.shippingAddress.state.trim())
        newErrors['shipping.state'] = 'State is required';
      if (!formData.shippingAddress.pincode.trim())
        newErrors['shipping.pincode'] = 'Pincode is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const submissionData = { ...formData };
    if (formData.sameAsBilling) {
      submissionData.shippingAddress = { ...formData.billingAddress };
    }

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Billing Information</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company (Optional)</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">GSTIN (Optional)</label>
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            placeholder="22AAAAA0000A1Z5"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="billing.street"
              value={formData.billingAddress.street}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['billing.street'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors['billing.street'] && (
              <p className="text-red-500 text-xs mt-1">{errors['billing.street']}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="billing.city"
              value={formData.billingAddress.city}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['billing.city'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors['billing.city'] && (
              <p className="text-red-500 text-xs mt-1">{errors['billing.city']}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="billing.state"
              value={formData.billingAddress.state}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['billing.state'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors['billing.state'] && (
              <p className="text-red-500 text-xs mt-1">{errors['billing.state']}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="billing.pincode"
              value={formData.billingAddress.pincode}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['billing.pincode'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors['billing.pincode'] && (
              <p className="text-red-500 text-xs mt-1">{errors['billing.pincode']}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="sameAsBilling"
            checked={formData.sameAsBilling}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium">Shipping address same as billing</span>
        </label>
      </div>

      {!formData.sameAsBilling && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="shipping.street"
                value={formData.shippingAddress.street}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['shipping.street'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['shipping.street'] && (
                <p className="text-red-500 text-xs mt-1">{errors['shipping.street']}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="shipping.city"
                value={formData.shippingAddress.city}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['shipping.city'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['shipping.city'] && (
                <p className="text-red-500 text-xs mt-1">{errors['shipping.city']}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="shipping.state"
                value={formData.shippingAddress.state}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['shipping.state'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['shipping.state'] && (
                <p className="text-red-500 text-xs mt-1">{errors['shipping.state']}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="shipping.pincode"
                value={formData.shippingAddress.pincode}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['shipping.pincode'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['shipping.pincode'] && (
                <p className="text-red-500 text-xs mt-1">{errors['shipping.pincode']}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Back to Cart
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continue to Review
        </button>
      </div>
    </form>
  );
}

export default BillingForm;
