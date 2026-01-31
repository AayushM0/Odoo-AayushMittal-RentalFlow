import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

function CreateProduct() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    is_published: true,
    images: [],
    variants: [],
    // Stock for simple products (non-variant)
    price_daily: '',
    price_weekly: '',
    price_monthly: '',
    price_hourly: '',
    stock_quantity: '1'
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants]
    updatedVariants[index][field] = value
    setFormData(prev => ({ ...prev, variants: updatedVariants }))
  }

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        sku: '',
        attributes: {},
        price_hourly: '',
        price_daily: '',
        price_weekly: '',
        price_monthly: '',
        stock_quantity: ''
      }]
    }))
  }

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Prepare data
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        is_published: formData.is_published,
        images: formData.images
      }

      // If there are variants, use them
      if (formData.variants.length > 0) {
        productData.variants = formData.variants.map(v => ({
          sku: v.sku,
          attributes: v.attributes,
          price_hourly: parseFloat(v.price_hourly) || null,
          price_daily: parseFloat(v.price_daily) || 0,
          price_weekly: parseFloat(v.price_weekly) || null,
          price_monthly: parseFloat(v.price_monthly) || null,
          stock_quantity: parseInt(v.stock_quantity) || 0
        }))
      } else {
        // For products without variants, create a default variant
        // This is required because stock is managed at the variant level
        productData.variants = [{
          sku: `${formData.brand}-${formData.name}-DEFAULT`.toUpperCase().replace(/[^A-Z0-9-]/g, '-'),
          attributes: {},
          price_hourly: parseFloat(formData.price_hourly) || null,
          price_daily: parseFloat(formData.price_daily) || 0,
          price_weekly: parseFloat(formData.price_weekly) || null,
          price_monthly: parseFloat(formData.price_monthly) || null,
          stock_quantity: parseInt(formData.stock_quantity) || 1
        }]
      }

      const createResponse = await api.post('/products', productData)
      const newProductId = createResponse.data.data.id

      // Upload image if selected
      if (imageFile && newProductId) {
        const formDataImg = new FormData()
        formDataImg.append('productImages', imageFile)
        
        try {
          await api.post(`/upload/product/${newProductId}/images`, formDataImg, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr)
          // Continue anyway - product was created
        }
      }

      navigate('/dashboard/my-products')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'VENDOR') {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
        <p className="text-gray-600 mt-1">Add a new product to your inventory</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Basic Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Professional Camera"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Canon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Tools">Tools</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Publish immediately</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your product..."
            />
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            
            {imagePreview && (
              <div className="mb-3">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload a product image (optional, can be added later)
            </p>
          </div>
        </div>

        {/* Pricing & Stock - Only shown when no variants */}
        {formData.variants.length === 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Pricing & Stock</h2>
            <p className="text-sm text-gray-600 mb-4">
              Set pricing and stock for this product. At least one price is required.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Price (₹) *
                </label>
                <input
                  type="number"
                  name="price_daily"
                  value={formData.price_daily}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Price (₹)
                </label>
                <input
                  type="number"
                  name="price_weekly"
                  value={formData.price_weekly}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 3000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Price (₹)
                </label>
                <input
                  type="number"
                  name="price_monthly"
                  value={formData.price_monthly}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Price (₹)
                </label>
                <input
                  type="number"
                  name="price_hourly"
                  value={formData.price_hourly}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5"
                />
                <p className="mt-1 text-xs text-gray-500">
                  How many units are available for rent? (Default: 1)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Variants */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Variants & Pricing</h2>
              <p className="text-sm text-gray-500 mt-1">
                Optional: Add variants if your product has different options (size, color, etc.)
              </p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              + Add Variant
            </button>
          </div>

          {formData.variants.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-3">No variants added yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Click "Add Variant" to create product variants with different pricing and stock levels
              </p>
            </div>
          )}

          {formData.variants.map((variant, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Variant {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CAM-CANON-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={variant.stock_quantity}
                    onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={variant.price_daily}
                    onChange={(e) => handleVariantChange(index, 'price_daily', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Price (₹)
                  </label>
                  <input
                    type="number"
                    value={variant.price_weekly}
                    onChange={(e) => handleVariantChange(index, 'price_weekly', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 3000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Price (₹)
                  </label>
                  <input
                    type="number"
                    value={variant.price_monthly}
                    onChange={(e) => handleVariantChange(index, 'price_monthly', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Price (₹)
                  </label>
                  <input
                    type="number"
                    value={variant.price_hourly}
                    onChange={(e) => handleVariantChange(index, 'price_hourly', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/my-products')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateProduct
