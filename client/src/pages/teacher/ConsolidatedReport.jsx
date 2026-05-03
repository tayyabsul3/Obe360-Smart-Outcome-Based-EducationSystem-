import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Printer, Download, DownloadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';

export default function ConsolidatedReport() {
    const { courseId } = useParams();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const [course, setCourse] = useState(null);
    const [clos, setClos] = useState([]);
    const [students, setStudents] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [marks, setMarks] = useState([]);

    const reportRef = useRef(null);

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, cloRes, mRes] = await Promise.all([
                fetch(`/api/courses/${courseId}`),
                fetch(`/api/clos/${courseId}`),
                fetch(`/api/assessments/course/${courseId}/export-all`)
            ]);

            if (cRes.ok) setCourse(await cRes.json());
            if (cloRes.ok) setClos(await cloRes.json());

            if (mRes.ok) {
                const data = await mRes.json();
                setAssessments(data.assessments || []);
                setMarks(data.marks || []);
                const studentList = data.enrollments?.map(e => ({
                    id: e.student_id,
                    name: e.students.name,
                    reg_no: e.students.reg_no
                })) || [];
                // Sorting students by reg_no
                studentList.sort((a, b) => a.reg_no.localeCompare(b.reg_no));
                setStudents(studentList);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load consolidated report data");
        } finally {
            setLoading(false);
        }
    };

    // --- GPA Logic (from GPAManager) ---
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

    const groupedAssessments = { ASSIGNMENT: [], QUIZ: [], MID: [], FINAL: [] };
    assessments.forEach(a => {
        if (!a.include_in_gpa) return;
        const cat = getCategory(a.type);
        const maxMarks = a.assessment_questions?.reduce((sum, q) => sum + (q.max_marks || 0), 0) || 0;
        groupedAssessments[cat].push({ ...a, maxMarks });
    });

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
        categoriesWithData.forEach(cat => {
            let catObtained = 0;
            cat.assessments.forEach(a => {
                let aObtained = 0;
                a.assessment_questions?.forEach(q => {
                    const mark = marks.find(m => m.student_id === studentId && m.question_id === q.id);
                    if (mark && !mark.is_absent) aObtained += (mark.obtained_marks || 0);
                });
                const aPercentage = a.maxMarks > 0 ? (aObtained / a.maxMarks) : 0;
                catObtained += aPercentage * cat.weightPerItem;
            });
            totalWeightedPercentage += catObtained;
        });
        const { grade, gpa } = getGradeAndGPA(totalWeightedPercentage);
        return {
            totalPercentage: totalWeightedPercentage.toFixed(1),
            grade,
            gpa: gpa.toFixed(2)
        };
    };

    // --- CLO Logic (from CLOAttainment) ---
    const calculateCLOAttainment = (studentId, cloId) => {
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
            hasData
        };
    };

    // Calculate Class average CLOs for the chart
    const classCLOData = clos.map(clo => {
        let totalMax = 0;
        let totalObtained = 0;
        students.forEach(s => {
            let sTotalMax = 0;
            let sTotalObtained = 0;
            assessments.forEach(a => {
                if (!a.include_in_gpa) return;
                a.assessment_questions?.forEach(q => {
                    if (q.clo_id === clo.id && !q.not_for_obe) {
                        const m = marks.find(mk => mk.student_id === s.id && mk.question_id === q.id);
                        sTotalMax += (q.max_marks || 0);
                        if (m && !m.is_absent) sTotalObtained += (m.obtained_marks || 0);
                    }
                });
            });
            totalMax += sTotalMax;
            totalObtained += sTotalObtained;
        });

        const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
        return {
            name: clo.code,
            percentage,
            fill: percentage >= 50 ? '#10B981' : '#F43F5E' // emerald-500 or rose-500
        };
    });

    const getAttainmentColor = (att) => {
        if (!att) return "text-slate-400";
        if (att.percentage >= 70) return "text-emerald-700 font-bold";
        if (att.percentage >= 50) return "text-amber-600 font-bold";
        return "text-rose-600 font-bold";
    };

    // --- PDF Export Logic ---
    const handleDownloadPDF = async () => {
        setExporting(true);
        toast.info("Generating multi-page PDF... Please wait.");

        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            let currentY = 15;

            // Header
            doc.setFontSize(18);
            doc.text("Consolidated Academic Report", 14, currentY);
            currentY += 8;
            doc.setFontSize(12);
            doc.text(`${course?.code} - ${course?.title}`, 14, currentY);
            currentY += 8;

            // Class Performance Table
            doc.setFontSize(14);
            doc.text("Class Performance Table", 14, currentY);
            currentY += 6;

            const tableHead = [['Sr.', 'Reg No', 'Name', ...clos.map(c => c.code), 'Grade', 'GPA']];
            const tableBody = students.map((s, index) => {
                const stats = calculateStudentStats(s.id);
                const row = [index + 1, s.reg_no, s.name];

                clos.forEach(clo => {
                    const att = calculateCLOAttainment(s.id, clo.id);
                    row.push(att && att.hasData ? `${att.percentage.toFixed(1)}%` : '-');
                });

                row.push(stats.grade);
                row.push(stats.gpa);
                return row;
            });

            autoTable(doc, {
                startY: currentY,
                head: tableHead,
                body: tableBody,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' }, 2: { halign: 'left' } },
                headStyles: { fillColor: [44, 62, 80] }, // Slate-800
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        // Colored grading logic for CLO percentages
                        if (data.column.index > 2 && data.column.index < (3 + clos.length)) {
                            const val = parseFloat(data.cell.raw);
                            if (!isNaN(val)) {
                                if (val >= 70) data.cell.styles.textColor = [5, 150, 105]; // Green
                                else if (val >= 50) data.cell.styles.textColor = [217, 119, 6]; // Amber
                                else data.cell.styles.textColor = [225, 29, 72]; // Rose
                            }
                        }
                    }
                },
                didDrawPage: (data) => {
                    currentY = data.cursor.y + 10;
                }
            });

            // Graph on new page
            const chartContainer = reportRef.current?.querySelector('.recharts-responsive-container')?.parentElement;
            if (chartContainer) {
                // Ensure chart starts on a clean section/page
                doc.addPage();
                currentY = 15;
                doc.setFontSize(14);
                doc.text("Class-Wide Mastery Analysis", 14, currentY);
                currentY += 5;

                const canvas = await html2canvas(chartContainer, { scale: 2, logging: false });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 28;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight);
            }

            doc.save(`Consolidated_Report_${course?.code || 'Course'}.pdf`);
            toast.success("PDF Downloaded Successfully");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
            {/* Control Bar (Won't be printed) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center">
                        <FileText className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Consolidated Report</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Official Course Summary & Attainment</p>
                    </div>
                </div>
                <Button
                    onClick={handleDownloadPDF}
                    disabled={exporting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 h-12 rounded-xl shadow-lg shadow-indigo-200 transition-all gap-2"
                >
                    {exporting ? <Loader2 className="animate-spin" size={18} /> : <DownloadCloud size={18} />}
                    {exporting ? 'GENERATING...' : 'DOWNLOAD PDF'}
                </Button>
            </div>

            {/* --- REPORT CONTAINER (to be captured by html2canvas) --- */}
            <div
                ref={reportRef}
                className="bg-white p-10 md:p-14 rounded-2xl shadow-lg border border-slate-200 space-y-12 shrink-0"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }} // Enforce print colors
            >
                {/* 1. Header & Course Info */}
                <div className="border-b-2 border-slate-800 pb-6 text-center space-y-2">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Course Consolidated Report</h1>
                    <p className="text-sm font-bold text-slate-500">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course Code</p>
                        <p className="text-lg font-bold">{course?.code}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course Title</p>
                        <p className="text-lg font-bold">{course?.title}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructor</p>
                        <p className="text-lg font-bold">{user?.user_metadata?.full_name || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credit Hours</p>
                        <p className="text-lg font-bold">{course?.credit_hours} CH (+{course?.lab_hours} Lab)</p>
                    </div>
                </div>

                {/* 2. Grades & Attainment Table */}
                <div className="space-y-4">
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg">
                        <h3 className="font-bold text-sm tracking-widest uppercase">Student Grades & CLO Attainment</h3>
                    </div>
                    <div className="border border-slate-200 rounded-b-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-800 text-xs w-16">Sr.</TableHead>
                                    <TableHead className="font-bold text-slate-800 text-xs">Reg. No</TableHead>
                                    <TableHead className="font-bold text-slate-800 text-xs">Name</TableHead>
                                    <TableHead className="font-bold text-slate-800 text-xs text-center border-l border-slate-200">Total %</TableHead>
                                    <TableHead className="font-bold text-slate-800 text-xs text-center">Grade</TableHead>
                                    <TableHead className="font-bold text-slate-800 text-xs text-center border-r border-slate-200">GPA</TableHead>
                                    {clos.map(clo => (
                                        <TableHead key={clo.id} className="font-bold text-slate-800 text-xs text-center">{clo.code}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student, idx) => {
                                    const stats = calculateStudentStats(student.id);
                                    return (
                                        <TableRow key={student.id} className="border-b border-slate-100">
                                            <TableCell className="text-xs text-slate-500">{idx + 1}</TableCell>
                                            <TableCell className="text-xs font-mono font-bold">{student.reg_no}</TableCell>
                                            <TableCell className="text-xs font-bold">{student.name}</TableCell>
                                            <TableCell className="text-xs text-center border-l border-slate-100 font-bold">{stats.totalPercentage}%</TableCell>
                                            <TableCell className="text-xs text-center font-bold text-indigo-700">{stats.grade}</TableCell>
                                            <TableCell className="text-xs text-center border-r border-slate-100 font-bold">{stats.gpa}</TableCell>
                                            {clos.map(clo => {
                                                const att = calculateCLOAttainment(student.id, clo.id);
                                                return (
                                                    <TableCell key={clo.id} className={cn("text-xs text-center", getAttainmentColor(att))}>
                                                        {att ? `${att.percentage.toFixed(0)}%` : '-'}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* 3. CLO Attainment Graph */}
                <div className="space-y-4 pt-8 border-t border-slate-100 page-break-before">
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg">
                        <h3 className="font-bold text-sm tracking-widest uppercase">Class Overall CLO Attainment</h3>
                    </div>
                    <div className="border border-slate-200 rounded-b-lg p-8 h-[400px]">
                        {classCLOData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classCLOData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#475569', fontWeight: 600, fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={40} maxBarSize={60}>
                                        <LabelList dataKey="percentage" position="top" formatter={(val) => `${val}%`} style={{ fill: '#1E293B', fontWeight: 800, fontSize: 12 }} />
                                        {classCLOData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400">
                                No assessment data mapped to CLOs to build graph.
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Footer signatures */}
                <div className="grid grid-cols-2 gap-20 pt-20 mt-10">
                    <div className="border-t border-slate-300 pt-2 text-center">
                        <p className="text-xs font-bold text-slate-800">Course Instructor Signature</p>
                        <p className="text-[10px] text-slate-500 mt-1">{user?.user_metadata?.full_name}</p>
                    </div>
                    <div className="border-t border-slate-300 pt-2 text-center">
                        <p className="text-xs font-bold text-slate-800">Head of Department / Program Chair</p>
                        <p className="text-[10px] text-slate-500 mt-1">Signature & Stamp</p>
                    </div>
                </div>

            </div>
        </div>
    );
}

