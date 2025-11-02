// src/App.jsx

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { useAuth } from './contexts/AuthContext';

import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { AdminRoute } from './components/features/Admin/AdminRoute.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
// --- ИЗМЕНЕНИЕ №1: Импортируем новую страницу ---
import { TelegramCallbackPage } from './pages/TelegramCallbackPage.jsx';
import OfferContractPage from './pages/legal/OfferContractPage.jsx';


function PrivateRoute({ children }) {
  const auth = useAuth();
  if (!auth) {
    return <Navigate to="/" />;
  }
  const { user } = auth;
  return user ? children : <Navigate to="/" />;
}


function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <ToastProvider>
      <ScrollToTop />
      <Header isAuthModalOpen={isAuthModalOpen} setIsAuthModalOpen={setIsAuthModalOpen} />
      <main>
        <Routes>
          {/* --- Публичный роут --- */}
          <Route path="/" element={<HomePage onAuthModalOpen={() => setIsAuthModalOpen(true)} />} />

          {/* --- Роуты для аутентификации --- */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* --- ИЗМЕНЕНИЕ №2: Добавляем роут для колбэка Telegram --- */}
          <Route path="/auth/telegram/callback" element={<TelegramCallbackPage />} />
          {/* --- Legal pages --- */}
          <Route path="/legal/oferta" element={<OfferContractPage />} />

          {/* --- Приватный роут (защищенный "охранником") --- */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          {/* --- Админский роут (защищенный AdminRoute) --- */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          {/* --- Запасной роут (если страница не найдена) --- */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </ToastProvider>
  );
}

export default App;
