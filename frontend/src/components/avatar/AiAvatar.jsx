import React from 'react';
import { motion } from 'framer-motion';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';

const AiAvatar = () => {
    const { aiStatus } = useAppStore();

    // Animation variants based on AI_STATUS
    const containerVariants = {
        [AI_STATUS.READY]: {
            scale: 1,
            boxShadow: '0px 0px 20px rgba(37, 99, 235, 0.1)',
            transition: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
        },
        [AI_STATUS.LISTENING]: {
            scale: 1.05,
            boxShadow: '0px 0px 40px rgba(8, 41, 112, 0.4)',
            transition: { duration: 1, repeat: Infinity, repeatType: 'reverse' }
        },
        [AI_STATUS.PROCESSING]: {
            scale: [1, 1.02, 1],
            rotate: [0, 2, -2, 0],
            boxShadow: '0px 0px 30px rgba(139, 92, 246, 0.3)',
            transition: { duration: 0.8, repeat: Infinity }
        },
        [AI_STATUS.SPEAKING]: {
            scale: [1, 1.02, 1],
            boxShadow: '0px 0px 35px rgba(20, 184, 166, 0.4)',
            transition: { duration: 0.5, repeat: Infinity }
        }
    };

    const coreVariants = {
        [AI_STATUS.READY]: { opacity: 0.6, scale: 1 },
        [AI_STATUS.LISTENING]: { opacity: 0.9, scale: 1.2 },
        [AI_STATUS.PROCESSING]: { opacity: 0.7, scale: [1, 1.2, 1], transition: { duration: 0.8, repeat: Infinity } },
        [AI_STATUS.SPEAKING]: { opacity: 1, scale: [1, 1.3, 1], transition: { duration: 0.3, repeat: Infinity } }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">

            {/* Background ambient glow when active */}
            {aiStatus !== AI_STATUS.READY && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-primary/5 dark:bg-primary/10 backdrop-blur-[2px] transition-opacity duration-1000"
                />
            )}

            {/* Main Avatar Container */}
            <motion.div
                variants={containerVariants}
                animate={aiStatus}
                className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-card dark:bg-card flex items-center justify-center border border-white/20 dark:border-white/5 z-10 shadow-soft"
            >
                {/* Avatar Image container with dynamic source based on theme */}
                <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center overflow-hidden rounded-full">

                    {/* Glowing underlay for SPEAKING state */}
                    <motion.div
                        variants={coreVariants}
                        animate={aiStatus}
                        className={`absolute inset-0 rounded-full blur-xl z-0 ${aiStatus === AI_STATUS.PROCESSING ? 'bg-purple-500/40' :
                            aiStatus === AI_STATUS.SPEAKING ? 'bg-teal-500/40' :
                                'bg-primary/20'
                            }`}
                    />

                    {/* Actual generated 3D rendered avatar */}
                    <img
                        src="/assets/ai_avatar_light.png"
                        alt="AI Assistant Light Mode"
                        className="w-full h-full object-cover dark:hidden relative z-10"
                    />
                    <img
                        src="/assets/ai_avatar_dark.png"
                        alt="AI Assistant Dark Mode"
                        className="w-full h-full object-cover hidden dark:block relative z-10 scale-110"
                    />

                    {/* Simple subtle Mouth/Waveform overlay for speaking */}
                    {aiStatus === AI_STATUS.SPEAKING && (
                        <div className="absolute bottom-1/5 left-0 right-0 flex items-center justify-center gap-1 z-20 mix-blend-screen opacity-80">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [4, 12 + Math.random() * 10, 4] }}
                                    transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.05 }}
                                    className="w-1.5 bg-teal-300 dark:bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                                />
                            ))}
                        </div>
                    )}

                </div>
            </motion.div>

            {/* Transcript preview when listening */}
            {aiStatus === AI_STATUS.LISTENING && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-12 px-6 py-3 rounded-2xl bg-black/40 dark:bg-black/60 backdrop-blur-md text-white/90 text-sm max-w-[80%] text-center z-20"
                >
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Listening to you...
                    </span>
                </motion.div>
            )}

        </div>
    );
};

export default AiAvatar;
