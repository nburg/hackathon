import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/entrypoints/styles/global.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
