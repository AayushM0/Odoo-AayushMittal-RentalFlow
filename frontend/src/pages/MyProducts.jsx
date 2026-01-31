import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function MyProducts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/products')
      const allProducts = response.data.data?.products || []
      const myProducts = allProducts.filter(p => p.vendor_id === user?.id)
      setProducts(myProducts)
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'VENDOR') {
      navigate('/dashboard')
      return
    }
    fetchProducts()
  }, [user, navigate])

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await api.delete(`/products/${productId}`)
      await fetchProducts()
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  const getTotalStock = (product) => {
    // Use total_stock from API if available, otherwise calculate from variants
    if (product.total_stock !== undefined) {
      return parseInt(product.total_stock) || 0
    }
    if (!product.variants || product.variants.length === 0) return 0
    return product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
  }

  const getLowestStock = (product) => {
    // Use total_stock as approximation if variants not available
    if (product.total_stock !== undefined && (!product.variants || product.variants.length === 0)) {
      return parseInt(product.total_stock) || 0
    }
    if (!product.variants || product.variants.length === 0) return 0
    return Math.min(...product.variants.map(v => v.stock_quantity || 0))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-600 mt-1">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/create-product')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add New Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">You haven't created any products yet</p>
          <button
            onClick={() => navigate('/dashboard/create-product')}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const totalStock = getTotalStock(product)
            const lowestStock = getLowestStock(product)
            const isLowStock = lowestStock < 2 && lowestStock > 0
            const isOutOfStock = totalStock === 0

            return (
              <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    {isOutOfStock && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Low Stock
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Stock:</span>
                      <span className={`font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                        {totalStock} units
                      </span>
                    </div>
                    {product.min_daily_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Starting Price:</span>
                        <span className="font-medium">
                          {formatCurrency(product.min_daily_price)}/day
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Variants:</span>
                      <span className="font-medium">{product.variant_count || product.variants?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                      className="flex-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyProducts
