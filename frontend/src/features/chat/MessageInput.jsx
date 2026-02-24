import React, { useState } from 'react';
import { Send } from 'lucide-react';
import VoiceButton from '../voice/VoiceButton';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <div className="p-4 border-t border-beige-200 dark:border-dark-200 bg-beige-50 dark:bg-dark-50 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)] z-10 transition-colors duration-300">

      {/* Transcript Preview */}
      {isRecording && (
        <div className="mb-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800 flex items-center animate-pulse transition-colors duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
          {transcriptPreview || "Listening..."}
        </div>
      )}

      <form onSubmit={handleSend} className="relative flex items-center">

        {/* Input Field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask the AI pharmacist..."
          className={`flex-1 bg-beige-100 dark:bg-dark-100 border border-beige-200 dark:border-dark-200 text-slate-800 dark:text-slate-100 text-sm rounded-full py-3.5 pl-5 pr-24 
            focus:outline-none focus:border-blue-300 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300
            ${isRecording ? 'opacity-50 pointer-events-none' : ''}`}
          disabled={isRecording}
        />

        {/* Action Buttons inside Input */}
        <div className="absolute right-1.5 flex items-center gap-1.5">
          <VoiceButton
            isRecording={isRecording}
            onChange={setIsRecording}
            onTranscriptUpdate={setTranscriptPreview}
          />

          <button
            type="submit"
            disabled={!message.trim() && !isRecording}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${message.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              : 'bg-beige-200 dark:bg-dark-200 text-slate-400 dark:text-slate-500'
              }`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
