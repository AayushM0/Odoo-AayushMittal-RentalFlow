import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

// Get user-specific cart key
const getCartKey = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return `rentalCart_${user.id}`; // User-specific cart key
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
    }
  }
  return 'rentalCart_guest'; // Fallback for guest users
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState(null);
  const [cartKey, setCartKey] = useState(getCartKey());

  // Update cart key when user changes (login/logout)
  useEffect(() => {
    const newCartKey = getCartKey();
    if (newCartKey !== cartKey) {
      setCartKey(newCartKey);
      // Load cart for new user
      const savedCart = localStorage.getItem(newCartKey);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
          console.log(cartItems)
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
          localStorage.removeItem(newCartKey);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      setQuotation(null);
    }
  }, [cartKey]);

  // Load cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem(cartKey);
      }
    }
  }, [cartKey]);

  // Save cart whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(cartKey);
    }
  }, [cartItems, cartKey]);

  const addToCart = (product, variant, rentalDates) => {
    const { startDate, endDate } = rentalDates;
    
    if (!startDate || !endDate) {
      throw new Error('Rental dates are required');
    }
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error('End date must be after start date');
    }

    const cartItem = {
      id: `${variant.id}-${startDate}-${endDate}`,
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || '/placeholder.jpg',
      variantId: variant.id,
      variantSku: variant.sku,
      variantAttributes: variant.attributes,
      quantity: 1,
      startDate,
      endDate,
      pricePerUnit: variant.price_daily || variant.price_hourly || 0,
      stockAvailable: variant.stock_quantity,
      vendorId: product.vendor_id
    };

    const existingIndex = cartItems.findIndex(item => item.id === cartItem.id);
    
    if (existingIndex >= 0) {
      const updatedCart = [...cartItems];
      updatedCart[existingIndex].quantity += 1;
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, cartItem]);
    }

    setQuotation(null);
  };

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    setQuotation(null);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        if (newQuantity > item.stockAvailable) {
          throw new Error(`Only ${item.stockAvailable} units available`);
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    setCartItems(updatedCart);
    setQuotation(null);
  };

  const updateRentalDates = (itemId, startDate, endDate) => {
    if (!startDate || !endDate) {
      throw new Error('Both dates are required');
    }
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error('End date must be after start date');
    }

    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        const newId = `${item.variantId}-${startDate}-${endDate}`;
        return {
          ...item,
          id: newId,
          startDate,
          endDate
        };
      }
      return item;
    });

    setCartItems(updatedCart);
    setQuotation(null);
  };

  const clearCart = () => {
    setCartItems([]);
    setQuotation(null);
    localStorage.removeItem(cartKey);
  };

  const getQuotation = async () => {
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    setLoading(true);
    try {
      const itemsByVendor = cartItems.reduce((acc, item) => {
        if (!acc[item.vendorId]) {
          acc[item.vendorId] = [];
        }
        acc[item.vendorId].push({
          variant_id: item.variantId,
          quantity: item.quantity,
          start_date: item.startDate,
          end_date: item.endDate
        });
        return acc;
      }, {});

      const quotationPromises = Object.entries(itemsByVendor).map(
        ([vendorId, items]) =>
          api.post('/quotations', {
            vendor_id: parseInt(vendorId),
            items
          })
      );

      const responses = await Promise.all(quotationPromises);
      const quotations = responses.map(res => res.data.data);

      const totalAmount = quotations.reduce(
        (sum, q) => sum + parseFloat(q.total_amount),
        0
      );

      const quotationData = {
        quotations,
        totalAmount: totalAmount.toFixed(2),
        itemCount: cartItems.length,
        vendorCount: Object.keys(itemsByVendor).length
      };

      setQuotation(quotationData);
      return quotationData;
    } catch (error) {
      console.error('Failed to get quotation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (variantId, startDate, endDate) => {
    const itemId = `${variantId}-${startDate}-${endDate}`;
    return cartItems.some(item => item.id === itemId);
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value = {
    cartItems,
    itemCount,
    loading,
    quotation,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateRentalDates,
    clearCart,
    getQuotation,
    isInCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
