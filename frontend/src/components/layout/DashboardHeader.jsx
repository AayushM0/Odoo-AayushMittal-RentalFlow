import { Menu, Bell, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const DashboardHeader = () => {
  const { user } = useAuth()
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex-1 max-w-xl mx-4">
          <input
            type="search"
            placeholder="Search..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg">
            <User className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium">{user?.name || 'User'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
