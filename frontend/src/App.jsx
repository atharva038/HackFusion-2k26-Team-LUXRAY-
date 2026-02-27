import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAppStore from './store/useAppStore';
import useAuthStore from './store/useAuthStore';
import AllergySetupModal from './components/ui/AllergySetupModal';
import { fetchUserAllergies } from './services/api';

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

// User Pages
import MyOrders from './pages/user/MyOrders';
import MyPrescriptions from './pages/user/MyPrescriptions';

// Auth Guard
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { theme } = useAppStore();
  const { hydrate } = useAuthStore();
  const { user } = useAuthStore();

  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [isFirstTimeAllergy, setIsFirstTimeAllergy] = useState(false);

  // Auto-open allergy modal for customers who haven't set allergies yet
  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    fetchUserAllergies()
      .then(res => {
        if (!res.allergies || res.allergies.length === 0) {
          setIsFirstTimeAllergy(true);
          setAllergyModalOpen(true);
        }
      })
      .catch(() => {}); // silently ignore
  }, [user?.id]);

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
      {/* Allergy Setup Modal (global, accessible from Header) */}
      <AllergySetupModal
        isOpen={allergyModalOpen}
        onClose={() => { setAllergyModalOpen(false); setIsFirstTimeAllergy(false); }}
        isFirstTime={isFirstTimeAllergy}
      />

      <Routes>
        {/* Auth Routes (public) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Chat Route (protected) */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'pharmacist']}>
            <ChatPage onOpenAllergies={() => { setIsFirstTimeAllergy(false); setAllergyModalOpen(true); }} />
          </ProtectedRoute>
        } />

        {/* User: My Orders (customer only) */}
        <Route path="/my-orders" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyOrders />
          </ProtectedRoute>
        } />

        {/* User: My Prescriptions (customer only) */}
        <Route path="/my-prescriptions" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyPrescriptions />
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
