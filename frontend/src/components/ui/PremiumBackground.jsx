import React from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';

const PremiumBackground = () => {
    const { theme } = useAppStore();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <div className={`fixed inset-0 w-full h-full z-[-50] overflow-hidden pointer-events-none transition-colors duration-700 ${isDark ? 'bg-[#0B1120]' : 'bg-slate-50'}`}>
            {/* Dynamic themed medical grid */}
            <div className={`absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-20 transition-colors duration-700
                ${isDark
                    ? 'bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]'
                    : 'bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)]'
                }`}
            />

            {/* Animated Glow Orbs - lighter in bright mode */}
            <motion.div
                animate={{
                    x: [0, 80, 0, -80, 0],
                    y: [0, 40, 80, 40, 0],
                    scale: [1, 1.1, 1, 0.9, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-700
                    ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-400/20'}`}
            />
            <motion.div
                animate={{
                    x: [0, -120, 0, 120, 0],
                    y: [0, 80, 0, -80, 0],
                    scale: [1, 1.3, 1, 1.1, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] transition-colors duration-700
                    ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-400/20'}`}
            />
            <motion.div
                animate={{
                    x: [0, 40, -40, 40, 0],
                    y: [0, -80, 40, 80, 0],
                    scale: [1, 0.9, 1.1, 0.9, 1]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className={`absolute top-[30%] left-[30%] w-[400px] h-[400px] rounded-full blur-[120px] transition-colors duration-700
                    ${isDark ? 'bg-blue-500/10' : 'bg-blue-400/20'}`}
            />
        </div>
    );
};

export default PremiumBackground;
