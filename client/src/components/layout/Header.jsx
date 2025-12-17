import { Bell, User, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
    const { user, logout, role } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Generate readable breadcrumb from path
    const renderBreadcrumbs = () => {
        const path = location.pathname;
        if (path === '/dashboard') return <span className="font-semibold text-gray-800">Dashboard</span>;

        const parts = path.split('/').filter(Boolean);

        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="hover:text-gray-900 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>
                    Dashboard
                </span>
                {parts.slice(1).map((part, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-gray-400" />
                        <span className={`capitalize ${index === parts.slice(1).length - 1 ? 'font-semibold text-gray-800' : ''}`}>
                            {part.replace(/-/g, ' ')}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
            {/* Breadcrumbs */}
            <div>
                {renderBreadcrumbs()}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-blue-600">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Notifications</DialogTitle>
                            <DialogDescription>
                                The notification system is coming soon! Stay tuned for updates.
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none"
                    >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-semibold text-gray-700 leading-none">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500 mt-1 capitalize">{role || 'Role'}</p>
                        </div>
                        <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                            </div>
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => navigate('/profile')}
                            >
                                <User size={16} /> Profile
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close (Optional/Simple implementation) */}
            {isProfileOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsProfileOpen(false)}
                ></div>
            )}
        </header>
    );
}
