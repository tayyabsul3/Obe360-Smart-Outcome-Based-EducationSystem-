import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global Fetch Interceptor for Multi-Tenant Data Isolation
const originalFetch = window.fetch;
window.fetch = async function (resource, options = {}) {
    const url = typeof resource === 'string' ? resource : resource?.url;
    if (url && (url.startsWith('/api/') || url.includes('/api/'))) {
        const adminId = localStorage.getItem('admin_id');
        if (adminId) {
            options.headers = options.headers || {};
            if (options.headers instanceof Headers) {
                options.headers.set('x-admin-id', adminId);
            } else if (typeof options.headers.set === 'function') {
                options.headers.set('x-admin-id', adminId);
            } else {
                options.headers['x-admin-id'] = adminId;
            }
        }
    }
    return originalFetch(resource, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
