import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { loadPublicSettings } from './utils/settings'
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
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Reservations from './pages/Reservations'
import Pickups from './pages/vendor/Pickups'
import Returns from './pages/vendor/Returns'
import MyProducts from './pages/MyProducts'
import CreateProduct from './pages/CreateProduct'
import EditProduct from './pages/EditProduct'
import QuotationRequest from './pages/QuotationRequest'
import Quotations from './pages/Quotations'
import QuotationDetail from './pages/QuotationDetail'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import PaymentConfirmation from './pages/PaymentConfirmation'
import CustomerDashboard from './pages/customer/Dashboard'
import VendorDashboard from './pages/vendor/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import Analytics from './pages/admin/Analytics'
import Reports from './pages/admin/Reports'
import UserManagement from './pages/admin/UserManagement'
import UserCreate from './pages/admin/UserCreate'
import UserEdit from './pages/admin/UserEdit'
import AuditLogs from './pages/admin/AuditLogs'
import SystemSettings from './pages/admin/SystemSettings'
import Notifications from './pages/Notifications'
import ProductSearch from './pages/ProductSearch'
import NotFound from './pages/NotFound'

function App() {
  // Load public settings on app initialization
  useEffect(() => {
    loadPublicSettings().catch(err => {
      console.error('Failed to load public settings:', err);
    });
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <Router>
        <Routes>
          {/* Public routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/search" element={<ProductSearch />} />
          </Route>

          {/* Cart - Protected for CUSTOMER */}
          <Route element={<MainLayout />}>
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Orders - Protected for CUSTOMER and VENDOR */}
          <Route element={<MainLayout />}>
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'ADMIN']}>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Vendor Dashboard */}
          <Route element={<MainLayout />}>
            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Dashboard */}
          <Route element={<MainLayout />}>
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/create"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SystemSettings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Vendor Pickup/Return Management */}
          <Route element={<MainLayout />}>
            <Route
              path="/vendor/pickups"
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <Pickups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/returns"
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <Returns />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Quotations - Protected for CUSTOMER and VENDOR */}
          <Route element={<MainLayout />}>
            <Route
              path="/quotations/request"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <QuotationRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR']}>
                  <Quotations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/:id"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'ADMIN']}>
                  <QuotationDetail />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Invoices - Protected for CUSTOMER and VENDOR */}
          <Route element={<MainLayout />}>
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR']}>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'ADMIN']}>
                  <InvoiceDetail />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Customer Dashboard - Protected for CUSTOMER */}
          <Route element={<MainLayout />}>
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Payment Confirmation - Protected for CUSTOMER */}
          <Route element={<MainLayout />}>
            <Route
              path="/payment/confirmation"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <PaymentConfirmation />
                </ProtectedRoute>
              }
            />
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
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
