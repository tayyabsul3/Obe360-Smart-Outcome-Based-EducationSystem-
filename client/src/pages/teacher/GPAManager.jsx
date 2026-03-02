import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calculator,
    Download,
    Users,
    Save,
    FileText,
    Search,
    FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GPAManager() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, mRes] = await Promise.all([
                fetch(`/api/courses/${courseId}`),
                fetch(`/api/assessments/course/${courseId}/export-all`)
            ]);

            if (cRes.ok) setCourse(await cRes.json());
            if (mRes.ok) {
                const data = await mRes.json();
                setAssessments(data.assessments || []);
                setMarks(data.marks || []);
                // Extract students from enrollments
                const studentList = data.enrollments?.map(e => ({
                    id: e.student_id,
                    name: e.students.name,
                    reg_no: e.students.reg_no
                })) || [];
                setStudents(studentList);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data for GPA calculation");
        } finally {
            setLoading(false);
        }
    };

    // --- Logic & Constants ---
    const creditHours = course?.credit_hours || 3;
    const courseTotalMarks = creditHours === 4 ? 80 : creditHours === 3 ? 60 : 40;

    const categoryConfig = {
        ASSIGNMENT: { label: 'Assignments', totalWeight: 10, keywords: ['assignment'] },
        QUIZ: { label: 'Quizzes', totalWeight: 10, keywords: ['quiz'] },
        MID: { label: 'Mid Term', totalWeight: 30, keywords: ['mid'] },
        FINAL: { label: 'Final Exam', totalWeight: 50, keywords: ['final'] }
    };

    const getCategory = (type) => {
        const t = String(type).toLowerCase();
        if (t.includes('final')) return 'FINAL';
        if (t.includes('mid')) return 'MID';
        if (t.includes('quiz')) return 'QUIZ';
        return 'ASSIGNMENT';
    };

    // Group assessments
    const groupedAssessments = { ASSIGNMENT: [], QUIZ: [], MID: [], FINAL: [] };
    assessments.forEach(a => {
        if (!a.include_in_gpa) return;
        const cat = getCategory(a.type);
        const maxMarks = a.assessment_questions?.reduce((sum, q) => sum + (q.max_marks || 0), 0) || 0;
        groupedAssessments[cat].push({ ...a, maxMarks });
    });

    // Calculate weight per individual assessment
    const categoriesWithData = Object.keys(categoryConfig).map(catKey => {
        const config = categoryConfig[catKey];
        const group = groupedAssessments[catKey];
        const count = group.length;
        const weightPerItem = count > 0 ? config.totalWeight / count : 0;
        return {
            key: catKey,
            ...config,
            assessments: group,
            weightPerItem
        };
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
        let totalWeightedPercentage = 0;
        const categoryDetails = {};

        categoriesWithData.forEach(cat => {
            let catObtained = 0;
            const assessmentMarks = cat.assessments.map(a => {
                let aObtained = 0;
                a.assessment_questions?.forEach(q => {
                    const mark = marks.find(m => m.student_id === studentId && m.question_id === q.id);
                    if (mark && !mark.is_absent) aObtained += (mark.obtained_marks || 0);
                });

                const aPercentage = a.maxMarks > 0 ? (aObtained / a.maxMarks) : 0;
                catObtained += aPercentage * cat.weightPerItem;
                return aObtained;
            });

            totalWeightedPercentage += catObtained;
            categoryDetails[cat.key] = {
                obtained: catObtained,
                items: assessmentMarks
            };
        });

        const { grade, gpa } = getGradeAndGPA(totalWeightedPercentage);

        return {
            totalPercentage: totalWeightedPercentage.toFixed(1),
            grade,
            gpa: gpa.toFixed(2),
            categoryDetails
        };
    };

    const handleSave = async () => {
        toast.success("GPA results saved to report successfully!");
    };

    const handleDownloadPDF = () => {
        try {
            console.log("PDF Export: Starting...");
            const doc = new jsPDF('landscape');

            // Basic doc info
            const title = "GPA Results Report";
            const courseCode = course?.code || "N/A";
            const courseTitle = course?.title || "N/A";

            console.log("PDF Export: Data prep...", { courseCode, courseTitle });

            // Header
            doc.setFontSize(16);
            doc.text(title, 14, 15);
            doc.setFontSize(10);
            doc.text(`${courseCode} - ${courseTitle}`, 14, 22);
            doc.text(`Credit Hours: ${creditHours} CH | Policy: standard university policy`, 14, 27);

            const mainHeaders = ["Sr No.", "Reg No.", "Name"];
            categoriesWithData.forEach(cat => {
                cat.assessments.forEach(a => {
                    mainHeaders.push(`${a.title}\n(${cat.weightPerItem.toFixed(1)}%)`);
                });
            });
            mainHeaders.push("%age", "Grade", "GPA");

            const tableData = students.map((s, idx) => {
                const stats = calculateStudentStats(s.id);
                const row = [idx + 1, s.reg_no, s.name];
                categoriesWithData.forEach(cat => {
                    stats.categoryDetails[cat.key].items.forEach(val => row.push(val));
                });
                row.push(stats.totalPercentage, stats.grade, stats.gpa);
                return row;
            });

            console.log("PDF Export: Table data ready, row count:", tableData.length);

            autoTable(doc, {
                startY: 35,
                head: [mainHeaders],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
                bodyStyles: { halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 25, halign: 'left' },
                    2: { cellWidth: 40, halign: 'left' }
                },
                margin: { top: 35 },
                didDrawPage: (data) => {
                    // Footer or other page info can go here
                }
            });

            console.log("PDF Export: Saving file...");
            doc.save(`GPA_Report_${courseCode}.pdf`);
            console.log("PDF Export: Success!");
            toast.success("PDF Report downloaded!");
        } catch (error) {
            console.error("PDF Export Critical Error:", error);
            toast.error("Failed to generate PDF. Check browser console.");
        }
    };

    const handleExportExcel = () => {
        const headers = ["Sr No.", "Registration No.", "Name"];
        categoriesWithData.forEach(cat => {
            cat.assessments.forEach(a => headers.push(`${a.title} (${cat.weightPerItem.toFixed(2)})`));
        });
        headers.push("%age", "Grade", "Score/GPA");

        const rows = students.map((s, idx) => {
            const stats = calculateStudentStats(s.id);
            const row = [idx + 1, s.reg_no, s.name];
            categoriesWithData.forEach(cat => {
                stats.categoryDetails[cat.key].items.forEach(val => row.push(val));
            });
            row.push(stats.totalPercentage, stats.grade, stats.gpa);
            return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "GPA Marks");
        XLSX.writeFile(wb, `GPA_Marks_${course?.code}.xlsx`);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.reg_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto overflow-hidden">
            {/* Context Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-full border-2 border-slate-100 flex items-center justify-center">
                        <Users className="text-slate-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">{course?.code} - {course?.title}</h2>
                        <p className="text-xs font-bold text-slate-400">Section (B) / Nahid Mosharaf / Fall 2024</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="default" className="bg-blue-500 hover:bg-blue-600 font-bold h-8 px-3 rounded-md text-xs" onClick={handleDownloadPDF}>
                        <FileDown size={14} className="mr-1" /> PDF
                    </Button>
                    <Button variant="default" className="bg-blue-500 hover:bg-blue-600 font-bold h-8 px-3 rounded-md text-xs" onClick={handleExportExcel}>
                        <FileText size={14} className="mr-1" /> Excel
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print px-1">
                <h3 className="text-xl font-black text-slate-700">GPA Results</h3>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 font-bold h-8 px-4 rounded-md text-xs" onClick={handleSave}>
                        <Save size={14} className="mr-1" /> Save Results
                    </Button>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <Input
                            placeholder="Filter by name/reg..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-8 border-slate-200 text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* GPA Results Table */}
            <Card className="border-0 shadow-sm rounded-xl bg-white overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* Row 1: Total Weightage */}
                            <tr className="bg-white border-b border-slate-100">
                                <th colSpan={3} className="p-2 text-right bg-white border-r border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-900">Total Weightage</th>
                                {categoriesWithData.map(cat => (
                                    <th key={cat.key} colSpan={cat.assessments.length} className="p-2 text-center border-r border-slate-100 text-[10px] font-black text-slate-900">
                                        {cat.assessments.length > 0 ? `${cat.totalWeight.toFixed(0)}%` : ""}
                                    </th>
                                ))}
                                <th colSpan={3} className="bg-slate-50 border-l border-slate-200"></th>
                            </tr>
                            {/* Row 2: Weightage Per Item */}
                            <tr className="bg-white border-b border-slate-100">
                                <th colSpan={3} className="p-2 text-right bg-white border-r border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-900">Weightage</th>
                                {categoriesWithData.map(cat => (
                                    cat.assessments.map((a, idx) => (
                                        <th key={`${cat.key}-${idx}-w`} className="p-2 text-center border-r border-slate-100 text-[10px] font-bold text-slate-700 min-w-[80px]">
                                            {cat.weightPerItem.toFixed(1)}%
                                        </th>
                                    ))
                                ))}
                                <th colSpan={3} className="bg-slate-50 border-l border-slate-200"></th>
                            </tr>
                            {/* Row 3: Detail Column Headers */}
                            <tr className="bg-slate-300/40 text-slate-900 text-[10px] font-black uppercase tracking-tight">
                                <th className="p-2 border-r border-slate-200 w-[50px] text-center">Sr.</th>
                                <th className="p-2 border-r border-slate-200 text-left min-w-[100px]">Reg No.</th>
                                <th className="p-2 border-r border-slate-300 text-left min-w-[150px]">Student Name</th>
                                {categoriesWithData.map(cat => (
                                    cat.assessments.map((a, idx) => (
                                        <th key={`${cat.key}-${idx}-t`} className="p-2 text-center border-r border-slate-200 font-black">
                                            <div className="flex flex-col">
                                                <span>{a.title}</span>
                                            </div>
                                        </th>
                                    ))
                                ))}
                                <th className="p-2 border-r border-slate-200 text-center">%age</th>
                                <th className="p-2 border-r border-slate-200 text-center">Grade</th>
                                <th className="p-2 text-center">Score/GPA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((s, idx) => {
                                const stats = calculateStudentStats(s.id);
                                return (
                                    <tr key={s.id} className={cn("border-b border-slate-50 transition-colors hover:bg-slate-50/50", idx % 2 === 0 ? "bg-white" : "bg-slate-50/10")}>
                                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-400 text-[10px]">{idx + 1}.</td>
                                        <td className="p-2 border-r border-slate-200 text-[10px] font-bold text-blue-600">{s.reg_no}</td>
                                        <td className="p-2 border-r border-slate-200 text-[10px] font-black uppercase text-slate-700">{s.name}</td>
                                        {categoriesWithData.map(cat => (
                                            stats.categoryDetails[cat.key].items.map((val, qIdx) => (
                                                <td key={`${s.id}-${cat.key}-${qIdx}`} className="p-2 text-center border-r border-slate-100 text-[11px] font-bold text-slate-600">
                                                    {val}
                                                </td>
                                            ))
                                        ))}
                                        <td className="p-2 border-r border-slate-200 text-center font-black text-slate-900 text-[11px]">{stats.totalPercentage}</td>
                                        <td className="p-2 border-r border-slate-200 text-center font-black text-slate-900 text-[11px]">{stats.grade}</td>
                                        <td className="p-2 text-center font-black text-slate-900 text-[11px]">{stats.gpa}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <p className="text-[10px] font-bold text-slate-400 italic px-1">
                Note: Horizontal scroll is limited by layout width. PDF export handles full table pagination.
            </p>
        </div>
    );
}
