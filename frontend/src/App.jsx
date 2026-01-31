import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Orders from './pages/Orders'
import Reservations from './pages/Reservations'
import MyProducts from './pages/MyProducts'
import CreateProduct from './pages/CreateProduct'
import EditProduct from './pages/EditProduct'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
          </Route>

          {/* Auth routes with AuthLayout */}
          {/* Custom Login Layout */}
          <Route path="/login" element={<Login />} />

          {/* Auth routes with AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected routes with DashboardLayout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/products" element={<Products />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/dashboard/reservations" element={<Reservations />} />
            <Route path="/dashboard/my-products" element={<MyProducts />} />
            <Route path="/dashboard/create-product" element={<CreateProduct />} />
            <Route path="/dashboard/products/:id/edit" element={<EditProduct />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
