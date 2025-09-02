// frontend/src/main.jsx

import React from 'react'; // Убедимся, что React импортирован
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx'; // 👈 1. Импортируем наш провайдер

// 2. Устанавливаем react-router-dom, если еще не установлен
// В терминале: npm install react-router-dom

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

