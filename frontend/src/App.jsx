import React, { useState, useEffect } from 'react';
import ChatWindow from './features/chat/ChatWindow';
import AdminPanel from './features/admin/AdminPanel';
import { Moon, Sun } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-beige-100 dark:bg-dark-100 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-beige-200 dark:bg-dark-200 text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform shadow-sm flex items-center justify-center"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Left Panel: Chat Interface */}
      <div className="w-full md:w-1/2 lg:w-5/12 h-full flex flex-col border-r border-beige-200 dark:border-dark-200 bg-beige-50 dark:bg-dark-50 transition-colors duration-300">
        <ChatWindow />
      </div>

      {/* Right Panel: Admin / Live Status */}
      <div className="hidden md:flex flex-1 h-full flex-col bg-beige-100 dark:bg-dark-100 transition-colors duration-300">
        <AdminPanel />
      </div>
    </div>
  );
}

export default App;
