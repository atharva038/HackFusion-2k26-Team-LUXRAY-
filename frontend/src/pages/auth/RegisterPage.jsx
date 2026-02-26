import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, User } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, isLoading, error, clearError, user } = useAuthStore();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        phone: '', age: '', gender: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [fieldError, setFieldError] = useState('');

    useEffect(() => {
        if (user) navigate('/', { replace: true });
    }, [user, navigate]);

    useEffect(() => { clearError(); }, []);

    const handleChange = (e) => {
        setFieldError('');
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const validatePassword = (p) => {
        if (p.length < 6) return 'Password must be at least 6 characters.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setFieldError('Passwords do not match.');
            return;
        }
        const pwErr = validatePassword(form.password);
        if (pwErr) { setFieldError(pwErr); return; }

        const payload = { name: form.name, email: form.email, password: form.password, role: 'customer' };
        if (form.phone) payload.phone = form.phone;
        if (form.age) payload.age = Number(form.age);
        if (form.gender) payload.gender = form.gender;

        const ok = await register(payload);
        if (ok) navigate('/', { replace: true });
    };

    const passwordStrength = (p) => {
        if (!p) return null;
        if (p.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '20%' };
        if (p.length < 8) return { label: 'Weak', color: 'bg-amber-500', width: '40%' };
        if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: 'Strong', color: 'bg-green-500', width: '100%' };
        return { label: 'Fair', color: 'bg-blue-500', width: '65%' };
    };

    const strength = passwordStrength(form.password);

    return (
        <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6 transition-colors duration-300">
            <div className="w-full max-w-lg">
                {/* Brand */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                        <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-text block leading-none">AI Pharmacy</span>
                        <span className="text-xs text-text-muted">Autonomous Pharmacy Platform</span>
                    </div>
                </div>

                <div className="bg-card border border-black/5 dark:border-white/5 rounded-2xl shadow-sm p-8">
                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-text tracking-tight">Create your account</h2>
                        <p className="text-text-muted mt-1.5 text-sm">Join as a patient to order medicines via AI.</p>
                    </div>

                    {/* Error Banner */}
                    {(error || fieldError) && (
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{fieldError || error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name + Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-muted block mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <input name="name" required value={form.name} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                    placeholder="Sarah Jenkins" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-muted block mb-1.5">Phone</label>
                                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                    placeholder="+91 98765..." />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-sm font-medium text-text-muted block mb-1.5">Email address <span className="text-red-500">*</span></label>
                            <input name="email" type="email" required value={form.email} onChange={handleChange}
                                className="w-full px-4 py-3 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                placeholder="you@example.com" />
                        </div>

                        {/* Age + Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-muted block mb-1.5">Age</label>
                                <input name="age" type="number" min="1" max="120" value={form.age} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                    placeholder="34" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-muted block mb-1.5">Gender</label>
                                <select name="gender" value={form.gender} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm appearance-none">
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-medium text-text-muted block mb-1.5">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    name="password" type={showPassword ? 'text' : 'password'} required
                                    value={form.password} onChange={handleChange}
                                    className="w-full px-4 py-3 pr-12 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                    placeholder="Min. 6 characters"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {strength && (
                                <div className="mt-2">
                                    <div className="h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} style={{ width: strength.width }} />
                                    </div>
                                    <p className="text-xs text-text-muted mt-1.5">{strength.label} password</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="text-sm font-medium text-text-muted block mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    name="confirmPassword" type="password" required
                                    value={form.confirmPassword} onChange={handleChange}
                                    className="w-full px-4 py-3 pr-12 bg-bg border border-black/10 dark:border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                                    placeholder="Repeat password"
                                />
                                {form.confirmPassword && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {form.password === form.confirmPassword
                                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            : <AlertCircle className="w-4 h-4 text-red-500" />}
                                    </div>
                                )}
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
                                <>Create Account <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-text-muted mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
