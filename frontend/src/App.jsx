import React, { useEffect } from 'react';
import useAppStore from './store/useAppStore';
import Header from './components/layout/Header';
import AiAvatar from './components/avatar/AiAvatar';
import ChatArea from './components/chat/ChatArea';

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
    <div className="flex flex-col h-screen w-full overflow-hidden bg-bg text-text transition-colors duration-500">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto overflow-hidden relative">
        {/* Left Side: Avatar Panel */}
        <section className="w-full md:w-1/3 lg:w-2/5 md:h-full flex-shrink-0 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 shrink-0 transition-colors duration-500 bg-black/5 dark:bg-black/20">
          <AiAvatar />
        </section>

        {/* Right Side: Chat Panel */}
        <section className="w-full md:flex-1 h-full flex flex-col relative bg-bg transition-colors duration-500">
          <ChatArea />
        </section>
      </main>
    </div>
  );
}

export default App;
