import React from 'react';
import { Moon, Sun, Activity, Phone, Stethoscope } from 'lucide-react';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';

const AiStatusIndicator = () => {
    const aiStatus = useAppStore(state => state.aiStatus);

    let statusConfig = { text: 'Ready', color: 'bg-medical-success', dot: 'bg-green-500' };
    switch (aiStatus) {
        case AI_STATUS.LISTENING:
            statusConfig = { text: 'Listening', color: 'bg-blue-500', dot: 'bg-blue-400 animate-pulse' };
            break;
        case AI_STATUS.PROCESSING:
            statusConfig = { text: 'Processing', color: 'bg-purple-500', dot: 'bg-purple-400 animate-bounce' };
            break;
        case AI_STATUS.SPEAKING:
            statusConfig = { text: 'Speaking', color: 'bg-teal-500', dot: 'bg-teal-400 animate-pulse' };
            break;
        default:
            statusConfig = { text: 'AI Ready', color: 'bg-green-500', dot: 'bg-green-400' };
            break;
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 mx-auto">
            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
            <span className="text-xs font-medium opacity-80">{statusConfig.text}</span>
        </div>
    );
};

const Header = () => {
    const { theme, toggleTheme } = useAppStore();

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-glass backdrop-blur-md border-b border-black/5 dark:border-white/5 z-50 sticky top-0 transition-colors duration-500">

            {/* Logo Area */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft">
                    <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="font-semibold text-lg leading-tight tracking-tight">Cura AI</h1>
                    <p className="text-xs text-text-muted">Autonomous Pharmacy Assistant</p>
                </div>
            </div>

            {/* AI Status (Centered if space permits, hidden on very small screens) */}
            <div className="hidden md:flex flex-1 justify-center">
                <AiStatusIndicator />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full bg-card hover:scale-105 transition-transform shadow-soft flex items-center justify-center text-text-muted hover:text-text cursor-pointer"
                    aria-label="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>

        </header>
    );
};

export default Header;
