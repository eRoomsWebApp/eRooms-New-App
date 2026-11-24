
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Pre-rendered SEO tags (see scripts/prerender-hostels.mjs) are replaced by the app's own Helmet tags.
document.querySelectorAll('[data-prerender]').forEach((el) => el.remove());

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
