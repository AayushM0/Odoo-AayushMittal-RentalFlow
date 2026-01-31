import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import SearchBar from '../../components/search/SearchBar';

vi.mock('../../services/api');

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeInTheDocument();
  });

  it('should update input value on change', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i);
    
    fireEvent.change(input, { target: { value: 'test query' } });
    
    expect(input.value).toBe('test query');
  });

  it('should call onSearch when form is submitted', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'laptop' } });
    fireEvent.submit(form);
    
    expect(mockOnSearch).toHaveBeenCalledWith('laptop');
  });

  it('should call onSearch when search button is clicked', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    const button = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(input, { target: { value: 'camera' } });
    fireEvent.click(button);
    
    expect(mockOnSearch).toHaveBeenCalledWith('camera');
  });

  it('should not call onSearch with empty query', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const button = screen.getByRole('button', { name: /search/i });
    fireEvent.click(button);
    
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should clear input when clear button is clicked', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i);
    
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    expect(input.value).toBe('');
  });

  it('should show placeholder text', () => {
    render(<SearchBar placeholder="Search products..." />);
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });
});
