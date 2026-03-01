import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    FileSignature,
    Boxes,
    BellRing,
    History,
    Settings,
    Stethoscope,
    Moon,
    Sun,
    Monitor,
    LogOut,
    User,
    Bot,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    TerminalSquare
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import AdminNotificationPanel from '../../components/admin/AdminNotificationPanel';
import { useSocket } from '../../context/SocketContext';

const NavItem = ({ to, icon: Icon, label, end = false, isCollapsed }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `
      flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2.5 rounded-lg text-[15px] font-medium transition-colors
      ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text'
            }
    `}
        title={isCollapsed ? label : undefined}
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{label}</span>}
    </NavLink>
);

const AdminLayout = () => {
    const { theme, toggleTheme } = useAppStore();
    const { user, logout } = useAuthStore();
    const { isConnected } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    // Responsive sidebar states
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-[100dvh] bg-bg text-text transition-colors duration-300 font-sans overflow-hidden">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar (Desktop & Mobile combined logic) */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 bg-card border-r border-black/5 dark:border-white/5 flex flex-col transition-all duration-300 ease-in-out shadow-lg md:shadow-none
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:relative md:translate-x-0
                ${isCollapsed ? 'md:w-20' : 'w-72 md:w-64'} 
            `}>

                {/* Brand Logo & Mobile Close */}
                <div className={`h-16 flex flex-shrink-0 items-center border-b border-black/5 dark:border-white/5 ${isCollapsed ? 'justify-center px-0' : 'px-6 justify-between'}`}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
                            <Stethoscope className="w-4 h-4" />
                        </div>
                        {!isCollapsed && <span className="font-semibold text-[15px] tracking-tight text-text whitespace-nowrap">Pharmacy Admin</span>}
                    </div>
                    {/* Mobile close button */}
                    <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-text-muted">
                        <X className="w-5 h-5" />
                    </button>
                    {/* Desktop collapse toggle */}
                    {!isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="hidden md:flex p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Desktop Expand Toggle (when collapsed) */}
                {isCollapsed && (
                    <div className="flex justify-center p-2 border-b border-black/5 dark:border-white/5 hidden md:flex">
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-colors"
                            title="Expand Sidebar"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className={`flex-1 overflow-y-auto py-6 space-y-1 scrollbar-hide ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" end isCollapsed={isCollapsed} />
                    <NavItem to="/admin/orders" icon={Package} label="Orders" isCollapsed={isCollapsed} />
                    <NavItem to="/admin/prescriptions" icon={FileSignature} label="Prescriptions" isCollapsed={isCollapsed} />
                    <NavItem to="/admin/inventory" icon={Boxes} label="Inventory" isCollapsed={isCollapsed} />
                    <NavItem to="/admin/alerts" icon={BellRing} label="Refill Alerts" isCollapsed={isCollapsed} />
                    <NavItem to="/admin/logs" icon={History} label="Inventory Logs" isCollapsed={isCollapsed} />
                    <NavItem to="/admin/traces" icon={TerminalSquare} label="Agent Traces" isCollapsed={isCollapsed} />
                    <NavItem to="/admin/agent" icon={Bot} label="AI Assistant" isCollapsed={isCollapsed} />
                </nav>

                {/* Footer: User Info + Controls */}
                <div className={`p-4 border-t border-black/5 dark:border-white/5 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
                    {/* Logged-in user chip with live connection dot */}
                    {user && !isCollapsed && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 mb-2">
                            <div className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-primary" />
                                <span
                                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${isConnected ? 'bg-emerald-500' : 'bg-text-muted/40'
                                        }`}
                                    title={isConnected ? 'Live updates on' : 'Reconnecting…'}
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-text text-sm font-semibold truncate">{user.name}</p>
                                <p className="text-text-muted text-xs capitalize">{user.role}</p>
                            </div>
                        </div>
                    )}

                    {/* User dot only for collapsed view */}
                    {user && isCollapsed && (
                        <div className="flex justify-center mb-4">
                            <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0" title={user.name}>
                                <User className="w-5 h-5 text-primary" />
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${isConnected ? 'bg-emerald-500' : 'bg-text-muted/40'}`} />
                            </div>
                        </div>
                    )}

                    {/* Real-time notification bell */}
                    <AdminNotificationPanel isCollapsed={isCollapsed} />

                    <NavItem to="/admin/settings" icon={Settings} label="Settings" isCollapsed={isCollapsed} />

                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2.5 rounded-lg text-[15px] font-medium text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text transition-colors`}
                        title={isCollapsed ? `Theme: ${theme}` : undefined}
                    >
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : theme === 'light' ? <Sun className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        {!isCollapsed && <span className="capitalize">{theme} Mode</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2.5 rounded-lg text-[15px] font-medium text-red-500/80 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors`}
                        title={isCollapsed ? "Sign Out" : undefined}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-bg relative min-w-0">
                {/* Mobile Header — hidden on agent page (it has its own header) */}
                {location.pathname !== '/admin/agent' && (
                    <header className="md:hidden h-16 bg-card border-b border-black/5 dark:border-white/5 flex items-center px-4 justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-text hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <Menu className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-text">Admin</span>
                            </div>
                        </div>
                        <button onClick={toggleTheme} className="p-2 text-text-muted rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : theme === 'light' ? <Sun className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        </button>
                    </header>
                )}

                <div className={`flex-1 overflow-y-auto ${location.pathname === '/admin/agent' ? 'p-0 sm:p-0 lg:p-0 h-full overflow-hidden' : 'p-4 sm:p-6 lg:p-10 scrollbar-hide'}`}>
                    <div className={`${location.pathname === '/admin/agent' ? 'w-full h-full max-w-none' : 'max-w-6xl mx-auto w-full'}`}>
                        <Outlet context={{ openAdminNav: () => setIsMobileOpen(true) }} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
