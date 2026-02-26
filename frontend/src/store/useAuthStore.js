import { create } from 'zustand';
import { loginUser, registerUser, fetchCurrentUser } from '../services/api';

// Roles that belong to the admin dashboard
export const STAFF_ROLES = ['admin', 'pharmacist'];

/** Returns the correct home route for a given role */
export const roleHome = (role) => STAFF_ROLES.includes(role) ? '/admin' : '/';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('pharmacy_token') || null,
  isLoading: false,
  error: null,

  // Hydrate user from stored token on app load
  hydrate: async () => {
    const token = localStorage.getItem('pharmacy_token');
    if (!token) return;
    try {
      const data = await fetchCurrentUser();
      set({ user: data.user });
    } catch {
      localStorage.removeItem('pharmacy_token');
      set({ token: null, user: null });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('pharmacy_token', data.token);
      set({ token: data.token, user: data.user, isLoading: false });
      return data.user.role;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return null;
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerUser(formData);
      localStorage.setItem('pharmacy_token', data.token);
      set({ token: data.token, user: data.user, isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('pharmacy_token');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
