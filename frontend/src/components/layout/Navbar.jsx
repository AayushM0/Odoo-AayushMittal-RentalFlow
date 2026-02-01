import { Link } from 'react-router-dom'
import { Home, Package, ShoppingCart, LogIn, LogOut, LayoutDashboard } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import NotificationBell from '../notifications/NotificationBell'

function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount, cartItems } = useCart()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Package className="w-8 h-8" />
            Rental ERP
          </Link>
          
          <div className="flex gap-6 items-center">
            <Link 
              to={user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'CUSTOMER' ? '/customer/dashboard' : user?.role === 'VENDOR' ? '/dashboard' : '/'} 
              className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link to="/products" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
              <Package className="w-5 h-5" />
              Products
            </Link>
            
            {user && (
              <>
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link to="/customer/dashboard" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    
                    <Link 
                      to="/cart" 
                      className={cn("relative flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}
                      aria-label={`Cart with ${cartItems} items`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Cart
                      {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {itemCount > 99 ? '99+' : itemCount}
                        </span>
                      )}
                    </Link>
                    
                    <Link to="/orders" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      My Orders
                    </Link>
                    
                    <Link to="/invoices" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Invoices
                    </Link>
                  </>
                )}
                
                {user.role === 'VENDOR' && (
                  <>
                    <Link to="/dashboard" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <Link to="/vendor/pickups" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Pickups
                    </Link>
                    {/* <Link to="/vendor/returns" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Returns
                    </Link> */}
                    <Link to="/orders" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Orders
                    </Link>
                    <Link to="/invoices" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Invoices
                    </Link>
                  </>
                )}
                
                {user.role === 'ADMIN' && (
                  <>
                    <Link to="/admin/dashboard" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <Link to="/admin/analytics" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Analytics
                    </Link>
                    <Link to="/admin/reports" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Reports
                    </Link>
                    <Link to="/products" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Products
                    </Link>
                    <Link to="/orders" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Orders
                    </Link>
                    <Link to="/invoices" className={cn("flex items-center gap-2 text-gray-700 hover:text-blue-600 transition")}>
                      Invoices
                    </Link>
                  </>
                )}
                
                <NotificationBell />
                
                <button
                  onClick={logout}
                  className={cn("flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition")}
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            )}
            
            {!user && (
              <Link to="/login" className={cn("flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition")}>
                <LogIn className="w-5 h-5" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
