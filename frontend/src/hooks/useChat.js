import { useState, useCallback } from 'react';
import { chatAPI } from '../services/api';

/**
 * Custom hook for managing chat state and AI interactions.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text) => {
    const userMsg = { id: Date.now(), sender: 'user', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(text);
      const aiMsg = { id: Date.now() + 1, sender: 'ai', ...response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = { id: Date.now() + 1, sender: 'ai', text: `Error: ${err.message}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, sendMessage };
}
