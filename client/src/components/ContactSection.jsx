import { Mail, Phone, MapPin, ArrowRight, Layers } from 'lucide-react';

export default function ContactSection() {
    return (
        <section id="contact" className="py-16 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 items-center lg:gap-16">

                    {/* Left Column: Contact Info */}
                    <div className="w-full lg:w-[45%] flex flex-col pt-2">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                            Let's Connect
                        </h2>
                        <p className="text-base text-slate-500 font-medium leading-relaxed mb-8 max-w-md">
                            Whether you want to implement outcome-based education at your institution, explore a strategic partnership, or simply learn more about OBE 360, this is the place to start the conversation.
                        </p>

                        <div className="flex flex-col gap-4">
                            {/* Email Card */}
                            <div className="group bg-[#F8FAFC] border border-slate-200 p-5 rounded-3xl flex items-start gap-4 hover:bg-slate-50 hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                                    <Mail className="text-blue-600 group-hover:text-white transition-colors" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900 mb-0.5">support@obe360.com</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-snug">Reach out for implementation support, platform access, and general inquiries.</p>
                                </div>
                            </div>

                            {/* Phone Card */}
                            <div className="group bg-[#F8FAFC] border border-slate-200 p-5 rounded-3xl flex items-start gap-4 hover:bg-slate-50 hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                                    <Phone className="text-blue-600 group-hover:text-white transition-colors" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900 mb-0.5">+92 (Country Code Only)</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-snug">Available during working hours for direct onboarding and administrative support.</p>
                                </div>
                            </div>

                            {/* Address Card */}
                            <div className="group bg-[#F8FAFC] border border-slate-200 p-5 rounded-3xl flex items-start gap-4 hover:bg-slate-50 hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                                    <MapPin className="text-blue-600 group-hover:text-white transition-colors" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900 mb-0.5">Rawalpindi Saddar</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-snug">Primary operating headquarters for the OBE 360 development team.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Contact Form UI */}
                    <div className="w-full lg:w-[55%]">
                        <div className="bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
                            {/* Decorative Top Gradient */}
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400"></div>

                            <div className="flex items-center gap-3 mb-6">
                                <Layers className="text-blue-600" size={24} />
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Start a conversation</h3>
                            </div>

                            <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-slate-700">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            className="w-full border border-slate-200 bg-[#F8FAFC] text-slate-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-slate-700">What Do You Do?</label>
                                        <input
                                            type="text"
                                            placeholder="e.g Dean, Professor, Admin"
                                            className="w-full border border-slate-200 bg-[#F8FAFC] text-slate-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            className="w-full border border-slate-200 bg-[#F8FAFC] text-slate-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-slate-700">Phone</label>
                                        <div className="flex relative">
                                            <div className="absolute left-0 inset-y-0 flex items-center justify-center px-4 border-r border-slate-200 bg-[#F1F5F9] rounded-l-xl z-10 pointer-events-none">
                                                <span className="text-[13px] font-bold text-slate-600">PK +92</span>
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="Enter phone number"
                                                className="w-full border border-slate-200 bg-[#F8FAFC] text-slate-900 pl-24 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-sm relative"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-slate-700">What would you like to discuss?</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Tell us about your institutional requirements or the kind of support you are looking for."
                                        className="w-full border border-slate-200 bg-[#F8FAFC] text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-sm resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 mt-5 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed sm:max-w-[200px]">
                                        By submitting, you reach out to our team for implementation guidance.
                                    </p>
                                    <button
                                        className="w-full sm:w-auto bg-[#0F172A] hover:bg-blue-600 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors duration-300 shadow-xl shadow-slate-900/10 group whitespace-nowrap text-sm"
                                    >
                                        Send Message
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
