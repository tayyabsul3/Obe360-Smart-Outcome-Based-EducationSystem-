import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from "@/components/ui/progress";
import { 
    Target, 
    Users, 
    Download, 
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

export default function CLOAttainment() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [clos, setClos] = useState([]);
    const [students, setStudents] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [marks, setMarks] = useState([]);

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [closRes, dataRes] = await Promise.all([
                fetch(`http://localhost:5000/api/clos/${courseId}`),
                fetch(`http://localhost:5000/api/assessments/course/${courseId}/export-all`)
            ]);

            if (closRes.ok) setClos(await closRes.json());
            if (dataRes.ok) {
                const data = await dataRes.json();
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
            toast.error("Failed to load CLO attainment data");
        } finally {
            setLoading(false);
        }
    };

    const calculateAttainment = (studentId, cloId) => {
        // Find all questions linked to this CLO
        let totalMax = 0;
        let totalObtained = 0;
        let hasData = false;

        assessments.forEach(a => {
            if (!a.include_in_gpa) return;
            
            a.assessment_questions?.forEach(q => {
                if (q.clo_id === cloId && !q.not_for_obe) {
                    const studentMark = marks.find(m => m.student_id === studentId && m.question_id === q.id);
                    totalMax += (q.max_marks || 0);
                    if (studentMark && !studentMark.is_absent) {
                        totalObtained += (studentMark.obtained_marks || 0);
                        hasData = true;
                    }
                }
            });
        });

        if (totalMax === 0) return null;
        return {
            percentage: (totalObtained / totalMax) * 100,
            obtained: totalObtained,
            max: totalMax,
            hasData
        };
    };

    const getAttainmentColor = (percentage) => {
        if (percentage === null) return "bg-slate-100";
        if (percentage >= 70) return "bg-emerald-500";
        if (percentage >= 50) return "bg-amber-500";
        return "bg-rose-500";
    };

    const getAttainmentTextColor = (percentage) => {
        if (percentage === null) return "text-slate-400";
        if (percentage >= 70) return "text-emerald-700";
        if (percentage >= 50) return "text-amber-700";
        return "text-rose-700";
    };

    const handleExport = () => {
        const exportData = students.map((s, idx) => {
            const row = {
                "Sr.No": idx + 1,
                "Reg No": s.reg_no,
                "Name": s.name
            };
            clos.forEach(clo => {
                const att = calculateAttainment(s.id, clo.id);
                row[clo.code] = att ? `${att.percentage.toFixed(1)}%` : "N/A";
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CLO Attainment");
        XLSX.writeFile(wb, `CLO_Attainment_${courseId.substring(0, 8)}.xlsx`);
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        <Target size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none">CLO Attainment</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Student-wise Outcome Mastery Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} className="gap-2"><TrendingUp size={16} /> Refresh</Button>
                    <Button onClick={handleExport} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Download size={16} /> Export Excel
                    </Button>
                </div>
            </div>

            {/* CLO Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {clos.map(clo => {
                    // Calculate class-wide attainment for this CLO
                    let totalMax = 0;
                    let totalObtained = 0;
                    students.forEach(s => {
                        const att = calculateAttainment(s.id, clo.id);
                        if (att) {
                            totalMax += att.max;
                            totalObtained += att.obtained;
                        }
                    });
                    const classPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

                    return (
                        <Card key={clo.id} className="border-0 shadow-sm rounded-2xl bg-white group hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="font-black border-emerald-200 text-emerald-700 bg-emerald-50">{clo.code}</Badge>
                                    <span className={cn("text-xl font-black", getAttainmentTextColor(classPercentage))}>
                                        {classPercentage.toFixed(1)}%
                                    </span>
                                </div>
                                <CardTitle className="text-sm font-bold line-clamp-1 mt-2">{clo.title || 'Untitled CLO'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Progress value={classPercentage} className="h-1.5" indicatorClassName={getAttainmentColor(classPercentage)} />
                                <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-tighter">Class Average Mastery</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Detailed Table */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Users size={16} /> Student Outcome Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow>
                                <TableHead className="w-[60px] text-center">Sr.</TableHead>
                                <TableHead className="min-w-[120px]">Reg No</TableHead>
                                <TableHead className="min-w-[180px]">Student Name</TableHead>
                                {clos.map(clo => (
                                    <TableHead key={clo.id} className="text-center min-w-[100px]">{clo.code}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student, index) => (
                                <TableRow key={student.id} className="hover:bg-slate-50/50">
                                    <TableCell className="text-center font-medium text-slate-400">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs font-bold">{student.reg_no}</TableCell>
                                    <TableCell className="font-bold text-slate-700">{student.name}</TableCell>
                                    {clos.map(clo => {
                                        const att = calculateAttainment(student.id, clo.id);
                                        return (
                                            <TableCell key={clo.id} className="text-center">
                                                {att ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={cn("text-xs font-black", getAttainmentTextColor(att.percentage))}>
                                                            {att.percentage.toFixed(0)}%
                                                        </span>
                                                        <div className="w-12 h-1 rounded-full bg-slate-100 overflow-hidden">
                                                            <div 
                                                                className={cn("h-full", getAttainmentColor(att.percentage))} 
                                                                style={{ width: `${att.percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300">N/A</span>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <div className="flex gap-3">
                    <Info className="text-emerald-600 shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-emerald-900">Understanding Attainment</h4>
                        <p className="text-sm text-emerald-800 mt-1">
                            Attainment represents the percentage of marks a student obtained out of the total possible marks assigned to a specific CLO across all factored assessments. 
                            <strong> Gray 'N/A'</strong> indicates that no assessments currently map to that CLO or no data is available.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
