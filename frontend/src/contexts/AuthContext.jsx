import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      
      if (token) {
        try {
          // Verify token and get user info
          const response = await api.get('/auth/me')
          setUser(response.data.data)
          setIsAuthenticated(true)
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          setUser(null)
          setIsAuthenticated(false)
        }
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, accessToken } = response.data.data
      
      // Store tokens (refreshToken is in httpOnly cookie)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('userRole', user.role)
      
      // Update state
      setUser(user)
      setIsAuthenticated(true)
      
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' }
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { user, accessToken } = response.data.data
      
      // Store tokens (refreshToken is in httpOnly cookie)
      localStorage.setItem('accessToken', accessToken)
      
      // Update state
      setUser(user)
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userRole')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
