import React from 'react';
import { Moon, Sun, Monitor, Stethoscope, LogOut, User, ShoppingBag, FileText, ShieldAlert } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import useAuthStore, { STAFF_ROLES } from '../../store/useAuthStore';
import LanguageSelector from '../chat/LanguageSelector';



const Header = ({ onOpenAllergies }) => {
    const { theme, toggleTheme } = useAppStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-glass backdrop-blur-md border-b border-black/5 dark:border-white/5 z-50 sticky top-0 transition-colors duration-500">

            {/* Logo Area */}
            <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft">
                    <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="font-semibold text-lg leading-tight tracking-tight text-text">Cura AI</h1>
                    <p className="text-xs text-text-muted">Autonomous Pharmacy Assistant</p>
                </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                <Link to="/traces" className={`flex items-center gap-2 text-sm font-medium transition-colors ${location.pathname === '/traces' ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-muted hover:text-text'}`}>
                    <Monitor className="w-4 h-4" /> Agent Traces
                </Link>
                {user && !STAFF_ROLES.includes(user.role) && (
                <div className="flex items-center gap-1">
                    <Link
                        to="/my-orders"
                        title="My Orders"
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === '/my-orders'
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="hidden sm:inline">My Orders</span>
                    </Link>
                    <Link
                        to="/my-prescriptions"
                        title="My Prescriptions"
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === '/my-prescriptions'
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">My Prescriptions</span>
                    </Link>
                    {/* Allergies button */}
                    <button
                        onClick={onOpenAllergies}
                        title="My Allergies"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-text-muted hover:text-primary hover:bg-primary/5"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span className="hidden sm:inline">Allergies</span>
                    </button>
                </div>
            )}
            </nav>

        
            {/* Right Actions */}
            <div className="flex items-center gap-3">
                <LanguageSelector />
                {user && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-black/5 dark:border-white/5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-text-muted truncate max-w-[100px]">{user.name}</span>
                    </div>
                )}
                <button onClick={toggleTheme}
                    className="p-2.5 rounded-full bg-card hover:scale-105 transition-transform shadow-soft flex items-center justify-center text-text-muted hover:text-text cursor-pointer"
                    aria-label="Toggle Theme">
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>
                {user && (
                    <button onClick={handleLogout}
                        className="p-2.5 rounded-full bg-card hover:scale-105 transition-transform shadow-soft flex items-center justify-center text-text-muted hover:text-red-500 cursor-pointer"
                        aria-label="Logout" title="Logout">
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>

        </header>
    );
};

export default Header;

