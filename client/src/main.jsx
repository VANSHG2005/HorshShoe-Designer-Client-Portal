import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0e0e0e',
              color: '#e5e5e5',
              borderRadius: '14px',
              padding: '14px 18px',
              fontSize: '13px',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#0e0e0e',
              },
            },
            error: {
              iconTheme: {
                primary: '#e11d48',
                secondary: '#0e0e0e',
              },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
