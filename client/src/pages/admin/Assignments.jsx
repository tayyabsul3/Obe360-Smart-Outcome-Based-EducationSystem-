import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    UserPlus,
    ShieldCheck,
    LayoutGrid,
    List,
    GraduationCap,
    Clock,
    Search,
    Pencil,
    Plus,
    CheckCircle,
    X
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import useSemesterStore from '@/store/semesterStore';

export default function Assignments() {
    const { workingSemesterId, semesters } = useSemesterStore();
    const [teachers, setTeachers] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [selectedSemesterNum, setSelectedSemesterNum] = useState('ALL'); // 1-8

    const [programCourses, setProgramCourses] = useState([]); // Courses in study plan
    const [assignments, setAssignments] = useState([]); // Existing teacher assignments
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([
                fetchTeachers(),
                fetchPrograms()
            ]);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedProgramId && workingSemesterId) {
            loadData();
        }
    }, [selectedProgramId, workingSemesterId, selectedSemesterNum]);

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/teachers');
            const data = await res.json();
            setTeachers(data);
        } catch (err) { console.error(err); }
    };

    const fetchPrograms = async () => {
        try {
            const res = await fetch('/api/programs');
            const data = await res.json();
            setPrograms(data);
            if (data.length > 0) setSelectedProgramId(data[0].id);
        } catch (err) { console.error(err); }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Fetch study plan courses for this program
            const spRes = await fetch(`/api/courses/program/${selectedProgramId}`);
            const spData = await spRes.json();

            // 2. Fetch current assignments for this program and academic session
            const assignRes = await fetch(`/api/assignments/filter?programId=${selectedProgramId}&semesterId=${workingSemesterId}`);
            const assignData = await assignRes.json();

            setProgramCourses(spData);
            setAssignments(assignData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (courseId, teacherId, semesterNum) => {
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: courseId,
                    teacher_id: teacherId,
                    program_id: selectedProgramId,
                    semester_id: workingSemesterId,
                    semester_number: semesterNum
                }),
            });
            if (res.ok) {
                toast.success("Teacher assigned successfully");
                loadData();
            } else {
                const errorData = await res.json();
                toast.error(`Assignment failed: ${errorData.error}`);
                console.error("Assignment Payload:", {
                    course_id: courseId,
                    teacher_id: teacherId,
                    program_id: selectedProgramId,
                    semester_id: workingSemesterId,
                    semester_number: semesterNum
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        }
    };

    const filteredCourses = selectedSemesterNum === 'ALL'
        ? programCourses
        : programCourses.filter(c => c.semester === parseInt(selectedSemesterNum));

    const handleUnassign = async (assignmentId) => {
        try {
            const res = await fetch(`/api/assignments/${assignmentId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success("Teacher unassigned");
                loadData();
            } else {
                toast.error("Failed to unassign");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        }
    };

    const getAssignmentsForCourse = (courseId) => {
        return assignments.filter(a => a.course_id === courseId);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!workingSemesterId && (
                <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-[2.5rem] flex items-center gap-4 text-orange-800">
                    <AlertCircle className="shrink-0" />
                    <div>
                        <p className="font-black uppercase text-xs tracking-widest">No Academic Session Active</p>
                        <p className="text-sm font-medium opacity-80">Please select an academic session (Working Semester) in the Settings to enable course assignments.</p>
                    </div>
                </div>
            )}
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Course Allocation</h1>
                    <p className="text-sm text-slate-500 font-medium">Assign faculty teachers to courses across the 8-semester curriculum.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Program</Label>
                        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                            <SelectTrigger className="h-12 w-[220px] rounded-2xl bg-slate-50 border-0 shadow-none font-bold text-slate-700">
                                <SelectValue placeholder="Select Program" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                {programs.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="font-bold">{p.code}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Curriculum Semester</Label>
                        <Select value={selectedSemesterNum} onValueChange={setSelectedSemesterNum}>
                            <SelectTrigger className="h-12 w-[160px] rounded-2xl bg-slate-50 border-0 shadow-none font-bold text-slate-700">
                                <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                <SelectItem value="ALL" className="font-bold">All Semesters</SelectItem>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                    <SelectItem key={n} value={n.toString()} className="font-bold">Semester {n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />)}
                </div>
            ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.map(item => {
                        const courseAssignments = getAssignmentsForCourse(item.course_id);
                        return (
                            <Card key={item.id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white flex flex-col border-t-4 border-t-transparent hover:border-t-blue-500">
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="rounded-full font-black text-[9px] uppercase tracking-widest border-blue-100 text-blue-600 bg-blue-50/50">
                                            Semester {item.semester}
                                        </Badge>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            {item.course?.code}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight line-clamp-2 min-h-[3rem]">
                                        {item.course?.title}
                                    </h3>
                                </CardHeader>

                                <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        {courseAssignments.map(assignment => (
                                            <div key={assignment.id} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between group/assign border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">
                                                        {assignment.teacher?.full_name?.charAt(0) || 'T'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Assigned</p>
                                                        <p className="text-xs font-black text-slate-800">{assignment.teacher?.full_name || assignment.teacher?.email}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleUnassign(assignment.id)}
                                                    className="h-8 w-8 rounded-xl opacity-0 group-hover/assign:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        ))}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center justify-center gap-2">
                                                    <UserPlus size={16} />
                                                    {courseAssignments.length > 0 ? 'Add Instructor' : 'Assign Teacher'}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="center" className="rounded-2xl p-2 min-w-[240px] shadow-2xl max-h-[300px] overflow-auto">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400 pb-2">Select Faculty Member</DropdownMenuLabel>
                                                {teachers.filter(t => !courseAssignments.find(a => a.teacher_id === t.id)).map(t => (
                                                    <DropdownMenuItem key={t.id} onClick={() => handleAssign(item.course_id, t.id, item.semester)} className="rounded-xl h-12 font-bold px-4 hover:bg-blue-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                                                                {t.full_name?.charAt(0) || 'T'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs">{t.full_name || "No Name"}</span>
                                                                <span className="text-[10px] text-slate-400 font-normal">{t.email}</span>
                                                            </div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                                {teachers.filter(t => !courseAssignments.find(a => a.teacher_id === t.id)).length === 0 && (
                                                    <div className="text-xs text-center text-slate-500 p-4">All available teachers assigned.</div>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <Clock size={12} /> {item.course?.credit_hours} HR/CREDIT
                                        </span>
                                        {courseAssignments.length > 0 && <CheckCircle size={14} className="text-emerald-500" />}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="py-40 text-center bg-white rounded-[3.5rem] shadow-sm border border-slate-100">
                    <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Curriculum Not Found</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto mt-2">
                        No courses have been mapped to the study plan for this program yet. Connect courses in the Programs module first.
                    </p>
                </div>
            )}
        </div>
    );
}
