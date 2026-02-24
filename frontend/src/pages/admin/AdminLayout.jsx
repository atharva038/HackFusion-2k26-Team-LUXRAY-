import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
    Sun
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const NavItem = ({ to, icon: Icon, label, end = false }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `
      flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-colors
      ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text'
            }
    `}
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="truncate">{label}</span>
    </NavLink>
);

const AdminLayout = () => {
    const { theme, toggleTheme } = useAppStore();

    return (
        <div className="flex h-screen bg-bg text-text transition-colors duration-300 font-sans overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-card border-r border-black/5 dark:border-white/5 flex flex-col transition-colors z-20 shadow-sm hidden md:flex">

                {/* Brand Logo */}
                <div className="h-16 flex flex-shrink-0 items-center px-6 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm">
                            <Stethoscope className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-[15px] tracking-tight text-text">Pharmacy Admin</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
                    <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" end />
                    <NavItem to="/admin/orders" icon={Package} label="Orders" />
                    <NavItem to="/admin/prescriptions" icon={FileSignature} label="Prescriptions" />
                    <NavItem to="/admin/inventory" icon={Boxes} label="Inventory" />
                    <NavItem to="/admin/alerts" icon={BellRing} label="Refill Alerts" />
                    <NavItem to="/admin/logs" icon={History} label="Inventory Logs" />
                </nav>

                {/* Footer Settings & Theme Toggle */}
                <div className="p-4 border-t border-black/5 dark:border-white/5 space-y-1">
                    <NavItem to="/admin/settings" icon={Settings} label="Settings" />
                    <button
                        onClick={toggleTheme}
                        className="w-full mt-2 flex items-center justify-between px-4 py-2.5 rounded-lg text-[15px] font-medium text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text transition-colors"
                    >
                        <span className="flex items-center gap-3">
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-bg relative">
                {/* Mobile Header (visible only on small screens) */}
                <header className="md:hidden h-16 bg-card border-b border-black/5 dark:border-white/5 flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-primary" />
                        <span className="font-semibold text">Admin</span>
                    </div>
                    {/* Simplified mobile menu toggle or theme toggle for now */}
                    <button onClick={toggleTheme} className="p-2 text-text-muted">
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
                    <div className="max-w-6xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
