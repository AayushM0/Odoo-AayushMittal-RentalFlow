import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ProductCard from '../components/products/ProductCard'

function Home() {
  const { user, isAuthenticated } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [stats, setStats] = useState({ totalProducts: 0, categories: 0 })
  const [loading, setLoading] = useState(true)
  
  // Redirect authenticated users to dashboard
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/products?limit=6')
        const products = response.data.data?.products || []
        const total = response.data.data?.total || 0
        
        setFeaturedProducts(products)
        
        const uniqueCategories = new Set(products.map(p => p.category))
        setStats({
          totalProducts: total,
          categories: uniqueCategories.size
        })
      } catch (error) {
        console.error('Failed to fetch home data')
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  const getCTA = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Login to Get Started
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            Sign Up Free
          </Link>
        </div>
      )
    }

    if (user?.role === 'CUSTOMER') {
      return (
        <Link
          to="/products"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Browse All Products
        </Link>
      )
    }

    return (
      <Link
        to="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
      >
        Go to Dashboard
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            Rental ERP System
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Complete Rental Management Platform for Your Business
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalProducts}</div>
              <div className="text-gray-600">Available Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.categories}</div>
              <div className="text-gray-600">Categories</div>
            </div>
          </div>
          {getCTA()}
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured Products</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">No products available yet</p>
              {user?.role === 'VENDOR' && (
                <Link
                  to="/dashboard"
                  className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Your First Product
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">Browse Products</h3>
            <p className="text-gray-600">Explore our extensive rental inventory with real-time availability</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Easy Rentals</h3>
            <p className="text-gray-600">Simple booking process with automated reservation management</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-2">For Vendors</h3>
            <p className="text-gray-600">Manage your inventory and orders with powerful ERP tools</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home;
