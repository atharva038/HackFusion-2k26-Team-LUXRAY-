import { create } from 'zustand';

// Status tracking for AI State
export const AI_STATUS = {
  READY: 'READY',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING'
};

const useAppStore = create((set) => ({
  // Theme state: 'light', 'dark', or 'system'
  theme: localStorage.getItem('theme') || 'system',
  toggleTheme: () => set((state) => {
    let newTheme;
    if (state.theme === 'light') newTheme = 'dark';
    else if (state.theme === 'dark') newTheme = 'system';
    else newTheme = 'light';
    
    localStorage.setItem('theme', newTheme);
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  // AI State
  aiStatus: AI_STATUS.READY,
  setAiStatus: (status) => set({ aiStatus: status }),

  // Voice Subtitle State
  liveTranscript: '',
  setLiveTranscript: (text) => set({ liveTranscript: text }),
  activeSubtitle: '',
  setActiveSubtitle: (text) => set({ activeSubtitle: text }),

  // Live audio element for lip-sync (set by InputArea during TTS playback)
  currentAudioElement: null,
  setCurrentAudioElement: (el) => set({ currentAudioElement: el }),

  // Chat State
  currentSessionId: null,
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  
  chatSessions: [],
  setChatSessions: (sessions) => set({ chatSessions: sessions }),

  messages: [
    {
      id: 1,
      role: 'ai',
      text: 'Hello, I am your AI Pharmacy Assistant. How can I help you today? You can ask me to order medicines or setup a refill reminder.',
      tools: [],
    }
  ],
  setMessages: (msgs) => set({ messages: msgs, aiStatus: AI_STATUS.READY, isTyping: false }),
  isTyping: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setTyping: (isTyping) => set({ isTyping }),
  clearMessages: () => set({
    currentSessionId: null,
    aiStatus: AI_STATUS.READY,
    isTyping: false,
    messages: [{
      id: 1,
      role: 'ai',
      text: 'Hello, I am your AI Pharmacy Assistant. How can I help you today? You can ask me to order medicines or setup a refill reminder.',
      tools: [],
    }]
  }),
  
  // ── Reorder / prescription chat bridge ──────────────────────────
  // Any page can set this; InputArea reads it on mount, sends it, then clears it.
  pendingChatMessage: null,
  setPendingChatMessage: (msg) => set({ pendingChatMessage: msg }),
  clearPendingChatMessage: () => set({ pendingChatMessage: null }),

  pendingPrescription: null,
  setPendingPrescription: (data) => set({ pendingPrescription: data }),
  clearPendingPrescription: () => set({ pendingPrescription: null }),

  // ── Injectable Chat Actions for Deep Components ─────────────────
  chatActions: null,
  setChatActions: (actions) => set({ chatActions: actions }),

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
