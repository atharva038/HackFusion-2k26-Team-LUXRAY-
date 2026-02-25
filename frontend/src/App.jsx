import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAppStore from './store/useAppStore';
import useAuthStore from './store/useAuthStore';

// Pages
import ChatPage from './pages/chat/ChatPage';
import AdminLayout from './pages/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import Orders from './pages/admin/Orders';
import PrescriptionReview from './pages/admin/PrescriptionReview';
import Inventory from './pages/admin/Inventory';
import Alerts from './pages/admin/Alerts';
import Logs from './pages/admin/Logs';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Auth Guard
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { theme } = useAppStore();
  const { hydrate } = useAuthStore();

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;

      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // system mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listen for OS scheme changes while in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);

  }, [theme]);

  // Restore session from stored JWT on app load
  useEffect(() => { hydrate(); }, []);

  return (
    <Router>
      <Routes>
        {/* Auth Routes (public) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Chat Route (protected) */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'pharmacist']}>
            <ChatPage />
          </ProtectedRoute>
        } />

        {/* Admin Dashboard Routes (pharmacist/admin only) */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="prescriptions" element={<PrescriptionReview />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<div className="p-4 text-text">Settings Content</div>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
