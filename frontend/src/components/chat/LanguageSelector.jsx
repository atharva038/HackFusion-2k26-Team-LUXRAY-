import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../../store/useAppStore';

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
];

const LanguageSelector = () => {
    const { selectedLanguage, setSelectedLanguage } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const current = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        setSelectedLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer group shrink-0"
                title="Change Language"
            >
                <Globe className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium text-text-muted group-hover:text-text transition-colors hidden sm:inline">
                    {current.native}
                </span>
                <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 hidden xs:block ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-card border border-black/5 dark:border-white/5 shadow-lg overflow-hidden z-[100] backdrop-blur-xl"
                    >
                        <div className="py-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleSelect(lang.code)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${selectedLanguage === lang.code
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-text hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-base">{lang.flag}</span>
                                    <div className="flex-1 text-left">
                                        <span className="font-medium">{lang.native}</span>
                                        <span className="text-text-muted ml-1.5 text-xs">({lang.label})</span>
                                    </div>
                                    {selectedLanguage === lang.code && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSelector;
