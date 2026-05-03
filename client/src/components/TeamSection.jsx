import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'lucide-react';

const teamMembers = [
    {
        name: "Fahad",
        role: "Project Manager",
        bio: "Driving project delivery and team synchronization with 2 years of proven industry experience orchestrating successful software lifecycles.",
        // Generic male avatar
        image: "https://avatar.iran.liara.run/public/boy?username=Fahad",
        color: "from-blue-500 to-indigo-600"
    },
    {
        name: "Asim",
        role: "Frontend Developer",
        bio: "Specializing in crafting premium, performant user interfaces with solid React development experience focused on pixel-perfect execution.",
        image: "https://avatar.iran.liara.run/public/boy?username=Asim",
        color: "from-indigo-500 to-sky-500"
    },
    {
        name: "Tayyab",
        role: "Product Developer",
        bio: "Architecting scalable data systems and core platform infrastructure with 2 years of deep product development experience.",
        image: "https://avatar.iran.liara.run/public/boy?username=Tayyab",
        color: "from-sky-500 to-blue-500"
    }
];

export default function TeamSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const textRefs = useRef([]);

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.getAttribute('data-index'));
                    setActiveIndex(idx);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        textRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <section id="team" className="bg-[#020617] text-white relative">
            {/* Top fading border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

            <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
                <div className="flex flex-col md:flex-row relative">

                    {/* LEFT SIDE: Sticky Image Showcase (App-style display) */}
                    <div className="w-full md:w-1/2 md:sticky md:top-0 h-[40vh] md:h-screen flex items-center justify-center pt-24 md:pt-0 overflow-hidden relative z-10">
                        {/* Abstract Glow Behind Image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-[80%] aspect-square rounded-full blur-[100px] opacity-30 bg-gradient-to-br ${teamMembers[activeIndex].color} transition-all duration-1000`}></div>
                        </div>

                        <div className="relative w-full max-w-[400px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-slate-900 group">
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.img
                                    key={activeIndex}
                                    src={teamMembers[activeIndex].image}
                                    alt={teamMembers[activeIndex].name}
                                    initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute inset-0 w-full h-full object-cover origin-center"
                                />
                            </AnimatePresence>

                            {/* Inner Glass border effect overlay */}
                            <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-[2rem] pointer-events-none"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Scrolling Text Content */}
                    <div className="w-full md:w-1/2 relative z-20 pb-24 md:pb-0">
                        {teamMembers.map((member, idx) => (
                            <div
                                key={idx}
                                ref={el => textRefs.current[idx] = el}
                                data-index={idx}
                                className="min-h-[60vh] md:min-h-screen flex flex-col justify-center py-20 pr-4 pl-4 md:pl-16 lg:pl-24"
                            >
                                <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ margin: "-20% 0px -20% 0px" }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={`transition-opacity duration-500 ${activeIndex === idx ? 'opacity-100' : 'opacity-30'}`}
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6">
                                        <User size={14} /> Team Structure
                                    </div>
                                    <h3 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-2">
                                        {member.name}
                                    </h3>
                                    <h4 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${member.color} bg-clip-text text-transparent mb-6`}>
                                        {member.role}
                                    </h4>
                                    <p className="text-lg text-slate-400 leading-relaxed font-medium max-w-lg">
                                        {member.bio}
                                    </p>
                                </motion.div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
