import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    List,
    BookOpen,
    GraduationCap,
    BarChart,
    Users,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function TeacherCourseLayout() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);

    useEffect(() => {
        if (courseId) fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const links = [
        { name: 'CLOs', to: 'clos', icon: List },
        { name: 'Assessments', to: 'assessments', icon: BookOpen },
        { name: 'Gradebook', to: 'gradebook', icon: GraduationCap },
        { name: 'Students', to: 'students', icon: Users },
        { name: 'Analytics', to: 'analytics', icon: BarChart },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-10rem)]">

            {/* Course Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
                {/* Back to Courses */}
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all gap-2 text-slate-500 hover:text-slate-900" onClick={() => navigate('/teacher/courses')}>
                    <ChevronLeft size={16} /> Back to Courses
                </Button>

                {/* Course Info Card */}
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <h2 className="font-bold text-lg text-slate-800">{course?.code || '...'}</h2>
                    <p className="text-sm text-slate-500 mb-4">{course?.title || 'Loading...'}</p>
                    <div className="h-1 w-10 bg-blue-500 rounded-full"></div>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-1">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                                    : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                            )}
                        >
                            <link.icon size={18} />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 bg-white rounded-xl border shadow-sm p-6 min-h-[500px]">
                <Outlet />
            </main>
        </div>
    );
}
