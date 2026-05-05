import { motion } from 'motion/react';
import { User, Code, Briefcase, Rocket } from 'lucide-react';
import BorderGlow from './BorderGlow';

const teamMembers = [
    {
        name: "Fahad Ali Babar",
        role: "Project Manager",
        icon: <Briefcase size={32} />,
        bio: "Driving project delivery and team synchronization with proven expertise in orchestrating successful software lifecycles.",
        color: "from-blue-500 to-indigo-600",
        glow: "210 100 60"
    },
    {
        name: "Muhammad Asim",
        role: "Frontend Developer",
        icon: <Code size={32} />,
        bio: "Specializing in crafting premium, performant user interfaces with solid React development focused on pixel-perfect execution.",
        color: "from-indigo-500 to-sky-500",
        glow: "260 100 70"
    },
    {
        name: "Muhammad Tayyab",
        role: "Product Developer",
        icon: <Rocket size={32} />,
        bio: "Architecting scalable data systems and core platform infrastructure with deep full-stack development experience.",
        color: "from-sky-500 to-blue-500",
        glow: "190 100 60"
    }
];

export default function TeamSection() {
    return (
        <section id="team" className="py-24 bg-[#020617] text-white relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.05)_0%,_transparent_70%)]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.2em] mb-3">Our Visionaries</h2>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-white">
                            The Team Behind <span className="text-blue-500">OBE 360</span>
                        </h3>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                            A group of dedicated engineers committed to revolutionizing the educational landscape through smart technology.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {teamMembers.map((member, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="group"
                        >
                            <BorderGlow 
                                className="h-full rounded-[2.5rem]" 
                                glowColor={member.glow}
                                glowIntensity={1.2}
                                animated={true}
                                borderRadius={40}
                            >
                                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] h-full flex flex-col items-center text-center transition-all duration-500 group-hover:-translate-y-2 group-hover:bg-slate-900/80">
                                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${member.color} flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20 transform transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-110`}>
                                        <div className="text-white">
                                            {member.icon}
                                        </div>
                                    </div>
                                    
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">
                                        <User size={12} /> Team Member
                                    </div>
                                    
                                    <h4 className="text-3xl font-black text-white mb-2 tracking-tight">
                                        {member.name}
                                    </h4>
                                    
                                    <h5 className={`text-lg font-bold bg-gradient-to-r ${member.color} bg-clip-text text-transparent mb-6`}>
                                        {member.role}
                                    </h5>
                                    
                                    <p className="text-slate-400 leading-relaxed font-medium mt-auto">
                                        {member.bio}
                                    </p>

                                    <div className="mt-8 pt-6 border-t border-white/5 w-full flex justify-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                                            <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                                            <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </BorderGlow>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
