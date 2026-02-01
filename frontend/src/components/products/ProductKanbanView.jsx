import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ProductKanbanView = ({ products }) => {
  const navigate = useNavigate()

  const columns = [
    { id: 'available', title: 'Available', status: 'available' },
    { id: 'low_stock', title: 'Low Stock', status: 'low_stock' },
    { id: 'out_of_stock', title: 'Out of Stock', status: 'out_of_stock' },
    { id: 'unavailable', title: 'Unavailable', status: 'unavailable' }
  ]

  const getProductsByStatus = (status) => {
    if (!products || products.length === 0) return []

    return products.filter(product => {
      const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0
      
      if (status === 'unavailable') {
        return product.status === 'unavailable'
      } else if (status === 'out_of_stock') {
        return product.status === 'available' && totalStock === 0
      } else if (status === 'low_stock') {
        return product.status === 'available' && totalStock > 0 && totalStock <= 10
      } else if (status === 'available') {
        return product.status === 'available' && totalStock > 10
      }
      return false
    })
  }

  const handleCardClick = (productId) => {
    navigate(`/products/${productId}`)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => {
        const columnProducts = getProductsByStatus(column.status)
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                  {columnProducts.length}
                </span>
              </div>
              
              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {columnProducts.map(product => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0
                  const minPrice = product.variants?.length > 0
                    ? Math.min(...product.variants.map(v => parseFloat(v.price_per_day || 0)))
                    : 0

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleCardClick(product.id)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600 font-semibold">
                          ₹{minPrice}/day
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          totalStock > 10 ? 'bg-green-100 text-green-800' :
                          totalStock > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Stock: {totalStock}
                        </span>
                      </div>
                      
                      {product.category && (
                        <div className="mt-2">
                          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {product.category}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {columnProducts.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No products
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ProductKanbanView
