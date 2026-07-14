import { LogOut, User, CalendarDays, ExternalLink, HelpCircle } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useSemesterStore from '@/store/semesterStore';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import OnboardingGuide from '@/components/OnboardingGuide';

export default function AdminHeader() {
    const { user, logout } = useAuthStore();
    const { workingSemesterId, semesters } = useSemesterStore();
    const navigate = useNavigate();
    const [onboardingOpen, setOnboardingOpen] = useState(false);

    const activeSemester = semesters.find(s => s.id === workingSemesterId);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="h-[68px] bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm shrink-0">
            {/* Left: Active Session Info */}
            <div className="flex items-center gap-6">
                {activeSemester ? (
                    <div className="flex items-center gap-3.5 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="bg-slate-50 text-slate-600 border border-slate-100 p-2.5 rounded-xl shadow-sm">
                            <CalendarDays size={16} className="text-slate-500" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none mb-1">Active Session</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800 tracking-tight">{activeSemester.name}</span>
                                <Link to="/admin/settings">
                                    <Badge variant="outline" className="h-5 px-2 rounded-lg border-slate-200 text-[9px] font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer gap-1 shadow-sm">
                                        Change <ExternalLink size={8} />
                                    </Badge>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-orange-600">
                        <div className="bg-orange-50/55 p-2.5 rounded-xl border border-orange-100">
                            <CalendarDays size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-orange-400 tracking-wider uppercase leading-none mb-1">Active Session</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">No Active Session</span>
                                <Link to="/admin/settings">
                                    <Button variant="link" className="text-[10px] h-auto p-0 font-bold uppercase text-blue-600">Set Now</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-8">
                <Button 
                    variant="ghost" 
                    onClick={() => setOnboardingOpen(true)}
                    className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 gap-1.5 transition-all"
                >
                    <HelpCircle size={15} className="text-slate-400" /> Guide
                </Button>

                <div className="flex items-center gap-3.5 border-l border-slate-100 pl-8">
                    <div className="text-right flex flex-col items-end justify-center">
                        <p className="text-sm font-bold text-slate-800 tracking-tight mb-0.5">
                            {user?.user_metadata?.full_name || 'Administrator'}
                        </p>
                        <button
                            onClick={handleLogout}
                            className="text-[10px] font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                            <LogOut size={11} /> Sign Out
                        </button>
                    </div>
                    <Link to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer ring-1 ring-slate-100">
                        {user?.email?.charAt(0).toUpperCase()}
                    </Link>
                </div>
            </div>

            <OnboardingGuide 
                open={onboardingOpen} 
                onOpenChange={setOnboardingOpen} 
                role="admin" 
            />
        </header>
    );
}
