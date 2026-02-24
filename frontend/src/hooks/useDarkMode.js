import { useState, useEffect } from 'react';

/**
 * Custom hook for dark mode toggle with localStorage persistence.
 */
export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggle = () => setDarkMode(prev => !prev);

  return { darkMode, toggle };
}
