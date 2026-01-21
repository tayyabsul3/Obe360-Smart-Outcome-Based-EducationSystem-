import { Bell, User, LogOut, ChevronDown, ChevronRight, Menu } from 'lucide-react';
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
import ObeLogo from '@/components/Logo'; // Import Logo
import TextResizer from '../ui/text-resizer';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

export default function Header() {
    const { user, logout, role } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const isTeacher = role === 'teacher';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Generate readable breadcrumb from path
    const renderBreadcrumbs = () => {
        const path = location.pathname;
        if (path === '/dashboard') return <span className={cn("font-semibold", isTeacher ? "text-blue-50" : "text-gray-800")}>Dashboard</span>;

        const parts = path.split('/').filter(Boolean);

        return (
            <div className={cn("flex items-center gap-2 text-sm", isTeacher ? "text-blue-100" : "text-gray-500")}>
                <span
                    className={cn("transition-colors cursor-pointer", isTeacher ? "hover:text-white" : "hover:text-gray-900")}
                    onClick={() => navigate(isTeacher ? '/teacher/courses' : '/dashboard')}
                >
                    {isTeacher ? 'My Courses' : 'Dashboard'}
                </span>
                {parts.slice(1).map((part, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <ChevronRight size={14} className={isTeacher ? "text-blue-300" : "text-gray-400"} />
                        <span className={`capitalize ${index === parts.slice(1).length - 1 ? (isTeacher ? 'font-semibold text-white' : 'font-semibold text-gray-800') : ''}`}>
                            {part.replace(/-/g, ' ')}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <header className={cn(
            "h-16 flex items-center justify-between px-6 shadow-sm z-10 transition-colors duration-300",
            isTeacher ? "bg-blue-600 border-b border-blue-500 text-white" : "bg-white border-b border-gray-200"
        )}>
            {/* Left Side: Logo (Teacher) & Breadcrumbs */}
            <div className="flex items-center gap-6">
                {isTeacher && (
                    <div className="flex items-center gap-2 mr-4">
                        <div className="bg-white p-1 rounded-md shadow-sm">
                            <ObeLogo className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white drop-shadow-sm">OBE360</span>
                    </div>
                )}
                {renderBreadcrumbs()}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Text Resizer - customized for dark bg if teacher */}
                <div className={isTeacher ? "text-blue-100" : ""}>
                    <TextResizer />
                </div>

                {/* Notifications */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("relative hover:bg-blue-500/50", isTeacher ? "text-blue-100 hover:text-white" : "text-gray-500 hover:text-blue-600")}>
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
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg transition-colors focus:outline-none",
                            isTeacher ? "hover:bg-blue-500 text-white" : "hover:bg-gray-50"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-semibold border-2",
                            isTeacher ? "bg-white text-blue-600 border-blue-400" : "bg-blue-100 text-blue-600 border-transparent"
                        )}>
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className={cn("text-sm font-semibold leading-none", isTeacher ? "text-white" : "text-gray-700")}>
                                {user?.user_metadata?.full_name || 'User'}
                            </p>
                            <p className={cn("text-xs mt-1 capitalize", isTeacher ? "text-blue-200" : "text-gray-500")}>
                                {role || 'Role'}
                            </p>
                        </div>
                        <ChevronDown size={16} className={isTeacher ? "text-blue-200" : "text-gray-400"} />
                    </button>

                    {/* Dropdown Menu - Standard styling (White bg) */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200 z-50">
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

            {/* Click outside to close */}
            {isProfileOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsProfileOpen(false)}
                ></div>
            )}
        </header>
    );
}
