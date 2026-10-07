import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './auth/AuthContext';

// Global error handlers to prevent unhandled exceptions from destroying the UI
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[GlobalErrorHandler] Uncaught window error:', { message, source, lineno, colno, error });
  // Prevent default browser crashing behavior
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('[GlobalErrorHandler] Unhandled Promise Rejection:', event.reason);
  // Prevent rejection from causing unhandled crash
  event.preventDefault();
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
