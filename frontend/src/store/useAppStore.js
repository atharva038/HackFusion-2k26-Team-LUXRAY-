import { create } from 'zustand';

// Status tracking for AI State
export const AI_STATUS = {
  READY: 'READY',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING'
};

const useAppStore = create((set) => ({
  // Theme state
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  // AI State
  aiStatus: AI_STATUS.READY,
  setAiStatus: (status) => set({ aiStatus: status }),

  // Chat State
  messages: [
    {
      id: 1,
      role: 'ai',
      text: 'Hello, I am your AI Pharmacy Assistant. How can I help you today? You can ask me to order medicines or setup a refill reminder.',
      tools: [],
    }
  ],
  isTyping: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setTyping: (isTyping) => set({ isTyping }),
  
  // Example complex tool addition for the LAST AI message
  updateLastAiMessageTool: (toolUpdate) => set((state) => {
    const newMessages = [...state.messages];
    const lastAiIndex = newMessages.findLastIndex(m => m.role === 'ai');
    if (lastAiIndex >= 0) {
      newMessages[lastAiIndex].tools = [...(newMessages[lastAiIndex].tools || []), toolUpdate];
    }
    return { messages: newMessages };
  }),
}));

export default useAppStore;
