import React from 'react';
import { Moon, Sun, Monitor, Stethoscope, LogOut, User, ShoppingBag, FileText } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAppStore, { AI_STATUS } from '../../store/useAppStore';
import useAuthStore, { STAFF_ROLES } from '../../store/useAuthStore';

const AiStatusIndicator = () => {
    const aiStatus = useAppStore(state => state.aiStatus);

    let statusConfig = { text: 'Ready', dot: 'bg-green-400' };
    switch (aiStatus) {
        case AI_STATUS.LISTENING:
            statusConfig = { text: 'Listening', dot: 'bg-blue-400 animate-pulse' };
            break;
        case AI_STATUS.PROCESSING:
            statusConfig = { text: 'Processing', dot: 'bg-purple-400 animate-bounce' };
            break;
        case AI_STATUS.SPEAKING:
            statusConfig = { text: 'Speaking', dot: 'bg-teal-400 animate-pulse' };
            break;
        default:
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
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft">
                    <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="font-semibold text-lg leading-tight tracking-tight">Cura AI</h1>
                    <p className="text-xs text-text-muted">Autonomous Pharmacy Assistant</p>
                </div>
            </div>

            {/* Customer Nav Links — hidden for admin/pharmacist */}
            {user && !STAFF_ROLES.includes(user.role) && (
                <div className="flex items-center gap-1">
                    <Link
                        to="/my-orders"
                        title="My Orders"
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            location.pathname === '/my-orders'
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            location.pathname === '/my-prescriptions'
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">My Prescriptions</span>
                    </Link>
                </div>
            )}

            {/* AI Status (Centered) */}
            <div className="hidden md:flex flex-1 justify-center">
                <AiStatusIndicator />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
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

