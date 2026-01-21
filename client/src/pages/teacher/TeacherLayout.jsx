import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    ChevronRight,
    List,
    GraduationCap,
    BarChart3,
    Settings,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from '@/components/ui/skeleton';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';

export default function TeacherLayout() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openItem, setOpenItem] = useState(""); // Current open accordion item

    useEffect(() => {
        if (user?.id) fetchAssignments();
    }, [user]);

    // Auto-expand accordion based on current URL
    useEffect(() => {
        if (assignments.length > 0) {
            const pathParts = location.pathname.split('/');
            // /teacher/course/:courseId/...
            if (pathParts[2] === 'course' && pathParts[3]) {
                const courseId = pathParts[3];
                // Check if this courseId exists in assignments
                const assignment = assignments.find(a => a.course_id === courseId);
                if (assignment) {
                    setOpenItem(`course-${assignment.course_id}`);
                }
            }
        }
    }, [location.pathname, assignments]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/assignments/teacher/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load your courses");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-7rem)] bg-slate-50/30">
            {/* Persistent Sidebar */}
            <aside className="w-64 border-r bg-white rounded-xl flex flex-col h-full shadow-sm z-20">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="space-y-2 px-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : assignments.length > 0 ? (
                        <Accordion
                            type="single"
                            collapsible
                            value={openItem}
                            onValueChange={setOpenItem}
                            className="space-y-0.5"
                        >
                            {assignments.map((item) => (
                                <AccordionItem key={item.id} value={`course-${item.course_id}`} className="border-none">
                                    <AccordionTrigger
                                        className="px-2 py-1.5 hover:bg-slate-50 rounded-md hover:no-underline text-sm font-medium text-slate-700 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-700"
                                        onClick={() => {
                                            if (openItem !== `course-${item.course_id}`) {
                                                navigate(`/teacher/course/${item.course_id}/clos`);
                                            }
                                        }}
                                    >
                                        <div className="text-left w-full overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate font-semibold text-xs">{item.course?.code}</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-normal ml-6 truncate max-w-[140px] opacity-80">
                                                {item.course?.title}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-1 pt-0.5 pl-2">
                                        <div className="flex flex-col gap-0.5 border-l border-slate-200 ml-2 pl-2 mt-1">
                                            <NavLink
                                                to={`/teacher/course/${item.course_id}/clos`}
                                                className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${isActive ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                            >
                                                <List size={12} /> CLOs
                                            </NavLink>
                                            <NavLink
                                                to={`/teacher/course/${item.course_id}/assessments`}
                                                className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${isActive ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                            >
                                                <BookOpen size={12} /> Assessments
                                            </NavLink>
                                            <NavLink
                                                to={`/teacher/course/${item.course_id}/gradebook`}
                                                className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${isActive ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                            >
                                                <GraduationCap size={12} /> Gradebook
                                            </NavLink>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="px-2 py-4 text-xs text-muted-foreground bg-slate-50 rounded-md border border-dashed text-center">
                            No courses.
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 relative">
                <div className="max-w-5xl mx-auto space-y-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
