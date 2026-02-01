// src/__tests__/testUtils.js
import { render } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';

// Custom render function that wraps components with necessary providers
const customRender = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };