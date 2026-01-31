import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/test-utils';
import ProductCard from '../../components/products/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    description: 'Test product description',
    category: 'Electronics',
    min_price: 100,
    max_price: 500,
    total_stock: 10,
    is_active: true,
    primary_image: 'https://example.com/image.jpg'
  };

  it('should render product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should render product description', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/Test product description/i)).toBeInTheDocument();
  });

  it('should display price range', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/₹100/)).toBeInTheDocument();
    expect(screen.getByText(/₹500/)).toBeInTheDocument();
  });

  it('should show category', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('should show "Out of Stock" when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, total_stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);
    expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
  });

  it('should show stock availability when in stock', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/10.*available/i)).toBeInTheDocument();
  });

  it('should render product image', () => {
    render(<ProductCard product={mockProduct} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockProduct.primary_image);
  });

  it('should have link to product detail page', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const link = container.querySelector(`a[href="/products/${mockProduct.id}"]`);
    expect(link).toBeInTheDocument();
  });
});
