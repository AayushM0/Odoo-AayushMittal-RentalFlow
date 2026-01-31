import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar';
import FilterPanel from '../components/search/FilterPanel';
import ProductCard from '../components/products/ProductCard';
import api from '../services/api';

function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || null,
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    availability: searchParams.get('availability') || 'all',
    sort: searchParams.get('sort') || 'relevance',
    page: searchParams.get('page') || '1'
  });

  useEffect(() => {
    searchProducts();
  }, [filters]);

  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'relevance') params[key] = value;
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/search/products', { params: filters });
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, page: '1' });
  };

  const handleClearFilters = () => {
    setFilters({
      q: '',
      category: null,
      min_price: '',
      max_price: '',
      availability: 'all',
      sort: 'relevance',
      page: '1'
    });
  };

  const handleSearch = (query) => {
    setFilters({ ...filters, q: query, page: '1' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <SearchBar 
            placeholder="Search products..." 
            onSearch={handleSearch}
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {pagination && `${pagination.total} results found`}
              </p>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: '1' })}
                className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
                <option value="name_desc">Name: Z-A</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setFilters({ ...filters, page: page.toString() })}
                        className={`px-4 py-2 rounded ${
                          parseInt(filters.page) === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductSearch;
