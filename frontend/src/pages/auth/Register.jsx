import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
    phone: '',
    company: '',
    category: '',
    gstin: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value }
    setFormData(newFormData)
    console.log('Form data updated:', newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registrationData } = formData

    setLoading(true)
    const result = await register(registrationData)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Background Split */}
      <div className="absolute inset-0 z-0 flex">
        <div className="w-1/2 bg-white h-full" />
        <div className="w-1/2 bg-blue-600 h-full" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        
        {/* Platform Name */}
        <div className="text-center mb-2">
          <span className="text-2xl font-bold text-black">Rental ERP</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-black">
            Sign In
          </h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            {/* Input Fields */}
            
            {/* Name */}
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Full Name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Email ID"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="sr-only">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                pattern="[6-9][0-9]{9}"
                required
                value={formData.phone}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Phone"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>

             {/* Role Selection - Kept for logic */}
            <div>
               <label htmlFor="role" className="sr-only">Role</label>
               <select
                 id="role"
                 name="role"
                 value={formData.role}
                 onChange={handleChange}
                 className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
               >
                 <option value="CUSTOMER">Customer</option>
                 <option value="VENDOR">Vendor</option>
               </select>
            </div>

            {/* Vendor Specific Inputs */}
            {formData.role === 'VENDOR' && (
              <>
                <div>
                  <label htmlFor="company" className="sr-only">Company Name</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="sr-only">Business Category</label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select Business Category</option>
                    <option value="Electronics">Electronics & Cameras</option>
                    <option value="Furniture">Furniture & Home</option>
                    <option value="Vehicles">Vehicles & Transport</option>
                    <option value="Equipment">Equipment & Machinery</option>
                    <option value="Events">Events & Party Supplies</option>
                    <option value="Sports">Sports & Outdoor</option>
                    <option value="Fashion">Fashion & Accessories</option>
                    <option value="Books">Books & Media</option>
                    <option value="Tools">Tools & Hardware</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gstin" className="sr-only">GSTIN</label>
                  <input
                    id="gstin"
                    name="gstin"
                    type="text"
                    pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                    value={formData.gstin}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="GSTIN (Optional)"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>

          <div className="text-center mt-4 space-y-3">
             {/* Vendor Link */}
            {/* <div>
              <a href="#" className="text-black hover:underline text-sm font-medium">
                Become a vendor
              </a>
            </div> */}
             {/* Login Link - Preserved */}
            {/* <div>
                <Link to="/login" className="text-indigo-600 hover:text-indigo-500 text-sm">
                  Already have an account? Sign in
                </Link>
            </div> */}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
