import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Building2, ShieldAlert, KeyRound } from 'lucide-react';
import loginIllustration from '/login_illustration_1765278826079.png';
import gsap from 'gsap';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 2FA UI state
    const [show2FA, setShow2FA] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);

    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const verify2FA = useAuthStore((state) => state.verify2FA);

    const containerRef = useRef(null);
    const formRef = useRef(null);
    const otpRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        // Restore saved email if remembered previously
        const savedEmail = localStorage.getItem('obe360_remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }

        const ctx = gsap.context(() => {
            gsap.from(imageRef.current, {
                opacity: 0, x: -50, duration: 1, ease: 'power3.out'
            });
            gsap.from(formRef.current, {
                opacity: 0, x: 50, duration: 1, delay: 0.2, ease: 'power3.out'
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Save or clear remembered email
        if (rememberMe) {
            localStorage.setItem('obe360_remembered_email', email);
        } else {
            localStorage.removeItem('obe360_remembered_email');
        }

        const result = await login(email, password, rememberMe);
        setIsLoading(false);

        if (result.success) {
            if (result.requires2FA) {
                toast.success('Verification code sent!', { 
                    description: `A 6-digit OTP code has been sent to ${email}.` 
                });
                
                // Animate transition to 2FA view
                gsap.to(formRef.current, {
                    opacity: 0, x: -50, duration: 0.3, ease: 'power2.in',
                    onComplete: () => {
                        setShow2FA(true);
                        setTimeout(() => {
                            if (otpRef.current) {
                                gsap.fromTo(otpRef.current,
                                    { opacity: 0, x: 50 },
                                    { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' }
                                );
                            }
                        }, 50);
                    }
                });
            } else {
                toast.success('Login successful!', { description: 'Welcome back to OBE 360.' });
                if (result.isFirstLogin) {
                    navigate('/change-password');
                } else {
                    navigate('/dashboard');
                }
            }
        } else {
            toast.error('Login failed', { description: result.error || 'Please check your credentials.' });
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.trim().length !== 6) {
            toast.error('Invalid code format', { description: 'Please enter the 6-digit verification code.' });
            return;
        }

        setVerificationLoading(true);
        const result = await verify2FA(email, otpCode.trim());
        setVerificationLoading(false);

        if (result.success) {
            toast.success('Authentication successful!', { description: 'Welcome back to OBE360.' });
            if (result.isFirstLogin) {
                navigate('/change-password');
            } else {
                navigate('/dashboard');
            }
        } else {
            toast.error('Verification failed', { description: result.error || 'The code entered is invalid or expired.' });
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0 || resendLoading) return;
        setResendLoading(true);
        try {
            const res = await fetch('/api/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Code resent!', { description: data.message });
                setOtpCode('');
                setResendCooldown(60);
            } else {
                toast.error('Could not resend', { description: data.error });
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setResendLoading(false);
        }
    };

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleBackToLogin = () => {
        gsap.to(otpRef.current, {
            opacity: 0, x: 50, duration: 0.3, ease: 'power2.in',
            onComplete: () => {
                setShow2FA(false);
                setOtpCode('');
                setTimeout(() => {
                    if (formRef.current) {
                        gsap.fromTo(formRef.current,
                            { opacity: 0, x: -50 },
                            { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' }
                        );
                    }
                }, 50);
            }
        });
    };

    return (
        <div className="flex h-screen overflow-hidden" ref={containerRef}>
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 flex-col items-center justify-center p-12 relative overflow-hidden">
                <div ref={imageRef} className="z-10 flex flex-col items-center">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-blue-900 mb-2">Welcome to OBE 360</h1>
                        <p className="text-blue-700 text-sm">Manage your educational platform seamlessly.</p>
                    </div>
                    <img
                        src={loginIllustration}
                        alt="Login Illustration"
                        className="w-full max-w-md object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500 ease-in-out"
                    />
                </div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            </div>

            {/* Right Side - Forms */}
            <div className="flex-1 flex items-center justify-center bg-white p-8 relative overflow-hidden">
                
                {/* ── STANDARD LOGIN FORM ── */}
                {!show2FA && (
                    <div ref={formRef} className="w-full max-w-md">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            className="-ml-3 gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6"
                            onClick={() => navigate('/')}
                        >
                            <ArrowLeft size={16} /> Back to Home
                        </Button>

                        <div className="text-left mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h2>
                            <p className="text-sm text-gray-500">
                                Enter your credentials to access the portal.
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@institution.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm placeholder:text-gray-400"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10 text-sm placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me + Forgot Password */}
                            <div className="flex items-center justify-between pt-1">
                                <label
                                    htmlFor="remember-me"
                                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                                >
                                    <div className="relative">
                                        <input
                                            id="remember-me"
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-[18px] h-[18px] rounded border border-slate-300 bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                                            {rememberMe && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                        Remember me
                                    </span>
                                </label>

                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Register New Institute Link */}
                        <div className="mt-5 pt-5 border-t border-gray-100">
                            <p className="text-xs text-gray-400 text-center mb-3">Not registered yet?</p>
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all group"
                            >
                                <Building2 size={15} className="text-blue-500 group-hover:text-blue-600 transition-colors" />
                                Register New Institute
                            </button>
                        </div>

                        <div className="mt-5 flex justify-center text-xs text-gray-400">
                            <span>© {new Date().getFullYear()} OBE360. All rights reserved.</span>
                        </div>
                    </div>
                )}

                {/* ── 2FA VERIFICATION CODE FORM ── */}
                {show2FA && (
                    <div ref={otpRef} className="w-full max-w-sm" style={{ opacity: 0 }}>
                        <button 
                            type="button"
                            onClick={handleBackToLogin}
                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to Sign In
                        </button>

                        <div className="flex justify-center mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-blue-600">
                                <KeyRound size={24} />
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-1.5">Two-Step Verification</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                We sent a 6-digit verification code to <span className="font-semibold text-gray-800">{email}</span>. Please enter it below.
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="otpCode" className="text-sm font-medium text-gray-700">
                                    Verification Code
                                </Label>
                                <Input
                                    id="otpCode"
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter 6-digit code"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    required
                                    autoFocus
                                    className="h-11 text-center text-lg tracking-[0.5em] font-mono rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-gray-400"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={verificationLoading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2"
                            >
                                {verificationLoading ? (
                                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Verifying...</>
                                ) : (
                                    'Verify Code'
                                )}
                            </Button>
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={resendCooldown > 0 || resendLoading}
                                className="w-full h-11 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {resendLoading ? (
                                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> Sending...</>
                                ) : resendCooldown > 0 ? (
                                    `Resend in ${resendCooldown}s`
                                ) : (
                                    'Resend Code'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2">
                            <ShieldAlert size={14} className="text-slate-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                If SMTP configuration is delayed or blocked on Render, check the server console logs for the fallback OTP code.
                            </p>
                        </div>

                        <p className="text-center text-xs text-gray-400 mt-6">
                            © {new Date().getFullYear()} OBE360. All rights reserved.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
