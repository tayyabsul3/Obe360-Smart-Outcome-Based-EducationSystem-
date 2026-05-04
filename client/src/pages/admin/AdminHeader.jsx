import { LogOut, User, CalendarDays, ExternalLink } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useSemesterStore from '@/store/semesterStore';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminHeader() {
    const { user, logout } = useAuthStore();
    const { workingSemesterId, semesters } = useSemesterStore();
    const navigate = useNavigate();

    const activeSemester = semesters.find(s => s.id === workingSemesterId);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="h-[56px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0">
            {/* Left: Active Session Info */}
            <div className="flex items-center gap-4">
                {activeSemester ? (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                            <CalendarDays size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Term</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800">{activeSemester.name}</span>
                                <Link to="/admin/settings">
                                    <Badge variant="outline" className="h-5 px-1.5 rounded-md border-blue-100 text-[9px] font-black text-blue-600 bg-blue-50/50 hover:bg-blue-100 transition-colors cursor-pointer gap-1">
                                        Change <ExternalLink size={8} />
                                    </Badge>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                        <div className="bg-orange-50 p-2 rounded-xl">
                            <CalendarDays size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">No Active Session</span>
                        <Link to="/admin/settings">
                            <Button variant="link" className="text-[10px] h-auto p-0 font-black uppercase text-blue-600">Set Now</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            {user?.user_metadata?.full_name || 'Administrator'}
                        </p>
                        <button
                            onClick={handleLogout}
                            className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                            <LogOut size={12} /> Sign Out
                        </button>
                    </div>
                    <Link to="/profile" className="w-10 h-10 rounded-full bg-[#2C3E50] border-2 border-slate-200 flex items-center justify-center text-white font-bold shadow-sm hover:ring-2 hover:ring-blue-500 hover:border-transparent transition-all cursor-pointer">
                        {user?.email?.charAt(0).toUpperCase()}
                    </Link>
                </div>
            </div>
        </header>
    );
}
