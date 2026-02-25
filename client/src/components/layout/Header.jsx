import { Bell, User, LogOut, ChevronDown, ChevronRight, Menu, Home, Book, Calculator, GraduationCap, Settings, Mail } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useSemesterStore from '@/store/semesterStore';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ObeLogo from '@/components/Logo';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function Header() {
    const { user, logout, role } = useAuthStore();
    const {
        workingSemesterId,
        semesters,
        programs,
        selectedProgramId,
        selectedSemesterNum,
        setWorkingSemesterId,
        setSelectedProgramId,
        setSelectedSemesterNum,
        fetchSemesters,
        fetchPrograms
    } = useSemesterStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchSemesters();
        fetchPrograms();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Construct "Program-Semester" options for teachers
    const programSemesterOptions = [];
    programs.forEach(p => {
        for (let i = 1; i <= 8; i++) {
            programSemesterOptions.push({
                id: `${p.id}-${i}`,
                label: `${p.code} - Semester ${i}`,
                programId: p.id,
                semesterNum: i
            });
        }
    });

    const handleProgramSemesterChange = (value) => {
        const option = programSemesterOptions.find(o => o.id === value);
        if (option) {
            setSelectedProgramId(option.programId);
            setSelectedSemesterNum(option.semesterNum);
            navigate('/teacher/courses');
        }
    };

    return (
        <header className="h-[60px] bg-[#2C3E50] border-b border-slate-700 text-white flex items-center justify-between px-4 z-50 shrink-0 shadow-lg">
            {/* Left: Branding & Selectors */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="bg-blue-600 p-1 rounded-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                        <ObeLogo className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-white">Qobe</span>
                </div>

                <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
                    {/* Academic Session */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Academic Session</span>
                        <Select value={workingSemesterId} onValueChange={setWorkingSemesterId}>
                            <SelectTrigger className="h-9 bg-slate-800/50 text-white border-slate-700 w-[180px] text-xs font-bold rounded-xl focus:ring-0">
                                <SelectValue placeholder="Session..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-700 bg-[#2C3E50] text-white shadow-2xl">
                                {semesters.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="font-bold text-xs">
                                        {s.name} {s.is_active && "(Current)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Teacher-Specific Program Semester */}
                    {role === 'teacher' && (
                        <div className="flex flex-col gap-1 animate-in slide-in-from-left-4 duration-500">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Curriculum Focus</span>
                            <Select
                                value={selectedProgramId ? `${selectedProgramId}-${selectedSemesterNum}` : ""}
                                onValueChange={handleProgramSemesterChange}
                            >
                                <SelectTrigger className="h-9 bg-blue-600/20 text-blue-100 border-blue-500/30 w-[220px] text-xs font-bold rounded-xl hover:bg-blue-600/30 transition-all">
                                    <SelectValue placeholder="Select Semester..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-700 bg-[#2C3E50] text-white shadow-2xl max-h-[400px]">
                                    {programSemesterOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id} className="font-bold text-xs">{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 border-r border-slate-700 pr-6 mr-6">
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-all relative group">
                        <Bell size={20} className="text-slate-400 group-hover:text-white" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#2C3E50]"></span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-all group">
                        <Mail size={20} className="text-slate-400 group-hover:text-white" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-all group" onClick={() => navigate('/profile')}>
                        <Settings size={20} className="text-slate-400 group-hover:text-white" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-[11px] font-black text-white uppercase tracking-tight leading-none mb-0.5">
                            {user?.user_metadata?.full_name || 'User'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-[8px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase tracking-[0.2em]"
                        >
                            Log Out
                        </button>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white/10 flex items-center justify-center font-bold text-sm shadow-lg">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}

