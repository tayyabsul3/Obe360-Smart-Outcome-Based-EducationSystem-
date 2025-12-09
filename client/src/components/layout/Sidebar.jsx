import { NavLink } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Briefcase,
    FileText,
    Settings,
    Activity,
    Book,
    GitMerge,
    ClipboardList,
    Calculator,
    BarChart,
    Trophy,
    MessageSquare,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ObeLogo from '@/components/Logo';

export default function Sidebar({ collapsed, setCollapsed }) {
    const role = useAuthStore((state) => state.role) || 'teacher'; // Default to teacher

    // Admin Navigation
    const adminLinks = [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'User Management', to: '/admin/users', icon: Users },
        { name: 'Academic Programs', to: '/admin/programs', icon: GraduationCap },
        { name: 'Curriculum Manager', to: '/admin/curriculum', icon: BookOpen },
        { name: 'Course Allocation', to: '/admin/allocation', icon: Briefcase },
        { name: 'Reports Center', to: '/admin/reports', icon: FileText },
        { name: 'Settings', to: '/admin/settings', icon: Settings },
    ];

    // Teacher Navigation
    const teacherLinks = [
        { name: 'Dashboard', to: '/dashboard', icon: Activity },
        { name: 'My Courses', to: '/teacher/courses', icon: Book },
        { name: 'OBE Mapping', to: '/teacher/obe-mapping', icon: GitMerge },
        { name: 'Assessments', to: '/teacher/assessments', icon: ClipboardList },
        { name: 'Gradebook', to: '/teacher/gradebook', icon: Calculator },
        { name: 'Analytics', to: '/teacher/analytics', icon: BarChart },
        { name: 'Gamification', to: '/teacher/gamification', icon: Trophy },
        { name: 'Feedback', to: '/teacher/feedback', icon: MessageSquare },
    ];

    const links = role === 'admin' ? adminLinks : teacherLinks;

    return (
        <aside
            className={cn(
                "h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 relative",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header / Logo */}
            <div className="h-16 flex items-center justify-center border-b border-slate-700">
                {collapsed ? (
                    <ObeLogo className="w-8 h-8 text-blue-500" />
                ) : (
                    <div className="flex items-center gap-2">
                        <ObeLogo className="w-8 h-8 text-blue-500" />
                        <span className="font-bold text-2xl tracking-wider">OBE360</span>
                    </div>
                )}
            </div>

            {/* Collapse Toggle Button (Floating) */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-20 bg-slate-800 text-white hover:bg-slate-700 rounded-full h-6 w-6 border border-slate-600 z-50 p-0 shadow-md"
                onClick={() => setCollapsed(!collapsed)}
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </Button>


            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {links.map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                end={link.to === '/dashboard'} // Exact match for dashboard
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    )
                                }
                            >
                                <link.icon size={22} className="min-w-[22px]" />
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity duration-300",
                                    collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                                )}>
                                    {link.name}
                                </span>

                                {/* Tooltip for collapsed mode */}
                                {collapsed && (
                                    <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {link.name}
                                    </div>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
                <Button variant="ghost" className={cn("w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800", collapsed && "justify-center px-0")}>
                    <HelpCircle size={22} />
                    {!collapsed && <span className="ml-3">Help & Support</span>}
                </Button>
            </div>
        </aside>
    );
}
