import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of the default @testing-library/react render
 */
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options = {}) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

// Override the default render with our custom render
export { customRender as render };

/**
 * Mock localStorage for tests
 */
export const mockLocalStorage = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

/**
 * Setup localStorage mock before each test
 */
export const setupLocalStorageMock = () => {
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
  });
};
