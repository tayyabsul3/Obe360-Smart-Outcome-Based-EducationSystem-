import { User, LogOut, ChevronDown, ChevronRight, Menu, Home, Book, Calculator, GraduationCap, HelpCircle } from 'lucide-react';
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
import OnboardingGuide from '@/components/OnboardingGuide';

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
    const [onboardingOpen, setOnboardingOpen] = useState(false);

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
        <header className="h-[68px] bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between px-8 z-50 shrink-0 shadow-md">
            {/* Left: Branding & Selectors */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/10 rotate-3 transition-transform">
                        <ObeLogo className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-base text-white tracking-tight">
                        OBE360
                        {user?.user_metadata?.organization_code && (
                            <span className="text-slate-500 font-light ml-2 border-l border-slate-850 pl-2">
                                {user.user_metadata.organization_code}
                            </span>
                        )}
                    </span>
                </div>

                <div className="flex items-center gap-6 border-l border-slate-800/80 pl-8">
                    {/* Academic Session */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Academic Session</span>
                        <Select value={workingSemesterId} onValueChange={setWorkingSemesterId}>
                            <SelectTrigger className="h-8 bg-slate-900 border-slate-800 text-white w-[160px] text-xs font-medium rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                <SelectValue placeholder="Session..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-800 bg-slate-950 text-white shadow-2xl">
                                {semesters.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="font-medium text-xs">
                                        {s.name} {s.is_active && "(Current)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Teacher-Specific Program Semester */}
                    {role === 'teacher' && (
                        <div className="flex flex-col gap-1 animate-in slide-in-from-left-4 duration-500">
                            <span className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Curriculum Focus</span>
                            <Select
                                value={selectedProgramId ? `${selectedProgramId}-${selectedSemesterNum}` : ""}
                                onValueChange={handleProgramSemesterChange}
                            >
                                <SelectTrigger className="h-8 bg-blue-950/40 text-blue-200 border-blue-900/50 w-[200px] text-xs font-medium rounded-lg hover:bg-blue-900/30 transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                    <SelectValue placeholder="Select Semester..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-800 bg-slate-950 text-white shadow-2xl max-h-[400px]">
                                    {programSemesterOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id} className="font-medium text-xs">{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-8">
                <Button 
                    variant="ghost" 
                    onClick={() => setOnboardingOpen(true)}
                    className="h-9 px-4 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/50 gap-1.5 transition-all"
                >
                    <HelpCircle size={15} /> Guide
                </Button>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-[11px] font-semibold text-slate-200 leading-none mb-0.5">
                            {user?.user_metadata?.full_name || 'User'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-[9px] font-medium text-slate-500 hover:text-red-400 transition-colors text-right"
                        >
                            Log Out
                        </button>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 border border-white/5 flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-600/10">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            <OnboardingGuide 
                open={onboardingOpen} 
                onOpenChange={setOnboardingOpen} 
                role={role || 'teacher'} 
            />
        </header>
    );
}

