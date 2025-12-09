import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/loader';
import { Eye, EyeOff } from 'lucide-react';
import loginIllustration from '/login_illustration_1765278826079.png';
import gsap from 'gsap';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const containerRef = useRef(null);
    const formRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(imageRef.current, {
                opacity: 0,
                x: -50,
                duration: 1,
                ease: "power3.out"
            });
            gsap.from(formRef.current, {
                opacity: 0,
                x: 50,
                duration: 1,
                delay: 0.2,
                ease: "power3.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            toast.success("Login successful!", { description: "Welcome back to OBE360." });
            if (result.isFirstLogin) {
                navigate('/change-password');
            } else {
                navigate('/dashboard');
            }
        } else {
            toast.error("Login failed", { description: result.error || "Please check your credentials." });
        }
    };

    return (
        <div className="flex min-h-screen" ref={containerRef}>
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex w-1/2 bg-blue-50 flex-col items-center justify-center p-12 relative overflow-hidden">
                <div ref={imageRef} className="z-10 flex flex-col items-center">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-blue-900 mb-2">Welcome to OBE360</h1>
                        <p className="text-blue-700">Manage your educational platform seamlessly.</p>
                    </div>
                    <img
                        src={loginIllustration}
                        alt="Login Illustration"
                        className="w-full max-w-md object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500 ease-in-out"
                    />
                </div>
                {/* Decorative Circle */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center bg-white p-8">
                <div ref={formRef} className="w-full max-w-md space-y-8">
                    <div className="text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Log in to access portal features.</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Please enter specific User ID and Password.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 font-medium">User ID <span className="text-red-500">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email ID/Login ID/Mobile No."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="styled-checkbox"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Keep me logged in
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                    Forgot Password?
                                </a>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                'Submit'
                            )}
                        </Button>

                        {/* <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Register</Link>
                            </p>
                        </div> */}
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                        <span>ABC Company All rights reserved.</span>
                        <span>24-Dec-2019 12:12:12</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
