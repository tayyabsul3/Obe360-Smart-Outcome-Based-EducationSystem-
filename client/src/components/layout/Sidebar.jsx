import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import useSemesterStore from '@/store/semesterStore';
import {
    Search,
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    BookOpen,
    GitMerge,
    ClipboardList,
    Calculator,
    Users,
    FileText,
    MessageSquare,
    Activity,
    Settings,
    Layers,
    BarChart3,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function Sidebar() {
    const { user } = useAuthStore();
    const { workingSemesterId } = useSemesterStore();
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [search, setSearch] = useState('');
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeModule, setActiveModule] = useState(null); // 'clo', 'plo', etc.

    useEffect(() => {
        if (user?.id && workingSemesterId) {
            fetchSections();
        }
    }, [user?.id, workingSemesterId]);

    const fetchSections = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/semesters/sections/${user.id}/${workingSemesterId}`);
            if (res.ok) {
                setSections(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSections = sections.filter(s =>
        s.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.course?.code?.toLowerCase().includes(search.toLowerCase())
    );

    // Primary Sidebar Modules (Main Dropdown Buttons)
    const modules = [
        {
            id: 'clo',
            label: 'CLO',
            icon: GitMerge,
            items: [
                { label: 'CLO List', to: `clos` },
                { label: 'CLO Attainment', to: `attainment` },
                { label: 'CLO Graph', to: `graph` },
                { label: 'CLO Comments', to: `comments` }
            ]
        },
        {
            id: 'plo',
            label: 'PLO',
            icon: Layers,
            items: [
                { label: 'PLO Mapping', to: `plo-mapping` },
                { label: 'PLO Attainment', to: `plo-attainment` }
            ]
        },
        {
            id: 'view_class',
            label: 'View Class',
            icon: BookOpen,
            items: [
                { label: 'Course Content', to: `content` },
                { label: 'Teaching Plan', to: `plan` }
            ]
        },
        {
            id: 'assessments',
            label: 'Assessments Marks',
            icon: ClipboardList,
            items: [
                { label: 'Activity List', to: `assessments` },
                { label: 'Direct Entry', to: `gradebook` },
                { label: 'Excel Upload', to: `upload` }
            ]
        },
        {
            id: 'students',
            label: 'Students/Class Assistants',
            icon: Users,
            items: [
                { label: 'Class Students', to: `students` },
                { label: 'Student Attendance', to: `attendance` },
                { label: 'Class Assistants', to: `assistants` }
            ]
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: FileText,
            items: [
                { label: 'Course Report', to: `report` },
                { label: 'OBE Summary', to: `summary` }
            ]
        }
    ];

    const isCourseView = location.pathname.includes('/course/');

    return (
        <div className="flex h-screen bg-white">
            {/* Primary Sidebar - Class Selection */}
            <aside className={cn(
                "w-[260px] border-r border-slate-200 flex flex-col transition-all duration-300",
                isCourseView ? "bg-slate-50" : "bg-white"
            )}>
                <div className="p-4 bg-slate-100/50 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search Course Code or Name"
                            className="pl-9 h-9 bg-white text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="bg-[#337AB7] text-white px-4 py-2 text-sm font-bold flex justify-between items-center cursor-pointer">
                        <span>My Class Rooms</span>
                        <ChevronDown size={14} />
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-4 text-xs text-slate-400 italic">Loading classes...</div>
                        ) : filteredSections.length > 0 ? (
                            filteredSections.map((section) => (
                                <div
                                    key={section.id}
                                    onClick={() => navigate(`/teacher/course/${section.course_id}`)}
                                    className={cn(
                                        "p-3 cursor-pointer hover:bg-blue-50 transition-colors group",
                                        courseId === section.course_id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                                    )}
                                >
                                    <h4 className="font-bold text-[13px] text-slate-900 group-hover:text-blue-700">
                                        {section.course?.code}- {section.course?.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {section.course?.code} ({section.name})
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-xs text-slate-400 italic text-center">No classes found for this semester.</div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Secondary Sidebar - Module Specific Items (Only in Course View) */}
            {isCourseView && (
                <aside className="w-[200px] bg-[#E9EEF3] border-r border-slate-200 flex flex-col z-10 shadow-lg">
                    <div className="flex-1 pt-2 overflow-y-auto">
                        <div className="space-y-1">
                            {modules.map((mod) => (
                                <div key={mod.id} className="px-2">
                                    <button
                                        onClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded text-[12px] font-bold transition-all",
                                            activeModule === mod.id
                                                ? "bg-[#337AB7] text-white shadow-md"
                                                : "text-slate-600 hover:bg-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <mod.icon size={16} />
                                            <span>{mod.label}</span>
                                        </div>
                                        {activeModule === mod.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>

                                    {/* Dropdown Items */}
                                    {activeModule === mod.id && (
                                        <div className="mt-1 mb-2 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                            {mod.items.map((item) => (
                                                <NavLink
                                                    key={item.to}
                                                    to={`/teacher/course/${courseId}/${item.to}`}
                                                    className={({ isActive }) => cn(
                                                        "block px-3 py-1.5 rounded text-[11px] font-semibold transition-colors",
                                                        isActive
                                                            ? "text-blue-700 bg-white shadow-sm border-l-2 border-blue-600"
                                                            : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                                    )}
                                                >
                                                    {item.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-300">
                        <button
                            onClick={() => navigate('/teacher/courses')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold"
                        >
                            <ArrowLeft size={14} /> Back to Courses
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );
}

