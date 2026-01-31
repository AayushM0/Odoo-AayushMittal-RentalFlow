import { Link, useLocation } from 'react-router-dom'
import { Home, Package, ShoppingCart, FileText, Users, Settings, LogOut, Calendar } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  const customerMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Browse Products', path: '/dashboard/products' },
    { icon: ShoppingCart, label: 'My Orders', path: '/dashboard/orders' },
    { icon: Calendar, label: 'My Reservations', path: '/dashboard/reservations' },
    { icon: FileText, label: 'My Invoices', path: '/dashboard/invoices' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ]
  
  const vendorMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'My Products', path: '/dashboard/my-products' },
    { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: Users, label: 'Customers', path: '/dashboard/customers' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ]
  
  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: FileText, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ]
  
  const menuItems = user?.role === 'ADMIN' ? adminMenuItems : user?.role === 'VENDOR' ? vendorMenuItems : customerMenuItems
  
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Rental ERP</h1>
        <p className="text-sm text-gray-400 mt-1">
          {user?.role === 'ADMIN' ? 'Admin Portal' : user?.role === 'VENDOR' ? 'Vendor Portal' : 'Customer Portal'}
        </p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
