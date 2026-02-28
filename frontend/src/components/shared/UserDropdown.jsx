import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ShoppingBag, FileText, Monitor, ShieldAlert, ChevronDown, Moon, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore, { STAFF_ROLES } from '../../store/useAuthStore';
import useAppStore from '../../store/useAppStore';

const UserDropdown = ({ onOpenAllergies }) => {
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const isAdmin = STAFF_ROLES.includes(user.role);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-card border border-black/5 dark:border-white/5 hover:border-primary/30 transition-colors shadow-sm focus:outline-none"
            >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-text truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card/95 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 backdrop-blur-md">
                        <p className="text-sm font-bold text-text truncate">{user.name}</p>
                        <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>

                    <div className="p-2 space-y-1">
                        {!isAdmin && (
                            <>
                                <Link onClick={() => setIsOpen(false)} to="/my-orders" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <ShoppingBag className="w-4 h-4" /> My Orders
                                </Link>
                                <Link onClick={() => setIsOpen(false)} to="/my-prescriptions" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <FileText className="w-4 h-4" /> Prescriptions
                                </Link>
                                <button onClick={() => { setIsOpen(false); onOpenAllergies?.(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <ShieldAlert className="w-4 h-4" /> Allergies
                                </button>
                            </>
                        )}

                        <Link onClick={() => setIsOpen(false)} to="/traces" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <Monitor className="w-4 h-4" /> Agent Traces
                        </Link>

                        <div className="h-px bg-black/5 dark:bg-white/5 my-1" />

                        <button onClick={() => { toggleTheme(); setIsOpen(false); }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <span className="flex items-center gap-3">
                                {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                Theme
                            </span>
                            <span className="text-xs opacity-50 capitalize">{theme}</span>
                        </button>

                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
