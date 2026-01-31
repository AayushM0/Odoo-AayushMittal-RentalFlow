import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

function EditProduct() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    is_published: true,
    images: [],
    variants: []
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/products/${id}`)
        const product = response.data.data
        
        // Check if user owns this product
        if (user?.role === 'VENDOR' && product.vendor_id !== user.id) {
          setError('You do not have permission to edit this product')
          return
        }

        setFormData({
          name: product.name || '',
          description: product.description || '',
          category: product.category || '',
          brand: product.brand || '',
          is_published: product.is_published ?? true,
          images: product.images || [],
          variants: product.variants?.map(v => ({
            id: v.id,
            sku: v.sku || '',
            attributes: v.attributes || {},
            price_hourly: v.price_hourly || '',
            price_daily: v.price_daily || '',
            price_weekly: v.price_weekly || '',
            price_monthly: v.price_monthly || '',
            stock_quantity: v.stock_quantity || ''
          })) || []
        })
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'VENDOR') {
      fetchProduct()
    } else {
      navigate('/dashboard')
    }
  }, [id, user, navigate])

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
    setSaving(true)
    setError(null)

    try {
      // Upload image first if new image selected
      let imageUrl = formData.images[0] || null
      if (imageFile) {
        const formDataImg = new FormData()
        formDataImg.append('productImages', imageFile)
        
        try {
          const uploadResponse = await api.post(`/upload/product/${id}/images`, formDataImg, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          imageUrl = uploadResponse.data.data.images[0]
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr)
          setError('Image upload failed, but will save other changes')
        }
      }

      // Prepare data
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        is_published: formData.is_published,
        images: imageUrl ? [imageUrl] : formData.images
      }

      // Include variants if any exist
      if (formData.variants.length > 0) {
        productData.variants = formData.variants.map(v => ({
          id: v.id, // Include id for existing variants (will be updated), omit for new (will be created)
          sku: v.sku,
          attributes: v.attributes,
          price_hourly: parseFloat(v.price_hourly) || null,
          price_daily: parseFloat(v.price_daily) || 0,
          price_weekly: parseFloat(v.price_weekly) || null,
          price_monthly: parseFloat(v.price_monthly) || null,
          stock_quantity: parseInt(v.stock_quantity) || 0
        }))
      }

      await api.put(`/products/${id}`, productData)
      
      navigate('/dashboard/my-products')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !formData.name) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => navigate('/dashboard/my-products')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to My Products
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product information</p>
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
                <span className="text-sm font-medium text-gray-700">Published</span>
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
            />
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            
            {(imagePreview || formData.images[0]) && (
              <div className="mb-3">
                <img
                  src={imagePreview || formData.images[0]}
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
              Upload a new image to replace the current one (optional)
            </p>
          </div>
        </div>

        {/* Variants */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Variants & Pricing</h2>
              <p className="text-sm text-gray-500 mt-1">
                Optional: Edit existing variants or add new ones
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
              <p className="text-gray-500 mb-3">No variants for this product</p>
              <p className="text-sm text-gray-400 mb-4">
                Click "Add Variant" to create product variants with different pricing and stock levels
              </p>
            </div>
          )}

          {formData.variants.map((variant, index) => (
            <div key={variant.id || index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">
                  Variant {index + 1} {variant.id && <span className="text-xs text-gray-500 ml-2">(Existing)</span>}
                </h3>
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
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
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

export default EditProduct
