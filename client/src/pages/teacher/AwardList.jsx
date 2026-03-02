import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    FileText, 
    Download, 
    Printer, 
    Users, 
    ShieldCheck,
    Info,
    Calendar,
    BookOpen,
    UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function AwardList() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState([]);
    const printRef = useRef();

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, mRes] = await Promise.all([
                fetch(`http://localhost:5000/api/courses/${courseId}`),
                fetch(`http://localhost:5000/api/assessments/course/${courseId}/export-all`)
            ]);

            if (cRes.ok) setCourse(await cRes.json());
            if (mRes.ok) {
                const data = await mRes.json();
                setAssessments(data.assessments);
                setMarks(data.marks);
                // Extract students from enrollments
                const studentList = data.enrollments.map(e => ({
                    id: e.student_id,
                    name: e.students.name,
                    reg_no: e.students.reg_no
                }));
                setStudents(studentList);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load award list data");
        } finally {
            setLoading(false);
        }
    };

    // Calculation constants
    const creditHours = course?.credit_hours || 3;
    const courseTotalMarks = creditHours === 4 ? 80 : creditHours === 3 ? 60 : 40;

    const weights = {
        FINAL: courseTotalMarks * 0.5,
        MID: courseTotalMarks * 0.3,
        SESSIONAL: courseTotalMarks * 0.2
    };

    const getCategory = (type) => {
        const t = String(type).toLowerCase();
        if (t.includes('final')) return 'FINAL';
        if (t.includes('mid')) return 'MID';
        return 'SESSIONAL';
    };

    // Category totals for normalization
    const categoryTotals = { FINAL: 0, MID: 0, SESSIONAL: 0 };
    assessments.forEach(a => {
        if (!a.include_in_gpa) return;
        const cat = getCategory(a.type);
        const aTotal = a.assessment_questions?.reduce((sum, q) => sum + (q.max_marks || 0), 0) || 0;
        categoryTotals[cat] += aTotal;
    });

    const getGradeAndGPA = (percentage) => {
        if (percentage >= 85) return { grade: 'A', gpa: 4.0 };
        if (percentage >= 80) return { grade: 'A-', gpa: 3.7 };
        if (percentage >= 75) return { grade: 'B+', gpa: 3.3 };
        if (percentage >= 71) return { grade: 'B', gpa: 3.0 };
        if (percentage >= 68) return { grade: 'B-', gpa: 2.7 };
        if (percentage >= 64) return { grade: 'C+', gpa: 2.3 };
        if (percentage >= 61) return { grade: 'C', gpa: 2.0 };
        if (percentage >= 58) return { grade: 'C-', gpa: 1.7 };
        if (percentage >= 54) return { grade: 'D+', gpa: 1.3 };
        if (percentage >= 50) return { grade: 'D', gpa: 1.0 };
        return { grade: 'F', gpa: 0.0 };
    };

    const calculateStudentStats = (studentId) => {
        const studentCategoryMarks = { FINAL: 0, MID: 0, SESSIONAL: 0 };

        assessments.forEach(a => {
            if (!a.include_in_gpa) return;
            const cat = getCategory(a.type);
            a.assessment_questions?.forEach(q => {
                const mark = marks.find(m => m.student_id === studentId && m.question_id === q.id);
                if (mark && !mark.is_absent) {
                    studentCategoryMarks[cat] += (mark.obtained_marks || 0);
                }
            });
        });

        // Apply Weights & Normalization
        const weightedMarks = {
            FINAL: categoryTotals.FINAL > 0 ? (studentCategoryMarks.FINAL / categoryTotals.FINAL) * weights.FINAL : 0,
            MID: categoryTotals.MID > 0 ? (studentCategoryMarks.MID / categoryTotals.MID) * weights.MID : 0,
            SESSIONAL: categoryTotals.SESSIONAL > 0 ? (studentCategoryMarks.SESSIONAL / categoryTotals.SESSIONAL) * weights.SESSIONAL : 0
        };

        const total100 = ((weightedMarks.FINAL + weightedMarks.MID + weightedMarks.SESSIONAL) / courseTotalMarks) * 100;
        const totalScaled = (weightedMarks.FINAL + weightedMarks.MID + weightedMarks.SESSIONAL);
        const { grade } = getGradeAndGPA(total100);

        return {
            ...weightedMarks,
            total100: total100.toFixed(2),
            totalScaled: totalScaled.toFixed(2),
            grade
        };
    };

    const handleExport = () => {
        const exportData = students.map((s, idx) => {
            const stats = calculateStudentStats(s.id);
            return {
                "Sr.No": idx + 1,
                "Reg No": s.reg_no,
                "Student Name": s.name,
                "Sessional (Weighted 20)": stats.SESSIONAL.toFixed(2),
                "Midterm (Weighted 30)": stats.MID.toFixed(2),
                "Final (Weighted 50)": stats.FINAL.toFixed(2),
                "Total (100)": stats.total100,
                "Final Total": stats.totalScaled,
                "Grade": stats.grade
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Award List");
        XLSX.writeFile(wb, `Award_List_${course?.code || 'Course'}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Action Bar (Hidden on Print) */}
            <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none">Award List</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Official Course Result Generation</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer size={16} /> Print Official</Button>
                    <Button onClick={handleExport} className="gap-2 bg-slate-900 hover:bg-slate-800">
                        <Download size={16} /> Export Excel
                    </Button>
                </div>
            </div>

            {/* Printable Award List Card */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden print:shadow-none print:border-none">
                {/* Print Header */}
                <div className="p-10 text-center border-b print:block hidden">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Award List</h1>
                    <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">OBE360 - Smart Outcome Based Education System</p>
                </div>

                <CardHeader className="p-8 bg-slate-50/50 print:bg-white">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><BookOpen size={10}/> Course Information</p>
                            <h4 className="text-md font-black text-slate-900">{course?.code} - {course?.title}</h4>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">{creditHours} Credit Hours</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar size={10}/> Academic Session</p>
                            <h4 className="text-md font-black text-slate-900">Fall 2024</h4>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">Regular Semester</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><UserCheck size={10}/> Maximum Marks</p>
                            <h4 className="text-md font-black text-slate-900">{courseTotalMarks} Total</h4>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">80/20 Weighted Split</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ShieldCheck size={10}/> Verified By</p>
                            <h4 className="text-md font-black text-slate-900 underline underline-offset-4 decoration-slate-200">Departmental OBE Chair</h4>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">Official Records</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/80 print:bg-slate-100">
                            <TableRow className="border-b border-slate-200">
                                <TableHead className="w-[60px] text-center font-black py-4">Sr.</TableHead>
                                <TableHead className="font-black px-6">Registration Number</TableHead>
                                <TableHead className="font-black">Student Full Name</TableHead>
                                <TableHead className="text-center font-black">Sessional (20)</TableHead>
                                <TableHead className="text-center font-black">Midterm (30)</TableHead>
                                <TableHead className="text-center font-black">Final Exam (50)</TableHead>
                                <TableHead className="text-center font-black">Total (100)</TableHead>
                                <TableHead className="text-center font-black bg-slate-100/50">Final Total</TableHead>
                                <TableHead className="text-center font-black">Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student, index) => {
                                const stats = calculateStudentStats(student.id);
                                return (
                                    <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="text-center font-black text-slate-300 py-4">{index + 1}</TableCell>
                                        <TableCell className="font-mono text-xs font-black tracking-tight px-6">{student.reg_no}</TableCell>
                                        <TableCell className="font-black text-slate-800">{student.name}</TableCell>
                                        <TableCell className="text-center font-bold text-slate-600">{stats.SESSIONAL.toFixed(1)}</TableCell>
                                        <TableCell className="text-center font-bold text-slate-600">{stats.MID.toFixed(1)}</TableCell>
                                        <TableCell className="text-center font-bold text-slate-600">{stats.FINAL.toFixed(1)}</TableCell>
                                        <TableCell className="text-center font-black text-slate-900">{stats.total100}%</TableCell>
                                        <TableCell className="text-center font-black text-indigo-700 bg-indigo-50/20">{stats.totalScaled}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn(
                                                "font-black px-3.5 py-0.5 border-2",
                                                stats.grade === 'F' ? "border-red-200 text-red-600 bg-red-50" : "border-slate-200 text-slate-800 bg-slate-50"
                                            )}>
                                                {stats.grade}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Print Footer */}
                <div className="p-12 print:block hidden mt-10">
                    <div className="flex justify-between items-end">
                        <div className="space-y-16">
                            <div className="w-48 border-t-2 border-slate-900 pt-2 text-center text-[10px] font-black uppercase">Teacher's Signature</div>
                        </div>
                        <div className="space-y-16">
                            <div className="w-48 border-t-2 border-slate-900 pt-2 text-center text-[10px] font-black uppercase">Dean's Signature</div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Generated on</p>
                            <p className="text-xs font-black">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Help Alert (Hidden on Print) */}
            <div className="print:hidden bg-slate-900 p-8 rounded-3xl shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                   <ShieldCheck size={120}/>
                </div>
                <div className="relative z-10 flex gap-6 items-start">
                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0">
                        <Info size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-white text-lg leading-none">Award List Generation Policy</h4>
                        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                            The Award List is generated by aggregating all assessments marked for inclusion in grading. 
                            Weights are automatically applied (50% Final, 30% Mid, 20% Sessional). 
                            Normalization ensures that even if you conduct more or fewer assessments, students are graded accurately 
                            against the course total marks ({courseTotalMarks} for this Course).
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: auto; margin: 15mm; }
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .shadow-sm { box-shadow: none !important; }
                    .rounded-2xl { border-radius: 0 !important; }
                    .border-0 { border: 1px solid #e2e8f0 !important; }
                }
            `}</style>
        </div>
    );
}
