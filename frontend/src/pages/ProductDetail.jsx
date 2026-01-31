import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/products/${id}`)
      
      if (response.data.success) {
        const productData = response.data.data
        setProduct(productData)
        
        if (productData.variants && productData.variants.length > 0) {
          setSelectedVariant(productData.variants[0])
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Product not found')
      } else {
        setError(err.response?.data?.error || 'Failed to load product')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading product...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Products
        </button>
      </div>
    )
  }

  if (!product) return null

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/placeholder-image.jpg']

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/products')} className="hover:text-blue-600">
          Products
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                    idx === currentImageIndex ? 'border-blue-600' : 'border-gray-300'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-lg text-gray-600 mb-4">by {product.vendor_name || 'Unknown Vendor'}</p>
          
          <div className="flex gap-4 mb-6">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {product.category}
            </span>
            {product.brand && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {product.brand}
              </span>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{product.description || 'No description available.'}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Available Variants</h2>
            <div className="space-y-2">
              {product.variants && product.variants.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedVariant?.id === variant.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{variant.sku}</p>
                      {variant.attributes && typeof variant.attributes === 'string' && (
                        <p className="text-sm text-gray-600">
                          {Object.entries(JSON.parse(variant.attributes)).map(([key, value]) => 
                            `${key}: ${value}`
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        ₹{variant.price_daily}/day
                      </p>
                      <p className="text-sm text-gray-600">Stock: {variant.stock_quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedVariant && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Rental Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                {selectedVariant.price_hourly && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Hourly</p>
                    <p className="text-lg font-semibold">₹{selectedVariant.price_hourly}</p>
                  </div>
                )}
                {selectedVariant.price_daily && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Daily</p>
                    <p className="text-lg font-semibold">₹{selectedVariant.price_daily}</p>
                  </div>
                )}
                {selectedVariant.price_weekly && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Weekly</p>
                    <p className="text-lg font-semibold">₹{selectedVariant.price_weekly}</p>
                  </div>
                )}
                {selectedVariant.price_monthly && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Monthly</p>
                    <p className="text-lg font-semibold">₹{selectedVariant.price_monthly}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {user?.role === 'CUSTOMER' && selectedVariant && (
              <button
                onClick={() => navigate(`/reserve/${product.id}?variant=${selectedVariant.id}`)}
                disabled={selectedVariant.stock_quantity === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {selectedVariant.stock_quantity === 0 ? 'Out of Stock' : 'Reserve Now'}
              </button>
            )}
            {user?.role === 'VENDOR' && product.vendor_id === user.id && (
              <>
                <button
                  onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => {}}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
