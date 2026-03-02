import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileText,
    Download,
    Printer,
    Users,
    Target,
    LayoutDashboard,
    Search
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function OBEMarks() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        assessments: [],
        marks: [],
        enrollments: [],
        clos: []
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [exportRes, closRes] = await Promise.all([
                fetch(`/api/assessments/course/${courseId}/export-all`),
                fetch(`/api/clos/${courseId}`)
            ]);

            const exportData = exportRes.ok ? await exportRes.json() : { assessments: [], marks: [], enrollments: [] };
            const closData = closRes.ok ? await closRes.json() : [];

            setData({
                ...exportData,
                clos: closData
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load OBE marks data");
        } finally {
            setLoading(false);
        }
    };

    // Helper: Group questions by CLO
    const getQuestionsByCLO = () => {
        const cloGroups = {};

        // Initialize with actual CLOs
        data.clos.forEach(clo => {
            cloGroups[clo.id] = {
                clo_code: clo.code,
                clo_id: clo.id,
                questions: []
            };
        });

        // Loop through all assessments and their questions
        data.assessments.forEach(assessment => {
            assessment.assessment_questions?.forEach(q => {
                if (q.clo_id && cloGroups[q.clo_id]) {
                    cloGroups[q.clo_id].questions.push({
                        ...q,
                        assessmentTitle: assessment.title,
                        assessmentType: assessment.type
                    });
                }
            });
        });

        // Filter out groups with no questions if necessary, or keep them to show gaps
        return Object.values(cloGroups).filter(group => group.questions.length > 0);
    };

    const questionsByClo = getQuestionsByCLO();
    const totalQuestionColumns = questionsByClo.reduce((sum, group) => sum + group.questions.length, 0);

    const filteredStudents = data.enrollments.filter(e =>
        e.students.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.students.reg_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportExcel = () => {
        const headers = ["Reg No", "Student Name"];
        questionsByClo.forEach(group => {
            group.questions.forEach(q => {
                headers.push(`${group.clo_code} - ${q.assessmentTitle} (${q.question_number})`);
            });
        });

        const rows = filteredStudents.map(e => {
            const row = [e.students.reg_no, e.students.name];
            questionsByClo.forEach(group => {
                group.questions.forEach(q => {
                    const mark = data.marks.find(m => m.student_id === e.student_id && m.question_id === q.id);
                    row.push(mark ? (mark.is_absent ? "A" : mark.obtained_marks) : "-");
                });
            });
            return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "OBE Marks");
        XLSX.writeFile(wb, `OBE_Marks_Export.xlsx`);
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <Target size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none">Marks (OBE)</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Granular Outcome-Question Mapping</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            placeholder="Search student..."
                            className="pl-10 h-10 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => window.print()} className="gap-2 px-4 h-10 border-slate-200">
                        <Printer size={16} /> PDF
                    </Button>
                    <Button onClick={handleExportExcel} className="gap-2 px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Download size={16} /> Excel
                    </Button>
                </div>
            </div>

            {/* OBE Table Card */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* Row 1: CLO Groupings */}
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th rowSpan={3} className="p-4 text-left border-r border-slate-200 min-w-[120px] text-xs font-black uppercase tracking-widest text-slate-400">Reg No.</th>
                                <th rowSpan={3} className="p-4 text-left border-r border-slate-200 min-w-[200px] text-xs font-black uppercase tracking-widest text-slate-400">Name</th>
                                <th className="p-2 border-r border-slate-200 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">CLO</th>
                                {questionsByClo.map(group => (
                                    <th key={group.clo_id} colSpan={group.questions.length} className="p-3 text-center border-r border-slate-200 text-xs font-black text-blue-700 bg-blue-50/50">
                                        {group.clo_code}
                                    </th>
                                ))}
                            </tr>
                            {/* Row 2: Assessment Activity */}
                            <tr className="bg-white border-b border-slate-100">
                                <th className="p-2 border-r border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">Activity</th>
                                {questionsByClo.map(group =>
                                    group.questions.map((q, idx) => (
                                        <th key={`${q.id}-${idx}`} className="p-2 text-center border-r border-slate-100 text-[10px] font-bold text-slate-600 min-w-[100px]">
                                            <span className="line-clamp-1">{q.assessmentTitle}</span>
                                        </th>
                                    ))
                                )}
                            </tr>
                            {/* Row 3: Detail / Question Number & Weight */}
                            <tr className="bg-white border-b border-slate-200">
                                <th className="p-2 border-r border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">% Weight</th>
                                {questionsByClo.map(group =>
                                    group.questions.map((q, idx) => (
                                        <th key={`${q.id}-${idx}-w`} className="p-2 text-center border-r border-slate-100 text-[11px] font-black text-slate-900 bg-slate-50/30">
                                            {q.question_number} <span className="opacity-40 ml-1">({q.max_marks})</span>
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((e, sIdx) => (
                                    <tr key={e.student_id} className={cn("border-b border-slate-50 transition-colors hover:bg-slate-50/50", sIdx % 2 === 0 ? "bg-white" : "bg-slate-50/20")}>
                                        <td className="p-3 border-r border-slate-200 font-mono text-[11px] font-bold text-slate-500">{e.students.reg_no}</td>
                                        <td className="p-3 border-r border-slate-200 text-sm font-bold text-slate-700">{e.students.name}</td>
                                        <td className="p-3 border-r border-slate-200 bg-slate-50/30"></td> {/* Spacer for weight col */}
                                        {questionsByClo.map(group =>
                                            group.questions.map((q, qIdx) => {
                                                const markRecord = data.marks.find(m => m.student_id === e.student_id && m.question_id === q.id);
                                                const val = markRecord ? (markRecord.is_absent ? "A" : markRecord.obtained_marks.toFixed(2)) : null;

                                                return (
                                                    <td key={`${e.student_id}-${q.id}`} className="p-3 text-center border-r border-slate-100 text-sm font-medium text-slate-600">
                                                        {val !== null ? (
                                                            <span className={cn(
                                                                val === "A" ? "text-rose-500 font-black" : "text-slate-900 font-bold"
                                                            )}>
                                                                {val}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-200 text-xs">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3 + totalQuestionColumns} className="p-12 text-center text-slate-400 font-bold italic">
                                        No matching students found...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    .no-print, nav, aside, footer, button, .action-bar { display: none !important; }
                    .print-full { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    body { background: white !important; }
                    tr { page-break-inside: avoid; }
                    th { font-size: 8px !important; }
                    td { font-size: 9px !important; padding: 4px !important; }
                }
            `}</style>
        </div>
    );
}
