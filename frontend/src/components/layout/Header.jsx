import React from 'react';
import { Stethoscope, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSelector from '../chat/LanguageSelector';
import UserDropdown from '../shared/UserDropdown';

const Header = ({ onOpenAllergies, onToggleSidebar }) => {
    return (
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-glass backdrop-blur-md border-b border-black/5 dark:border-white/5 z-50 sticky top-0 transition-colors duration-500">
            <div className="flex items-center gap-3">
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text"
                        aria-label="Toggle Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
                <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-soft shrink-0 overflow-hidden border border-black/5 dark:border-white/5">
                        <img src="/logo.png" alt="MediSage Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg leading-tight tracking-tight text-text">MediSage</h1>
                        <p className="text-[10px] sm:text-xs text-text-muted hidden sm:block">Autonomous Pharmacy Assistant</p>
                    </div>
                </Link>
            </div>

            {/* AI Status / Active State (Center - Optional) */}
            <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 opacity-60 pointer-events-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium tracking-widest uppercase text-text-muted">System Active</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSelector />
                <UserDropdown onOpenAllergies={onOpenAllergies} />
            </div>
        </header>
    );
};

export default Header;

