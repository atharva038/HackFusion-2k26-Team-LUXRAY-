import React, { useEffect, useState } from 'react';
import { Mic, Square } from 'lucide-react';

const VoiceButton = ({ isRecording, onChange, onTranscriptUpdate }) => {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setPulseScale(prev => prev === 1 ? 1.2 : 1);
        setTimeout(() => onTranscriptUpdate("I need a refill for..."), 1500);
        setTimeout(() => onTranscriptUpdate("I need a refill for Amlodipine 5mg"), 3000);
      }, 600);
    } else {
      setPulseScale(1);
      onTranscriptUpdate("");
    }
    return () => clearInterval(interval);
  }, [isRecording, onTranscriptUpdate]);

  const toggleRecording = (e) => {
    e.preventDefault();
    onChange(!isRecording);
  };

  return (
    <button
      onClick={toggleRecording}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isRecording
          ? 'bg-red-50 dark:bg-red-900/30 text-red-500 border border-red-200 dark:border-red-800 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
          : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-beige-200 dark:hover:bg-dark-200'
        }`}
    >
      {isRecording && (
        <span
          className="absolute inset-0 rounded-full bg-red-400 dark:bg-red-500 opacity-20 transition-transform duration-500 ease-in-out"
          style={{ transform: `scale(${pulseScale})` }}
        ></span>
      )}

      {isRecording ? (
        <Square className="w-4 h-4 fill-current z-10" />
      ) : (
        <Mic className="w-5 h-5 z-10" />
      )}
    </button>
  );
};

export default VoiceButton;
