import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './store/useAppStore';
import { useEffect } from 'react';
import ChatPage from './pages/chat/ChatPage';
import AdminLayout from './pages/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import Orders from './pages/admin/Orders';
import PrescriptionReview from './pages/admin/PrescriptionReview';
import Inventory from './pages/admin/Inventory';
import Alerts from './pages/admin/Alerts';
import Logs from './pages/admin/Logs';

function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    // Initial theme setup done via Zustand state but let's ensure body has right class on load
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <Routes>
        {/* Consumer Chat Route */}
        <Route path="/" element={<ChatPage />} />

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="prescriptions" element={<PrescriptionReview />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<div className="p-4">Settings Content</div>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
