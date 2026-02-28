import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import { useAudioAmplitude } from '../../hooks/useAudioAmplitude';
import { BrainCircuit } from 'lucide-react';

const STATUS_CONFIG = {
    [AI_STATUS.READY]: { label: 'AI Ready', color: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
    [AI_STATUS.LISTENING]: { label: 'Listening...', color: 'bg-blue-500', glow: 'shadow-blue-500/50' },
    [AI_STATUS.PROCESSING]: { label: 'Processing...', color: 'bg-purple-500', glow: 'shadow-purple-500/50' },
    [AI_STATUS.SPEAKING]: { label: 'Speaking...', color: 'bg-indigo-500', glow: 'shadow-indigo-500/50' },
};

const AiAvatar = () => {
    const { aiStatus, currentAudioElement, liveTranscript, activeSubtitle } = useAppStore();
    const config = STATUS_CONFIG[aiStatus];
    const isSpeaking = aiStatus === AI_STATUS.SPEAKING;
    const isListening = aiStatus === AI_STATUS.LISTENING;

    // Amplitude for visualizer
    const rawAmplitude = useAudioAmplitude(currentAudioElement);
    const amplitude = rawAmplitude > 0.05 ? Math.min((rawAmplitude - 0.05) / 0.95, 1) : 0;

    // Scale orb based on amplitude if speaking
    const scale = isSpeaking ? 1 + (amplitude * 0.3) : isListening ? 1.05 : 1;

    // Subtitle delay logic matching InputArea text
    const [displayedSubtitle, setDisplayedSubtitle] = useState('');
    const subtitleTimerRef = useRef(null);
    useEffect(() => {
        clearTimeout(subtitleTimerRef.current);
        subtitleTimerRef.current = setTimeout(() => {
            if (activeSubtitle && isSpeaking) {
                setDisplayedSubtitle(activeSubtitle);
            } else {
                setDisplayedSubtitle('');
            }
        }, 0);
        return () => clearTimeout(subtitleTimerRef.current);
    }, [activeSubtitle, isSpeaking]);

    return (
        <div className="flex flex-col items-center justify-center gap-3 w-full py-4 z-20">
            <div className="flex items-center gap-4 py-2 px-6 rounded-full bg-card/80 border border-black/5 dark:border-white/5 backdrop-blur-md shadow-sm transition-all duration-500">

                {/* Minimal Orb */}
                <div className="relative flex items-center justify-center w-10 h-10">
                    {/* Outer Glow Ring */}
                    <motion.div
                        animate={{ scale }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`absolute inset-0 rounded-full blur-md opacity-40 transition-colors duration-500 ${config.color}`}
                    />

                    {/* Core Orb */}
                    <div className={`relative z-10 w-full h-full rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 ${config.color}`}>
                        {aiStatus === AI_STATUS.PROCESSING ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white/90 rounded-full animate-spin" />
                        ) : (
                            <BrainCircuit className="w-5 h-5 text-white/90" />
                        )}
                    </div>

                    {/* Listening Ripples */}
                    <AnimatePresence>
                        {isListening && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 0.5 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                                className={`absolute inset-0 rounded-full border-2 border-blue-400 z-0`}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Status Text */}
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-text tracking-wide">{config.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Auto-pilot active</span>
                </div>
            </div>

            {/* Floating Subtitle / Transcript */}
            <div className="absolute top-20 max-w-md w-full px-4 pointer-events-none flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {displayedSubtitle && (
                        <motion.div
                            key={displayedSubtitle}
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, filter: 'blur(4px)' }}
                            transition={{ duration: 0.3 }}
                            className="bg-black/80 dark:bg-black/90 text-white/95 px-5 py-3 rounded-2xl w-full text-center font-medium shadow-lg border border-white/10"
                        >
                            <p className="text-[14px] leading-snug drop-shadow-md">
                                {displayedSubtitle}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isListening && liveTranscript && !displayedSubtitle && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-black/40 backdrop-blur-md text-white/80 px-4 py-2 mt-2 rounded-xl text-sm italic w-full text-center border border-white/5"
                        >
                            {liveTranscript}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AiAvatar;
