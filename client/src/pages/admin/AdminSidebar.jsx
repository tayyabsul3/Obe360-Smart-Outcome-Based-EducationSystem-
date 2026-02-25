import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    GitMerge,
    Users,
    FileSpreadsheet,
    Settings,
    FileText,
    GraduationCap,
    CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
    const navItems = [
        { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Programs', to: '/admin/programs', icon: GraduationCap },
        { label: 'Courses', to: '/admin/courses', icon: GitMerge },
        { label: 'Faculty', to: '/admin/teachers', icon: Users },
        { label: 'Allocations', to: '/admin/assignments', icon: FileSpreadsheet },
        { label: 'Students', to: '/admin/students', icon: GraduationCap },
        { label: 'Settings', to: '/admin/settings', icon: Settings },
    ];

    return (
        <aside className="w-[220px] bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
            <div className="p-4 bg-slate-100/5">
                <h2 className="text-xl font-black text-white tracking-widest uppercase">Administration</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Institutional OBE Management</p>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => cn(
                            "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 group",
                            isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <item.icon size={16} className={cn(
                            "transition-colors",
                            "group-hover:text-blue-400"
                        )} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                        AD
                    </div>
                    <div>
                        <p className="text-xs font-black text-white uppercase">Administrator</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Super User</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
