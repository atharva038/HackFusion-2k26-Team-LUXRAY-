import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';

const STATUS_CONFIG = {
    [AI_STATUS.READY]: {
        label: 'AI Ready',
        dotColor: 'bg-green-400',
        glowColor: 'shadow-[0_0_60px_rgba(37,99,235,0.08)]',
        ringColor: 'border-primary/10',
    },
    [AI_STATUS.LISTENING]: {
        label: 'Listening…',
        dotColor: 'bg-blue-400 animate-pulse',
        glowColor: 'shadow-[0_0_80px_rgba(37,99,235,0.35)]',
        ringColor: 'border-primary/40',
    },
    [AI_STATUS.PROCESSING]: {
        label: 'Processing request…',
        dotColor: 'bg-purple-400 animate-bounce',
        glowColor: 'shadow-[0_0_70px_rgba(139,92,246,0.25)]',
        ringColor: 'border-purple-400/30',
    },
    [AI_STATUS.SPEAKING]: {
        label: 'Speaking…',
        dotColor: 'bg-teal-400 animate-pulse',
        glowColor: 'shadow-[0_0_80px_rgba(20,184,166,0.3)]',
        ringColor: 'border-teal-400/30',
    },
};

const AiAvatar = () => {
    const { aiStatus, liveTranscript, activeSubtitle } = useAppStore();
    const config = STATUS_CONFIG[aiStatus];

    const containerVariants = {
        [AI_STATUS.READY]: {
            scale: 1,
            transition: { duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
        },
        [AI_STATUS.LISTENING]: {
            scale: 1.04,
            transition: { duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
        },
        [AI_STATUS.PROCESSING]: {
            scale: [1, 1.02, 1],
            rotate: [0, 1, -1, 0],
            transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
        },
        [AI_STATUS.SPEAKING]: {
            scale: [1, 1.03, 1],
            transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
        }
    };

    const coreVariants = {
        [AI_STATUS.READY]: { opacity: 0.3, scale: 1 },
        [AI_STATUS.LISTENING]: { opacity: 0.7, scale: 1.15 },
        [AI_STATUS.PROCESSING]: { opacity: 0.5, scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity } },
        [AI_STATUS.SPEAKING]: { opacity: 0.8, scale: [1, 1.2, 1], transition: { duration: 0.6, repeat: Infinity } }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden select-none">

            {/* Ambient background glow */}
            <AnimatePresence>
                {aiStatus !== AI_STATUS.READY && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 bg-primary/5 dark:bg-primary/10 transition-colors duration-1000"
                    />
                )}
            </AnimatePresence>

            {/* Ripple rings for LISTENING */}
            {aiStatus === AI_STATUS.LISTENING && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {[0, 0.4, 0.8].map((delay, i) => (
                        <div
                            key={i}
                            className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-primary/30 animate-ripple"
                            style={{ animationDelay: `${delay}s` }}
                        />
                    ))}
                </div>
            )}

            {/* Orbiting ring for PROCESSING */}
            {aiStatus === AI_STATUS.PROCESSING && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="w-72 h-72 md:w-80 md:h-80 rounded-full animate-orbit">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
                    </div>
                </div>
            )}

            {/* Main Avatar Orb */}
            <motion.div
                variants={containerVariants}
                animate={aiStatus}
                className={`relative w-36 h-36 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full flex items-center justify-center z-10 transition-shadow duration-700 ${config.glowColor}`}
            >
                {/* Outer ring */}
                <div className={`absolute inset-0 rounded-full border-2 ${config.ringColor} transition-colors duration-500`} />

                {/* Inner glow */}
                <motion.div
                    variants={coreVariants}
                    animate={aiStatus}
                    className={`absolute inset-4 rounded-full blur-2xl z-0 transition-colors duration-500 ${aiStatus === AI_STATUS.PROCESSING ? 'bg-purple-500/30' :
                            aiStatus === AI_STATUS.SPEAKING ? 'bg-teal-500/30' :
                                aiStatus === AI_STATUS.LISTENING ? 'bg-primary/30' :
                                    'bg-primary/10'
                        }`}
                />

                {/* Avatar image */}
                <div className="relative w-28 h-28 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full overflow-hidden z-10 bg-card border border-white/20 dark:border-white/5 shadow-soft">
                    <img
                        src="/assets/ai_avatar_light.png"
                        alt="AI Assistant"
                        className="w-full h-full object-cover dark:hidden"
                    />
                    <img
                        src="/assets/ai_avatar_dark.png"
                        alt="AI Assistant"
                        className="w-full h-full object-cover hidden dark:block scale-110"
                    />

                    {/* Idle breathing overlay */}
                    {aiStatus === AI_STATUS.READY && (
                        <div className="absolute inset-0 rounded-full bg-primary/5 animate-breathe" />
                    )}
                </div>

                {/* Sound wave bars for SPEAKING */}
                {aiStatus === AI_STATUS.SPEAKING && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-1 z-20">
                        {[1, 2, 3, 4, 5, 4, 3].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-teal-400 dark:bg-teal-300 rounded-full shadow-[0_0_6px_rgba(45,212,191,0.6)]"
                                style={{
                                    animation: `soundbar ${0.3 + Math.random() * 0.3}s ease-in-out infinite`,
                                    animationDelay: `${i * 0.06}s`,
                                    height: '4px',
                                }}
                            />
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Status Indicator Chip */}
            <motion.div
                key={aiStatus}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 md:mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-black/5 dark:border-white/5 shadow-sm z-10"
            >
                <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className="text-sm font-medium text-text-muted">{config.label}</span>
            </motion.div>

            {/* ─── SUBTITLE AREA ─────────────────────────────────── */}
            <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center px-4 z-20">
                <AnimatePresence mode="wait">
                    {/* User live transcript subtitle */}
                    {aiStatus === AI_STATUS.LISTENING && liveTranscript && (
                        <motion.div
                            key="user-transcript"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="px-5 py-3 rounded-2xl bg-black/50 dark:bg-black/70 backdrop-blur-md text-white text-sm max-w-[90%] text-center"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                                <span className="leading-relaxed">🎤 {liveTranscript}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* AI speaking subtitle */}
                    {aiStatus === AI_STATUS.SPEAKING && activeSubtitle && (
                        <motion.div
                            key="ai-subtitle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="px-5 py-3 rounded-2xl bg-teal-900/70 dark:bg-teal-950/80 backdrop-blur-md text-teal-50 text-sm max-w-[90%] text-center"
                        >
                            <div className="flex items-start justify-center gap-2">
                                <span className="w-2 h-2 mt-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
                                <span className="leading-relaxed">🤖 {activeSubtitle}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Listening idle prompt */}
                    {aiStatus === AI_STATUS.LISTENING && !liveTranscript && (
                        <motion.div
                            key="listening-idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="px-5 py-3 rounded-2xl bg-black/40 dark:bg-black/60 backdrop-blur-md text-white/80 text-sm text-center"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Speak now…
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AiAvatar;
