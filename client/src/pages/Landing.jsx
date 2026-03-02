import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    BarChart3,
    Calculator,
    Users,
    ArrowRight,
    GraduationCap,
    CheckCircle2,
    Settings,
    ShieldCheck,
    Target,
    Activity,
    FileSpreadsheet,
    Network
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ObeLogo from '@/components/Logo';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
    const navigate = useNavigate();

    // Refs for animations
    const heroRef = useRef(null);
    const whyRef = useRef(null);
    const howRef = useRef(null);
    const modulesRef = useRef(null);
    const rolesRef = useRef(null);
    const ctaRef = useRef(null);

    useEffect(() => {
        // Hero Animation
        const heroCtx = gsap.context(() => {
            gsap.from(".hero-text", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out"
            });
        }, heroRef);

        // Why Section
        const whyCtx = gsap.context(() => {
            gsap.from(".why-item", {
                scrollTrigger: {
                    trigger: whyRef.current,
                    start: "top 80%",
                },
                x: -50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out"
            });
        }, whyRef);

        // How it Works Section
        const howCtx = gsap.context(() => {
            gsap.from(".how-step", {
                scrollTrigger: {
                    trigger: howRef.current,
                    start: "top 75%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "back.out(1.5)"
            });
        }, howRef);

        // Modules Section
        const modulesCtx = gsap.context(() => {
            gsap.from(".module-card", {
                scrollTrigger: {
                    trigger: modulesRef.current,
                    start: "top 80%",
                },
                scale: 0.9,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out"
            });
        }, modulesRef);

        return () => {
            heroCtx.revert();
            whyCtx.revert();
            howCtx.revert();
            modulesCtx.revert();
        };
    }, []);

    const handleLogin = () => navigate('/login');

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-600 selection:text-white">

            {/* Navigation Bar */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                                <ObeLogo className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-black text-2xl tracking-tighter text-slate-900">OBE 360</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                className="hidden md:flex font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => document.getElementById('why').scrollIntoView({ behavior: 'smooth' })}
                            >
                                Why OBE?
                            </Button>
                            <Button
                                variant="ghost"
                                className="hidden lg:flex font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => document.getElementById('modules').scrollIntoView({ behavior: 'smooth' })}
                            >
                                Core Modules
                            </Button>
                            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                            <Button
                                variant="outline"
                                className="hidden sm:flex gap-2 font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                                onClick={handleLogin}
                            >
                                <ShieldCheck size={16} /> Admin Login
                            </Button>
                            <Button
                                className="gap-2 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-full px-6"
                                onClick={handleLogin}
                            >
                                <GraduationCap size={16} /> Faculty Portal <ArrowRight size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* 1. Hero Section */}
            <section ref={heroRef} className="pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent -z-10 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-5xl mx-auto">
                        <div className="hero-text inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100/50 shadow-sm text-blue-700 text-sm font-bold mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                            The Future of University Administration
                        </div>
                        <h1 className="hero-text text-5xl md:text-7xl lg:text-[5.5rem] font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
                            Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Outcome-Based</span> Education with Precision.
                        </h1>
                        <p className="hero-text text-lg md:text-2xl text-slate-500 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
                            A completely unified architecture that bridges the gap between curriculum design, continuous assessment, and automated quality assurance reporting.
                        </p>
                        <div className="hero-text flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                size="lg"
                                className="h-14 px-8 rounded-full bg-slate-900 hover:bg-slate-800 text-base font-bold w-full sm:w-auto shadow-2xl shadow-slate-900/20"
                                onClick={handleLogin}
                            >
                                Access Institutional Dashboard
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-8 rounded-full border-2 border-slate-200 text-slate-700 hover:bg-slate-50 text-base font-bold w-full sm:w-auto bg-white shadow-sm"
                                onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}
                            >
                                See How It Works
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Why OBE 360? Section */}
            <section id="why" ref={whyRef} className="py-24 bg-white border-y border-slate-100 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="why-item">
                            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">The Problem We Solve</h2>
                            <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                                Traditional grading tells you <span className="underline decoration-blue-200 underline-offset-8">what</span> a student scored, not <span className="underline decoration-indigo-200 underline-offset-8">what</span> they learned.
                            </h3>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                Managing accreditation requirements (like Washington Accord) manually through complex spreadsheets is prone to error and incredibly time-consuming for academic staff.
                            </p>
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                                        <span className="text-rose-600 font-bold font-serif text-xl border-b-2 border-rose-600 h-4 leading-[0]">×</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">The Old Way</h4>
                                        <p className="text-slate-500 mt-1">Siloed course content, unstructured assessment questions, manual spreadsheet calculations for CLO/PLO mapping, leading to accreditation panic.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={24} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">The OBE 360 Way</h4>
                                        <p className="text-slate-500 mt-1">A centralized, relational database where every question maps to a CLO, which maps to a PLO. Attainment is calculated instantly, in real-time, completely automated.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative why-item">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[3rem] rotate-3 opacity-10"></div>
                            <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Network size={200} className="text-white" />
                                </div>
                                <h4 className="text-white font-black text-2xl mb-8 relative z-10">System Data Flow</h4>
                                <div className="space-y-4 relative z-10">
                                    {['Program (PLOs)', 'Course (CLOs)', 'Assessments (Questions)', 'Student Attainment (%)'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 backdrop-blur-sm">
                                            <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">{i + 1}</div>
                                            <span className="text-white font-bold">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. How it Works (Stepper) */}
            <section id="how" ref={howRef} className="py-24 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Methodology</h2>
                        <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Structured for Success</h3>
                        <p className="text-slate-500 text-lg mt-4 max-w-2xl mx-auto">A standardized workflow that ensures compliance from program creation to graduation.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop only) */}
                        <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 z-0"></div>

                        {[
                            { icon: <Target size={24} />, title: "Define", desc: "Admins establish Programs, Semesters, and high-level Program Learning Outcomes." },
                            { icon: <BookOpen size={24} />, title: "Curriculum", desc: "Admins assign Courses and define Course Learning Outcomes mapping them to PLOs." },
                            { icon: <Activity size={24} />, title: "Execute", desc: "Teachers conduct Assessments, mapping specific questions directly to specific CLOs." },
                            { icon: <BarChart3 size={24} />, title: "Analyze", desc: "The system automates GPA, Award Lists, and visualizes CLO/PLO Attainment instantly." }
                        ].map((step, idx) => (
                            <div key={idx} className="how-step relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-white border-[6px] border-[#F8FAFC] shadow-xl flex items-center justify-center text-blue-600 mb-6 relative">
                                    {step.icon}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm border-4 border-[#F8FAFC]">
                                        {idx + 1}
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-2">{step.title}</h4>
                                <p className="text-sm text-slate-500 px-4 leading-relaxed font-medium">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Comprehensive Modules */}
            <section id="modules" ref={modulesRef} className="py-32 bg-slate-900 text-white relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-20">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">Core Modules Overview.</h2>
                        <p className="text-slate-400 text-xl max-w-2xl">Everything required to digitize an educational institution in one secure platform.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="module-card bg-slate-800/50 border border-slate-700 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800 transition-colors">
                            <Settings className="text-blue-400 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3 text-white">Central Administration</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Complete control over Academic Sessions (Semesters), Degree Programs, and Class structures. Manage institutional hierarchies easily.</p>
                        </div>
                        <div className="module-card bg-slate-800/50 border border-slate-700 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800 transition-colors">
                            <Users className="text-indigo-400 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3 text-white">User Management</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Secure registration and role-based access control for Teachers and Students. Enroll students seamlessly into classes and courses.</p>
                        </div>
                        <div className="module-card bg-slate-800/50 border border-slate-700 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800 transition-colors">
                            <FileSpreadsheet className="text-emerald-400 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3 text-white">Assessment Engine</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Teachers can create granular assessments (Mids, Finals, Quizzes). Input marks question-by-question for exact CLO tracking.</p>
                        </div>
                        <div className="module-card bg-slate-800/50 border border-slate-700 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800 transition-colors">
                            <Calculator className="text-amber-400 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3 text-white">Smart Grading & GPA</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Built-in calculator that respects credit hours. Normalizes assessments automatically into standard 80/20 category splits for Final grades.</p>
                        </div>
                        <div className="module-card bg-slate-800/50 border border-slate-700 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800 transition-colors">
                            <BarChart3 className="text-rose-400 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3 text-white">Attainment Analytics</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Visual Shadcn charts displaying real-time class mastery of outcomes. Instantly identify areas where curriculum delivery needs adjustment.</p>
                        </div>
                        <div className="module-card bg-blue-600 border border-blue-500 p-8 rounded-3xl hover:bg-blue-500 transition-colors flex flex-col justify-center items-center text-center">
                            <ShieldCheck className="text-white mb-4" size={40} />
                            <h3 className="text-2xl font-black mb-2 text-white">Official Reporting</h3>
                            <p className="text-blue-100 text-sm font-medium">Generate print-ready, formal Award Lists for the Dean's office instantly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Role Segregation Section (New UI) */}
            <section className="py-24 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Access Your Portal</h2>
                        <p className="text-slate-500 mt-4 text-lg">Select your role to continue to your customized dashboard.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch max-w-5xl mx-auto">

                        {/* Admin Card - New Design */}
                        <div className="flex-1 bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-slate-100 text-slate-700 rounded-3xl flex items-center justify-center mb-6">
                                <Settings size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Admin Console</h3>
                            <p className="text-slate-500 mb-8 max-w-sm">
                                Full control over curriculum, program outcomes, users, and institutional settings.
                            </p>
                            <Button
                                size="lg"
                                className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-14"
                                onClick={handleLogin}
                            >
                                Login as Admin
                            </Button>
                        </div>

                        {/* Faculty Card - New Design */}
                        <div className="flex-1 bg-white rounded-[2rem] p-10 shadow-xl shadow-blue-900/10 border border-blue-100 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
                            {/* Decorative blur */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10"></div>

                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
                                <GraduationCap size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Faculty Portal</h3>
                            <p className="text-slate-500 mb-8 max-w-sm">
                                Manage courses, conduct assessments, track CLOs, and generate award lists.
                            </p>
                            <Button
                                size="lg"
                                className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-14 shadow-lg shadow-blue-600/20"
                                onClick={handleLogin}
                            >
                                Login as Faculty
                            </Button>
                        </div>

                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 opacity-50 grayscale">
                        <ObeLogo className="w-5 h-5 text-slate-600" />
                        <span className="font-black text-lg tracking-tighter text-slate-800">OBE 360</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium text-center md:text-left">
                        &copy; {new Date().getFullYear()} Modern LMS Framework. Built to simplify Outcome-Based Education.
                    </p>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="sm" className="text-slate-500 font-bold">Privacy</Button>
                        <Button variant="ghost" size="sm" className="text-slate-500 font-bold">Documentation</Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Minimal Badge Component for Landing
function Badge({ children, className }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors ${className}`}>
            {children}
        </span>
    );
}
