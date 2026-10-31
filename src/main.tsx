import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

const tree = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

const root = document.getElementById('root')!;
// Public pages ship prerendered HTML (scripts/prerender.mjs): attach to it instead of replacing it, so nothing flashes.
// Every other route is the plain client-rendered app.
if (root.hasAttribute('data-prerendered')) ReactDOM.hydrateRoot(root, tree);
else ReactDOM.createRoot(root).render(tree);
