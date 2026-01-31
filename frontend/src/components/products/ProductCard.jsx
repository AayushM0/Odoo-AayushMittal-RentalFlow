function ProductCard({ product, onView }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {product.images && product.images[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400">No Image</span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.category}</p>
        {product.brand && (
          <p className="text-xs text-gray-500 mb-2">Brand: {product.brand}</p>
        )}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-blue-600">
            ₹{product.min_daily_price || 'N/A'}/day
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.total_stock !== undefined ? product.total_stock : 'N/A'}
          </span>
        </div>
        <button
          onClick={() => onView(product.id)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export default ProductCard
