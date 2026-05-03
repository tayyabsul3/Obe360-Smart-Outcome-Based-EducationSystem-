import { LogOut, User } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminHeader() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="h-[56px] bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0">
            {/* Left: Branding/Empty Space */}
            <div className="flex items-center">
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
