import { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';

function FilterPanel({ filters, onFilterChange, onClearFilters }) {
  const [categories, setCategories] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    availability: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/search/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(v => 
    v !== null && v !== undefined && v !== '' && v !== 'all' && v !== 'relevance'
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-bold text-lg">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between mb-3"
        >
          <span className="font-medium">Category</span>
          {expandedSections.category ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {expandedSections.category && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => handleFilterChange('category', null)}
                className="w-4 h-4"
              />
              <span className="text-sm">All Categories</span>
            </label>
            {categories.map((cat) => (
              <label key={cat.category} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat.category}
                  onChange={() => handleFilterChange('category', cat.category)}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  {cat.category} ({cat.count})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-3"
        >
          <span className="font-medium">Price Range</span>
          {expandedSections.price ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Min Price</label>
              <input
                type="number"
                value={filters.min_price || ''}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                placeholder="₹0"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Max Price</label>
              <input
                type="number"
                value={filters.max_price || ''}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                placeholder="₹10000"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={() => toggleSection('availability')}
          className="w-full flex items-center justify-between mb-3"
        >
          <span className="font-medium">Availability</span>
          {expandedSections.availability ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {expandedSections.availability && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability"
                checked={filters.availability === 'all'}
                onChange={() => handleFilterChange('availability', 'all')}
                className="w-4 h-4"
              />
              <span className="text-sm">All Products</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability"
                checked={filters.availability === 'available'}
                onChange={() => handleFilterChange('availability', 'available')}
                className="w-4 h-4"
              />
              <span className="text-sm">In Stock Only</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterPanel;
