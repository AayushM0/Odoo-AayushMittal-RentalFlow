import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { CartProvider } from '../../contexts/CartContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

const AllProviders = ({ children, authValue, cartValue, notificationValue }) => {
  return (
    <BrowserRouter>
      <AuthProvider value={authValue}>
        <NotificationProvider value={notificationValue}>
          <CartProvider value={cartValue}>
            {children}
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options = {}) => {
  const { authValue, cartValue, notificationValue, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: (props) => (
      <AllProviders 
        authValue={authValue}
        cartValue={cartValue}
        notificationValue={notificationValue}
        {...props}
      />
    ),
    ...renderOptions
  });
};

export * from '@testing-library/react';
export { customRender as render };
