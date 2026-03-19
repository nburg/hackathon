import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/entrypoints/styles/global.css';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
