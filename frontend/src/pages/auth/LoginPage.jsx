import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Stethoscope, Eye, EyeOff, AlertCircle, ArrowRight, Shield, UserCog } from 'lucide-react';
import useAuthStore, { roleHome } from '../../store/useAuthStore';
import useAppStore from '../../store/useAppStore';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useAppStore();
    const { login, isLoading, error, clearError, user } = useAuthStore();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState('customer');

    // If already logged in, redirect to correct home
    useEffect(() => {
        if (user) {
            navigate(roleHome(user.role), { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => { clearError(); }, []);

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const role = await login(form.email, form.password);
        if (role) {
            // Use roleHome() so both 'admin' and 'pharmacist' go to /admin
            const from = location.state?.from?.pathname;
            const dest = roleHome(role);
            navigate(from?.startsWith(dest) ? from : dest, { replace: true });
        }
    };

    // Demo credentials filler
    const fillDemo = (role) => {
        if (role === 'customer') setForm({ email: 'michael@example.com', password: 'password123' });
        else setForm({ email: 'neha@pharmacy.com', password: 'adminpass123' });
        setSelectedRole(role === 'customer' ? 'customer' : 'admin');
    };

    return (
        <div className="min-h-screen bg-bg text-text flex transition-colors duration-300">
            {/* Left Panel – Decorative / Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 bg-primary">
                {/* Soft circle accents */}
                <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-white/5" />
                <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/5" />
                <div className="absolute top-1/2 right-[-60px] w-[200px] h-[200px] rounded-full bg-white/10" />

                <div className="relative z-10 text-white max-w-md text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/20">
                        <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 tracking-tight">AI Pharmacy Assistant</h1>
                    <p className="text-white/70 text-lg leading-relaxed">
                        Your intelligent medication management platform — order medicines, track refills, and consult your AI pharmacist, anytime.
                    </p>

                    <div className="mt-12 space-y-4 text-left">
                        {[
                            { icon: '🤖', label: 'AI-Powered ordering and refill reminders' },
                            { icon: '🔒', label: 'Secure prescription validation system' },
                            { icon: '⚡', label: 'Real-time inventory and dispatch tracking' },
                        ].map((f) => (
                            <div key={f.label} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10">
                                <span className="text-xl">{f.icon}</span>
                                <span className="text-white/90 text-sm font-medium">{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel – Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-text">AI Pharmacy</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-text tracking-tight">Welcome back</h2>
                        <p className="text-text-muted mt-2 text-sm">Sign in to your account to continue.</p>
                    </div>

                    {/* Role Selector */}
                    <div className="grid grid-cols-2 gap-3 mb-7">
                        <button type="button" onClick={() => { setSelectedRole('customer'); fillDemo('customer'); }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium
                ${selectedRole === 'customer' ? 'border-primary bg-primary/5 text-primary' : 'border-black/10 dark:border-white/10 text-text-muted hover:border-black/20 dark:hover:border-white/20'}`}>
                            <UserCog className="w-5 h-5" />
                            Patient / Customer
                        </button>
                        <button type="button" onClick={() => { setSelectedRole('admin'); fillDemo('admin'); }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium
                ${selectedRole === 'admin' ? 'border-primary bg-primary/5 text-primary' : 'border-black/10 dark:border-white/10 text-text-muted hover:border-black/20 dark:hover:border-white/20'}`}>
                            <Shield className="w-5 h-5" />
                            Pharmacist / Admin
                        </button>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-text-muted block mb-1.5">Email address</label>
                            <input
                                name="email" type="email" required autoComplete="email"
                                value={form.email} onChange={handleChange}
                                className="w-full px-4 py-3 bg-card border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-text-muted block mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                                    value={form.password} onChange={handleChange}
                                    className="w-full px-4 py-3 pr-12 bg-card border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                    placeholder="Enter your password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors p-1">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm mt-2">
                            {isLoading ? (
                                <span className="flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                            ) : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-text-muted mt-8">
                        New customer?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            Create an account
                        </Link>
                    </p>

                    <p className="text-center text-[11px] text-text-muted mt-6 opacity-60">
                        For pharmacist/admin access, contact your system administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
