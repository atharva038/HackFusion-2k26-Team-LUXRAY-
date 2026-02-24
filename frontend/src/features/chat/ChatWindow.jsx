import React from 'react';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import { ShieldCheck } from 'lucide-react';

const ChatWindow = () => {
  const messages = [
    {
      id: 1,
      sender: 'user',
      text: 'I need to refill my Amlodipine 5mg prescription.',
      timestamp: '10:15 AM'
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Checking inventory for Amlodipine 5mg...',
      timestamp: '10:15 AM',
      toolCall: {
        name: 'check_inventory',
        status: 'success',
        result: '20 units available'
      }
    },
    {
      id: 3,
      sender: 'ai',
      text: 'Good news. We have Amlodipine 5mg in stock. I will process your prescription refill now. Would you like to pick it up today?',
      timestamp: '10:16 AM'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-beige-50 dark:bg-dark-50 relative transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-beige-200 dark:border-dark-200 bg-beige-50 dark:bg-dark-50 sticky top-0 z-10 transition-colors duration-300">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-3 transition-colors duration-300">
          <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">AI Pharmacist</h2>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 mr-1.5 animate-pulse"></span>
            Online & Ready
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-beige-100/50 dark:bg-dark-100/50 transition-colors duration-300">
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium my-4">Today, 10:15 AM</div>
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input Area */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
