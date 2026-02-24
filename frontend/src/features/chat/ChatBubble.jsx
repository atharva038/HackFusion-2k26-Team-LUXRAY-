import React from 'react';
import { User, Sparkles } from 'lucide-react';
import ToolStatus from './ToolStatus';

const ChatBubble = ({ message }) => {
  const isAI = message.sender === 'ai';

  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 transition-colors duration-300
          ${isAI ? 'bg-blue-600 dark:bg-blue-500 mr-3' : 'bg-beige-200 dark:bg-dark-200 ml-3'}`}>
          {isAI ? (
            <Sparkles className="w-4 h-4 text-white" />
          ) : (
            <User className="w-5 h-5 text-slate-500 dark:text-slate-300" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm transition-colors duration-300
            ${isAI
              ? 'bg-beige-50 dark:bg-dark-50 border border-beige-200 dark:border-dark-200 text-slate-700 dark:text-slate-200 rounded-tl-none'
              : 'bg-blue-600 dark:bg-blue-600 text-white rounded-tr-none'
            }`}
          >
            {message.text}
          </div>

          {/* Tool Execution Status */}
          {message.toolCall && (
            <div className="mt-2">
              <ToolStatus toolCall={message.toolCall} />
            </div>
          )}

          <span className={`text-[10px] text-slate-400 dark:text-slate-500 mt-1 ${isAI ? 'text-left' : 'text-right'}`}>
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
