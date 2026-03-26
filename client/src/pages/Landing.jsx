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
    Network,
    X
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ObeLogo from '@/components/Logo';
import Antigravity from '@/components/Antigravity';
import RotatingText from '@/components/RotatingText';
import BorderGlow from '@/components/BorderGlow';
import Ribbons from '@/components/Ribbons';
import TeamSection from '@/components/TeamSection';
import ContactSection from '@/components/ContactSection';
import { motion } from 'motion/react';
import Lenis from 'lenis';

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
    const lenisRef = useRef(null);

    useEffect(() => {
        // Initialize Lenis for Smooth Scrolling
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            wheelMultiplier: 1,
        });
        lenisRef.current = lenis;

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element && lenisRef.current) {
            let offset = -100; // Default offset for header

            // Try to perfectly center the section in the viewport if it fits
            const winH = window.innerHeight;
            const rectH = element.offsetHeight;

            if (rectH < winH) {
                // Formula to vertically center an element:
                // Move it up by half the remaining space in the viewport
                offset = -(winH - rectH) / 2;
            } else {
                // If it's too tall, just scroll to its top, offset by the 80px header
                offset = -80;
            }

            lenisRef.current.scrollTo(element, {
                offset: offset,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        }
    };

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

            {/* Navigation Bar - Pill Version */}
            <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none">
                <nav className="w-full max-w-7xl bg-white rounded-full shadow-lg px-4 sm:px-6 py-2 flex items-center justify-between transition-all duration-300 pointer-events-auto">
                    <div className="flex items-center gap-2 pl-1">
                        <div className="bg-blue-600 p-1.5 rounded-full shadow-md shadow-blue-600/20">
                            <ObeLogo className="w-7 h-7 text-white" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-slate-900 hidden sm:block">OBE 360</span>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex items-center gap-2">
                            <Button
                                variant="ghost"
                                className="font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full px-4"
                                onClick={() => scrollToSection('why')}
                            >
                                Why OBE?
                            </Button>
                            <Button
                                variant="ghost"
                                className="font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full px-4"
                                onClick={() => scrollToSection('modules')}
                            >
                                Core Modules
                            </Button>
                            <Button
                                variant="ghost"
                                className="font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full px-4"
                                onClick={() => scrollToSection('how')}
                            >
                                How it Works
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                className="hidden sm:flex gap-2 font-bold text-slate-700 hover:bg-slate-50 rounded-full"
                                onClick={handleLogin}
                            >
                                <ShieldCheck size={16} /> <span className="hidden lg:inline">Admin Login</span>
                            </Button>
                            <Button
                                className="gap-2 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-full px-6 py-6"
                                onClick={handleLogin}
                            >
                                <GraduationCap size={18} /> <span className="hidden sm:inline">Portal</span> <ArrowRight size={16} />
                            </Button>
                        </div>
                    </div>
                </nav>
            </div>

            {/* 1. Hero Section - Dark Theme */}
            <section ref={heroRef} className="overflow-hidden relative z-0 min-h-[100dvh] flex items-center justify-center bg-slate-950 pt-16">
                {/* Background Decor */}
                <div className="absolute inset-0 z-0">
                    <Antigravity
                        count={300}
                        magnetRadius={6}
                        ringRadius={7}
                        waveSpeed={0.4}
                        waveAmplitude={1}
                        particleSize={0.9}
                        lerpSpeed={0.05}
                        color="#2563eb"
                        autoAnimate={true}
                        particleVariance={1}
                        rotationSpeed={0}
                        depthFactor={1}
                        pulseSpeed={3}
                        particleShape="capsule"
                        fieldStrength={10}
                    />
                </div>
                {/* Dark mode glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent -z-20 opacity-60"></div>

                <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 relative z-10 pointer-events-none">
                    <div className="text-center max-w-5xl mx-auto">
                        <div className="hero-text inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0a1020] border border-slate-800 shadow-2xl text-blue-300 text-sm font-semibold mb-8 backdrop-blur-sm pointer-events-auto cursor-default">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            The Future of University Administration
                        </div>
                        <h1 className="hero-text text-5xl md:text-7xl lg:text-[76px] font-black text-white tracking-tight leading-[1.05] mb-8 flex flex-col justify-center items-center gap-y-2 pointer-events-auto cursor-text">
                            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2">
                                <span>Master</span>
                                <RotatingText
                                    texts={['Outcome-Based', 'Competency', 'Skills', 'Performance']}
                                    mainClassName="px-4 bg-[#2563eb] text-white overflow-hidden py-1 justify-center rounded-xl shadow-xl shadow-blue-600/20"
                                    staggerFrom={"last"}
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "-120%" }}
                                    staggerDuration={0.025}
                                    splitLevelClassName="overflow-hidden pb-1"
                                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                    rotationInterval={2500}
                                />
                            </div>
                            <span>Education with Precision.</span>
                        </h1>
                        <p className="hero-text text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed pointer-events-auto cursor-text">
                            A completely unified architecture that bridges the gap between curriculum design, assessment, and accreditation reporting.
                        </p>
                        <div className="hero-text flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto">
                            <Button
                                size="lg"
                                className="h-14 px-10 rounded-full bg-white hover:bg-slate-100 text-slate-950 text-base font-black w-full sm:w-auto shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-105"
                                onClick={handleLogin}
                            >
                                Access Institutional Dashboard
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-10 rounded-full border-2 border-white/10 text-white hover:text-white hover:bg-white/10 text-base font-bold w-full sm:w-auto bg-transparent backdrop-blur-md transition-all duration-300"
                                onClick={() => scrollToSection('how')}
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
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-16 items-center">
                        <div className="why-item lg:col-span-6">
                            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">The Problem We Solve</h2>
                            <h3 className="text-4xl md:text-[54px] font-black text-[#0f172a] tracking-tight leading-[1.1] mb-14 transition-all duration-300">
                                Traditional grading tells you <span className="relative z-10 inline-block after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[10px] md:after:h-[14px] after:bg-blue-100/80 after:-z-10">what</span> a student scored, not <span className="relative z-10 inline-block after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[10px] md:after:h-[14px] after:bg-blue-100/80 after:-z-10">what</span> they learned.
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* The Old Way Card */}
                                <div className="p-6 rounded-[1.5rem] border border-rose-100 bg-rose-50/20 flex flex-col gap-4 items-start group hover:bg-rose-50/40 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-rose-100 flex flex-col items-center justify-center shrink-0 shadow-sm shadow-rose-100/30 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-4deg]">
                                        <X size={18} className="text-[#F43F5E] mb-0.5" strokeWidth={3} />
                                        <div className="w-3 h-[2px] bg-[#F43F5E] rounded-full opacity-80" />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="font-bold text-[#0f172a] text-lg mb-2 tracking-tight">The Old Way</h4>
                                        <p className="text-slate-500 text-[15px] leading-relaxed">Siloed course content, unstructured assessments, and manual spreadsheet calculations.</p>
                                    </div>
                                </div>

                                {/* The OBE 360 Way Card */}
                                <div className="p-6 rounded-[1.5rem] border border-blue-600/10 bg-blue-50/30 flex flex-col gap-4 items-start group hover:bg-blue-50/50 hover:border-blue-600/20 transition-all duration-300 shadow-lg shadow-blue-600/[0.02]">
                                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[4deg]">
                                        <CheckCircle2 size={24} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="font-bold text-blue-600 text-lg mb-2 tracking-tight">OBE 360 Advantage</h4>
                                        <p className="text-slate-600 text-[15px] leading-relaxed font-medium">Automated relational mapping with real-time attainment calculation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative why-item lg:col-span-4 w-full">
                            <BorderGlow
                                className="w-full h-full"
                                edgeSensitivity={30}
                                glowColor="210 100 60"
                                backgroundColor="#0f172a"
                                borderRadius={48}
                                glowRadius={40}
                                glowIntensity={1.5}
                                coneSpread={25}
                                animated={true}
                                colors={['#3b82f6', '#818cf8', '#60a5fa']}
                            >
                                <div className="p-8 md:p-14 relative w-full h-full min-h-[500px] flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                        <Network size={320} className="text-white" />
                                    </div>
                                    <h4 className="text-white font-black text-2xl mb-10 relative z-10 tracking-tight">System Data Flow</h4>
                                    <div className="space-y-5 relative z-10">
                                        {['Program (PLOs)', 'Course (CLOs)', 'Assessments (Questions)', 'Student Attainment (%)'].map((item, i) => (
                                            <div key={i} className="flex items-center gap-5 bg-[#1e293b]/40 p-5 rounded-3xl border border-white/5 backdrop-blur-md relative z-10 shadow-xl shadow-black/20">
                                                <div className="bg-[#2563eb] text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20">{i + 1}</div>
                                                <span className="text-white font-bold text-lg tracking-tight">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </BorderGlow>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. How it Works (Stepper) */}
            <section id="how" ref={howRef} className="py-24 bg-[#F8FAFC] relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    <Ribbons
                        baseThickness={30}
                        colors={["#2563eb", "#0ea5e9", "#38bdf8"]}
                        speedMultiplier={0.5}
                        maxAge={500}
                        enableFade={false}
                        enableShaderEffect={false}
                    />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pointer-events-none">
                    <div className="text-center mb-20 pointer-events-auto">
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
                            <div key={idx} className="how-step relative z-10 flex flex-col items-center text-center pointer-events-auto group">
                                <div className="w-24 h-24 rounded-full bg-white border-[6px] border-[#F8FAFC] shadow-xl flex items-center justify-center text-blue-600 mb-6 relative transition-transform duration-300 group-hover:scale-110">
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
            <section id="modules" ref={modulesRef} className="py-20 h-screen bg-[#020617] text-white relative overflow-hidden">
                {/* Visual Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.08)_0%,_transparent_70%)] pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 items-center">

                        {/* Left Side: 60% */}
                        <div className="w-full lg:w-[60%]">
                            <div className="mb-14 text-center lg:text-left">
                                <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.2em] mb-3">Platform Capabilities</h2>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white leading-[1.1]">
                                    Core Modules <span className="text-slate-500 italic font-serif opacity-80">Overview.</span>
                                </h3>
                                <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed mx-auto lg:mx-0">
                                    Everything required to digitize an educational institution in one secure, unified architecture.
                                </p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                            >
                                {[
                                    {
                                        icon: <Settings className="text-blue-400" size={28} />,
                                        title: "Central Admin",
                                    },
                                    {
                                        icon: <Users className="text-indigo-400" size={28} />,
                                        title: "User Management",
                                    },
                                    {
                                        icon: <FileSpreadsheet className="text-emerald-400" size={28} />,
                                        title: "Assessment",
                                    },
                                    {
                                        icon: <Calculator className="text-amber-400" size={28} />,
                                        title: "Smart Grading",
                                    },
                                    {
                                        icon: <BarChart3 className="text-rose-400" size={28} />,
                                        title: "Analytics",
                                    }
                                ].map((module, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className="h-full group"
                                    >
                                        <BorderGlow className="h-full rounded-[1.5rem]">
                                            <div className="module-card bg-slate-900/80 border border-white/5 py-6 px-4 sm:px-6 rounded-[1.5rem] backdrop-blur-2xl transition-all duration-300 group-hover:-translate-y-1 flex flex-col items-center justify-center text-center h-full">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-950/80 flex items-center justify-center mb-4 border border-white/[0.03] shadow-inner transition-transform duration-300 group-hover:scale-110">
                                                    {module.icon}
                                                </div>
                                                <h3 className="text-[1.05rem] font-bold text-white tracking-tight leading-snug">{module.title}</h3>
                                            </div>
                                        </BorderGlow>
                                    </motion.div>
                                ))}

                                {/* Featured Module: Official Reporting */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                    className="h-full group"
                                >
                                    <BorderGlow className="h-full rounded-[1.5rem]" color="rgba(59, 130, 246, 0.5)">
                                        <div className="module-card bg-gradient-to-br from-blue-600/90 to-indigo-700/90 border border-blue-400/20 py-6 px-4 sm:px-6 rounded-[1.5rem] shadow-2xl shadow-blue-900/20 transition-all duration-300 group-hover:-translate-y-1 flex flex-col items-center text-center justify-center relative overflow-hidden h-full">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]"></div>
                                            <div className="w-14 h-14 rounded-full bg-slate-950/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 shadow-xl transition-transform duration-500 group-hover:rotate-[360deg]">
                                                <ShieldCheck className="text-white" size={28} />
                                            </div>
                                            <h3 className="text-[1.15rem] font-black text-white tracking-tight leading-snug relative z-10">Official Reporting</h3>
                                        </div>
                                    </BorderGlow>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Right Side: 40% (Abstract SVG Illustration) */}
                        <div className="w-full lg:w-[40%] flex justify-center mt-8 lg:mt-0 relative perspective-1000">
                            <div className="relative w-full max-w-[400px] aspect-square transform-gpu hover:rotate-y-12 transition-transform duration-700 ease-out">
                                {/* Soft Glow Backdrop */}
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[80px]"></div>

                                {/* SVG Orbital Rings */}
                                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full animate-[spin_40s_linear_infinite] drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" strokeDasharray="4 4" />
                                    <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="1" strokeDasharray="10 5" />
                                    <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(14, 165, 233, 0.6)" strokeWidth="0.5" />
                                </svg>

                                {/* Inner Reverse Spin Ring */}
                                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full animate-[spin_30s_linear_infinite_reverse]">
                                    <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="2 8" />
                                </svg>

                                {/* Central Glowing Orb Core */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-tr from-blue-700 to-sky-400 rounded-full shadow-[0_0_60px_rgba(37,99,235,0.8)] flex items-center justify-center border border-white/30 z-20">
                                    <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center shadow-inner">
                                        <ObeLogo className="w-10 h-10 text-white animate-pulse" />
                                    </div>
                                </div>

                                {/* Floating Satellite Nodes */}
                                <motion.div
                                    animate={{ y: [0, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="absolute top-[8%] left-[15%] w-14 h-14 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-[1rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 z-30"
                                >
                                    <Settings size={22} className="text-indigo-400" />
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 20, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                    className="absolute bottom-[15%] right-[5%] w-16 h-16 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-[1.2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 z-30"
                                >
                                    <Users size={26} className="text-blue-400" />
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 2.5 }}
                                    className="absolute top-[28%] right-[2%] w-12 h-12 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 z-30"
                                >
                                    <Calculator size={18} className="text-emerald-400" />
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 12, 0] }}
                                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1.5 }}
                                    className="absolute bottom-[25%] left-[8%] w-12 h-12 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-2xl shadow-rose-500/20 z-30"
                                >
                                    <BarChart3 size={18} className="text-rose-400" />
                                </motion.div>
                            </div>
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

            {/* 6. Team Showcase Section */}
            <TeamSection />

            {/* 7. Contact Us Section */}
            <ContactSection />

            {/* Footer */}
            <footer className="bg-[#020617] text-white pt-24 pb-10 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.15)_0%,_transparent_70%)] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                        
                        {/* Brand Column */}
                        <div className="lg:col-span-4 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                                    <ObeLogo className="w-7 h-7 text-white" />
                                </div>
                                <span className="font-black text-2xl tracking-tight text-white">OBE 360</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                                The ultimate Operating System for Outcome-Based Education. Streamlining curriculum mapping, assessments, and continuous quality improvement.
                            </p>
                            <div className="flex items-center gap-3">
                                {/* Social Status Bubble */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    Systems Operational
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="lg:col-span-2 lg:col-start-6 flex flex-col">
                            <h4 className="font-bold text-white mb-6">Product</h4>
                            <ul className="flex flex-col gap-4">
                                {['Features', 'Integrations', 'Pricing', 'Changelog'].map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors font-medium">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources */}
                        <div className="lg:col-span-2 flex flex-col">
                            <h4 className="font-bold text-white mb-6">Resources</h4>
                            <ul className="flex flex-col gap-4">
                                {['Documentation', 'API Reference', 'Community', 'Blog'].map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors font-medium">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="lg:col-span-3 flex flex-col">
                            <h4 className="font-bold text-white mb-6">Contact & Legal</h4>
                            <ul className="flex flex-col gap-4">
                                <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors font-medium">support@obe360.com</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors font-medium">+92 300 0000000</a></li>
                                <li className="pt-2"><a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                        
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-sm text-center md:text-left font-medium">
                            &copy; {new Date().getFullYear()} OBE 360 Inc. All rights reserved.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            Designed with <span className="text-blue-500">♥</span> for modern educators.
                        </div>
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
