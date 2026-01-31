import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, Calendar } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

function Cart() {
  const navigate = useNavigate()
  const {
    cartItems,
    itemCount,
    loading,
    quotation,
    removeFromCart,
    updateQuantity,
    clearCart,
    getQuotation
  } = useCart()

  const [gettingQuote, setGettingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState(null)

  const handleGetQuotation = async () => {
    setGettingQuote(true)
    setQuoteError(null)
    try {
      await getQuotation()
    } catch (error) {
      setQuoteError(error.response?.data?.message || 'Failed to get quotation')
    } finally {
      setGettingQuote(false)
    }
  }

  const handleCheckout = () => {
    if (!quotation) {
      alert('Please get a quotation first')
      return
    }
    navigate('/checkout')
  }

  const handleQuantityChange = (itemId, newQty) => {
    try {
      updateQuantity(itemId, parseInt(newQty))
    } catch (error) {
      alert(error.message)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">
          Browse our products and add items to get started
        </p>
        <Link
          to="/products"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div
              key={item.id}
              className="bg-white border rounded-lg p-4 flex gap-4"
            >
              <img
                src={item.productImage}
                alt={item.productName}
                className="w-24 h-24 object-cover rounded"
              />
              
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{item.productName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  SKU: {item.variantSku}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(item.startDate).toLocaleDateString()} -{' '}
                    {new Date(item.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Qty:</label>
                  <select
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="px-2 py-1 border rounded"
                  >
                    {[...Array(Math.min(item.stockAvailable, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-lg font-bold">
                  ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendors:</span>
                <span className="font-medium">
                  {new Set(cartItems.map(item => item.vendorId)).size}
                </span>
              </div>
            </div>
            
            {quotation && (
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{quotation.totalAmount}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Including GST and all charges
                </p>
              </div>
            )}
            
            {quoteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
                {quoteError}
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={handleGetQuotation}
                disabled={gettingQuote}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {gettingQuote ? 'Calculating...' : 'Get Quotation'}
              </button>
              <button
                onClick={handleCheckout}
                disabled={!quotation || loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
            </div>
            
            <Link
              to="/products"
              className="block text-center text-blue-600 hover:text-blue-700 mt-4 text-sm"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
