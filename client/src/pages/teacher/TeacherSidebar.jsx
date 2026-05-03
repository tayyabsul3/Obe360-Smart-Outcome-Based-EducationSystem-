import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    BookOpen,
    FileText,
    GraduationCap,
    CheckSquare,
    Calculator,
    Users,
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    Library,
    Target,
    BarChart,
    ClipboardCheck,
    Weight,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSemesterStore from '@/store/semesterStore';
import useAuthStore from '@/store/authStore';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function TeacherSidebar() {
    const { user } = useAuthStore();
    const {
        workingSemesterId,
        selectedProgramId,
        selectedSemesterNum,
        activeCourseId,
        programs,
        setSelectedProgramId,
        setSelectedSemesterNum,
        setActiveCourseId,
        fetchPrograms
    } = useSemesterStore();

    const [assignedCourses, setAssignedCourses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (programs.length === 0) fetchPrograms();
    }, []);

    useEffect(() => {
        if (user?.id && workingSemesterId && selectedProgramId && selectedSemesterNum) {
            fetchAssignedCourses();
        }
    }, [user, workingSemesterId, selectedProgramId, selectedSemesterNum]);

    const fetchAssignedCourses = async () => {
        try {
            // Fetch ALL assignments for this teacher to be resilient to session mismatches
            const res = await fetch(`/api/assignments/teacher/${user.id}`);
            if (res.ok) {
                const data = await res.json();

                // Perform robust local filtering
                const filtered = data.filter(a => {
                    const progMatch = String(a.program_id) === String(selectedProgramId);
                    const semMatch = Number(a.semester_number) === Number(selectedSemesterNum);
                    const sessionMatch = String(a.semester_id) === String(workingSemesterId);

                    return progMatch && semMatch && sessionMatch;
                });

                setAssignedCourses(filtered);
            }
        } catch (err) { console.error("Error fetching courses:", err); }
    };

    // Construct "Program-Semester" options (e.g., BSSE-1, BSSE-2...)
    const programSemesterOptions = [];
    programs.forEach(p => {
        for (let i = 1; i <= 8; i++) {
            programSemesterOptions.push({
                id: `${p.id}-${i}`,
                label: `${p.code} - Semester ${i}`,
                programId: p.id,
                semesterNum: i
            });
        }
    });

    const currentSelectionLabel = selectedProgramId && selectedSemesterNum
        ? programSemesterOptions.find(o => o.programId === selectedProgramId && o.semesterNum === Number(selectedSemesterNum))?.label
        : "Select Semester";

    const contextNavItems = [
        { label: 'View Class Room', to: `/teacher/course/${activeCourseId}/overview`, icon: LayoutDashboard },
        {
            label: 'CLOs',
            icon: Library,
            isAccordion: true,
            value: "clos",
            subItems: [
                { label: 'CLOs List', to: `/teacher/course/${activeCourseId}/clos`, end: true },
                { label: 'CLOs Attainment', to: `/teacher/course/${activeCourseId}/clos/attainment` },
                { label: 'CLO Attainment Graph', to: `/teacher/course/${activeCourseId}/clos/attainment-graph` },
            ]
        },
        {
            label: 'PLOs',
            icon: Target,
            isAccordion: true,
            value: "plos",
            subItems: [
                { label: 'PLOs List', to: `/teacher/course/${activeCourseId}/reports/plo` },
                { label: 'PLOs Attainment', to: `/teacher/course/${activeCourseId}/plos/attainment` },
            ]
        },
        {
            label: 'Assesment / Marks',
            icon: CheckSquare,
            isAccordion: true,
            value: "assessments",
            subItems: [
                { label: 'Class Activities', to: `/teacher/course/${activeCourseId}/assessments`, end: true },
                { label: 'GPA', to: `/teacher/course/${activeCourseId}/assessments/gpa` },
                { label: 'OBE', to: `/teacher/course/${activeCourseId}/obe-marks` },
                { label: 'Award List', to: `/teacher/course/${activeCourseId}/assessments/award-list` },
            ]
        },
        { label: 'Students', to: `/teacher/course/${activeCourseId}/students`, icon: Users },
        {
            label: 'Reports',
            icon: BarChart,
            isAccordion: true,
            value: "reports",
            subItems: [
                { label: 'PLO Report', to: `/teacher/course/${activeCourseId}/reports/plo` },
                { label: 'Consolidated Report', to: `/teacher/course/${activeCourseId}/reports/consolidated` },
                { label: 'Course Breadth', to: `/teacher/course/${activeCourseId}/reports/breadth` },
                { label: 'GPA Attainment Graph', to: `/teacher/course/${activeCourseId}/reports/gpa-graph` },
            ]
        }
    ];

    const location = useLocation();
    const [activeAccordion, setActiveAccordion] = useState("");

    // Keep accordion synced with URL on load/refresh
    useEffect(() => {
        if (!activeCourseId) return;
        const currentPath = location.pathname;
        const activeItem = contextNavItems.find(item =>
            item.isAccordion && item.subItems.some(sub => currentPath.includes(sub.to))
        );
        if (activeItem) {
            setActiveAccordion(activeItem.value);
        } else {
            setActiveAccordion("");
        }
    }, [location.pathname, activeCourseId]);

    const handleAccordionChange = (val) => {
        setActiveAccordion(val);
        if (val) {
            const item = contextNavItems.find(i => i.value === val);
            if (item && item.subItems.length > 0) {
                navigate(item.subItems[0].to);
            }
        }
    };

    return (
        <aside
            className="w-[240px] bg-white border-r border-slate-200 flex flex-col h-full shadow-sm shrink-0 overflow-y-auto"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
            <style>{`
                aside::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            {/* Context Section (Top) */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 pb-2">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Course Context</h3>
                    {activeCourseId ? (
                        <nav className="space-y-0.5">
                            <Accordion type="single" collapsible className="w-full space-y-0.5" value={activeAccordion} onValueChange={handleAccordionChange}>
                                {contextNavItems.map((item) => (
                                    item.isAccordion ? (
                                        <AccordionItem value={item.value} key={item.value} className="border-none">
                                            <AccordionTrigger className={cn(
                                                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:no-underline [&[data-state=open]>svg:first-child]:text-blue-600",
                                                "text-slate-500 hover:bg-slate-50 hover:text-blue-600 data-[state=open]:bg-blue-50/50 data-[state=open]:text-blue-700"
                                            )}>
                                                <div className="flex items-center gap-2.5">
                                                    <item.icon size={16} />
                                                    <span>{item.label}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-2 pt-1">
                                                <div className="flex flex-col space-y-1 pl-9 pr-2">
                                                    {item.subItems.map(sub => (
                                                        <NavLink
                                                            key={sub.to}
                                                            to={sub.to}
                                                            end={sub.end}
                                                            className={({ isActive }) => cn(
                                                                "flex items-center py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                                                                isActive
                                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                                    : "text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                                                            )}
                                                        >
                                                            {sub.label}
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ) : (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200",
                                                isActive
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                                            )}
                                        >
                                            <item.icon size={16} />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    )
                                ))}
                            </Accordion>
                        </nav>
                    ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                                Select a Course <br /> to Access Tools
                            </p>
                        </div>
                    )}
                </div>

                {/* Selection Section (Bottom/Static) - Courses only */}
                <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Assigned Curriculum</h3>

                    <div className="space-y-4">
                        {/* Courses List - Static Bottom */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">My Active Courses</label>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                {selectedProgramId && selectedSemesterNum ? (
                                    assignedCourses.length > 0 ? (
                                        <div className="py-2">
                                            {assignedCourses.map(a => (
                                                <button
                                                    key={a.id}
                                                    onClick={() => {
                                                        setActiveCourseId(a.course_id);
                                                        navigate(`/teacher/course/${a.course_id}/overview`);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 text-xs font-bold transition-all border-l-4",
                                                        activeCourseId === a.course_id
                                                            ? "bg-blue-600/10 text-blue-700 border-blue-600"
                                                            : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-blue-600"
                                                    )}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] opacity-70">{a.course?.code}</span>
                                                        <span className="line-clamp-1">{a.course?.title}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase">
                                            No Courses Found
                                        </div>
                                    )
                                ) : (
                                    <div className="p-4 text-center text-[10px] font-bold text-slate-300 uppercase">
                                        Select Semester in Header
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
