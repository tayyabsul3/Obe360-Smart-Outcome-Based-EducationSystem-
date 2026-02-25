import { Bell, LogOut, Search, User } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

export default function AdminHeader() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="h-[56px] bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0">
            {/* Left: Global Search (Optional but handy for Admin) */}
            <div className="flex items-center w-1/3">
                <div className="relative w-full max-w-[400px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search programs, teachers, or courses..."
                        className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm rounded-full"
                    />
                </div>
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 relative transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>

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
                    <div className="w-10 h-10 rounded-full bg-[#2C3E50] border-2 border-slate-200 flex items-center justify-center text-white font-bold shadow-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}
