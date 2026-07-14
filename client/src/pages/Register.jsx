import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, KeyRound, ChevronRight, Building } from 'lucide-react';
import loginIllustration from '/login_illustration_1765278826079.png';
import gsap from 'gsap';

const ADMIN_KEY = 'iskipasswordkikeymerepashe';

export default function Register() {
    const [step, setStep] = useState(1);

    // Step 1
    const [keyInput, setKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [keyError, setKeyError] = useState('');
    const [keyLoading, setKeyLoading] = useState(false);

    // Step 2
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [organizationCode, setOrganizationCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);

    const containerRef = useRef(null);
    const leftRef = useRef(null);
    const step1Ref = useRef(null);
    const step2Ref = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(leftRef.current, { opacity: 0, x: -40, duration: 0.9, ease: 'power3.out' });
            gsap.from(step1Ref.current, { opacity: 0, x: 40, duration: 0.9, delay: 0.15, ease: 'power3.out' });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleKeySubmit = (e) => {
        e.preventDefault();
        setKeyError('');
        if (!keyInput.trim()) { setKeyError('Please enter the admin access key.'); return; }
        setKeyLoading(true);
        setTimeout(() => {
            if (keyInput.trim() !== ADMIN_KEY) {
                setKeyError('Incorrect access key. You are not authorized.');
                setKeyLoading(false);
                gsap.fromTo(step1Ref.current, { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)', clearProps: 'x' });
                return;
            }
            setKeyLoading(false);
            gsap.to(step1Ref.current, {
                opacity: 0, x: -50, duration: 0.3, ease: 'power2.in',
                onComplete: () => {
                    setStep(2);
                    setTimeout(() => {
                        if (step2Ref.current) {
                            gsap.fromTo(step2Ref.current,
                                { opacity: 0, x: 50 },
                                { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' }
                            );
                        }
                    }, 50);
                }
            });
        }, 500);
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await register(
            email, 
            password, 
            fullName, 
            keyInput, 
            organizationName, 
            organizationCode
        );
        setIsLoading(false);
        if (result.success) {
            toast.success('Admin account created!', { 
                description: 'Please check your email and click the confirmation link before signing in.' 
            });
            navigate('/login');
        } else {
            toast.error('Registration failed', { description: result.error || 'Please try again.' });
        }
    };

    return (
        <div className="flex h-screen overflow-hidden" ref={containerRef}>

            {/* ── Left Panel ── */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 flex-col items-center justify-center p-10 relative overflow-hidden">
                <div ref={leftRef} className="z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-blue-100 rounded-full px-3 py-1 mb-4">
                        <ShieldCheck size={13} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">Admin Portal Only</span>
                    </div>
                    <h1 className="text-2xl font-bold text-blue-900 mb-1">OBE360 Admin Setup</h1>
                    <p className="text-blue-600 text-sm mb-6 max-w-xs">
                        Create your administrator account to manage the entire OBE platform.
                    </p>
                    <img
                        src={loginIllustration}
                        alt="Admin Setup"
                        className="w-full max-w-xs object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                    />
                </div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex items-center justify-center bg-white p-6 relative overflow-hidden">

                {/* Back to Home */}
                <Button
                    variant="ghost"
                    className="absolute top-6 left-6 gap-1.5 text-slate-400 hover:text-slate-800 text-sm"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft size={15} /> Back
                </Button>

                {/* ── STEP 1: Key Gate ── */}
                {step === 1 && (
                    <div ref={step1Ref} className="w-full max-w-sm">
                        <div className="flex justify-center mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <KeyRound size={26} className="text-white" />
                            </div>
                        </div>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Admin Access Required</h2>
                            <p className="text-sm text-gray-500">
                                Enter the secret admin key to continue. This page is not publicly accessible.
                            </p>
                        </div>

                        <form onSubmit={handleKeySubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="adminKey" className="text-sm font-medium text-gray-700">
                                    Admin Access Key
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="adminKey"
                                        type={showKey ? 'text' : 'password'}
                                        placeholder="Enter secret key"
                                        value={keyInput}
                                        onChange={(e) => { setKeyInput(e.target.value); setKeyError(''); }}
                                        autoFocus
                                        className={`h-11 rounded-lg pr-10 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                                            keyError ? 'border-red-400 bg-red-50' : 'border-slate-200'
                                        }`}
                                    />
                                    <button type="button" onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {keyError && (
                                    <p className="text-xs text-red-500 mt-1">{keyError}</p>
                                )}
                            </div>

                            <Button type="submit" disabled={keyLoading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2">
                                {keyLoading ? (
                                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Verifying...</>
                                ) : (
                                    <>Continue <ChevronRight size={15} /></>
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-xs text-gray-400 mt-5">
                            Already have an account?{' '}
                            <span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => navigate('/login')}>
                                Sign in
                            </span>
                        </p>
                    </div>
                )}

                {/* ── STEP 2: Signup Form ── */}
                {step === 2 && (
                    <div ref={step2Ref} className="w-full max-w-md h-full flex flex-col justify-center py-6" style={{ opacity: 0 }}>
                        <button type="button"
                            onClick={() => {
                                gsap.to(step2Ref.current, {
                                    opacity: 0, x: 50, duration: 0.25, ease: 'power2.in',
                                    onComplete: () => {
                                        setStep(1);
                                        setTimeout(() => {
                                            if (step1Ref.current) {
                                                gsap.fromTo(step1Ref.current,
                                                    { opacity: 0, x: -50 },
                                                    { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' }
                                                );
                                            }
                                        }, 50);
                                    }
                                });
                            }}
                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3 transition-colors self-start">
                            <ArrowLeft size={13} /> Back
                        </button>

                        {/* Verified badge */}
                        <div className="flex items-center gap-2 mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 self-start">
                            <ShieldCheck size={14} className="text-green-600 shrink-0" />
                            <span className="text-[11px] text-green-700 font-medium">Key verified — complete your account setup</span>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-0.5">Register New Institute</h2>
                            <p className="text-xs text-gray-500">Provide administrative and organization details.</p>
                        </div>

                        <form onSubmit={handleSignupSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="orgName" className="text-xs font-semibold text-gray-700">
                                        Institute/Uni Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="orgName" type="text" placeholder="e.g. FAST University"
                                        value={organizationName} onChange={(e) => setOrganizationName(e.target.value)}
                                        required autoFocus
                                        className="h-10 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs placeholder:text-gray-400" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="orgCode" className="text-xs font-semibold text-gray-700">
                                        Institute Abbreviation/Code <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="orgCode" type="text" placeholder="e.g. FAST-NUCES"
                                        value={organizationCode} onChange={(e) => setOrganizationCode(e.target.value)}
                                        required
                                        className="h-10 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs placeholder:text-gray-400" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="fullName" className="text-xs font-semibold text-gray-700">
                                    Admin Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input id="fullName" type="text" placeholder="e.g. Dr. John Doe"
                                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="h-10 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs placeholder:text-gray-400" />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                                    Admin Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input id="email" type="email" placeholder="admin@institution.edu"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-10 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs placeholder:text-gray-400" />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input id="password" type={showPassword ? 'text' : 'password'}
                                        placeholder="Minimum 8 characters"
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-10 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10 text-xs placeholder:text-gray-400" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" disabled={isLoading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all mt-2 flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <Building size={15} />
                                        <span>Register Organization & Admin</span>
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-[10px] text-gray-400 mt-4">
                            © {new Date().getFullYear()} OBE360. All rights reserved.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
