import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Layout, TrendingUp, BarChart3, GraduationCap, Award, Target, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as BarTooltip
} from 'recharts';

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
const GRADE_COLORS = ['#107C41', '#2ca02c', '#89c540', '#f1c40f', '#e67e22', '#d35400', '#e74c3c', '#c0392b', '#7f8c8d'];
const GRADE_ORDER = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

const chartConfig = {
    attainment: {
        label: "Attainment Mastery",
        color: "hsl(var(--chart-2))",
    },
};

const getBarColor = (val) => {
    if (val >= 70) return "hsl(var(--chart-2))"; // Emerald
    if (val >= 50) return "hsl(var(--chart-4))"; // Amber
    return "hsl(var(--chart-1))"; // Rose
};

export default function CourseBreadth() {
    const { courseId } = useParams();
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
                    name: e.students?.name || 'Unknown',
                    reg_no: e.students?.reg_no || 'Unknown'
                })) || [];
                studentList.sort((a, b) => a.reg_no.localeCompare(b.reg_no));
                setStudents(studentList);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load comprehensive report data");
        } finally {
            setLoading(false);
        }
    };

    // --- Calculations & Logic ---
    const creditHours = course?.credit_hours || 3;
    const categoryConfig = {
        ASSIGNMENT: { label: 'Assignments', totalWeight: 10 },
        QUIZ: { label: 'Quizzes', totalWeight: 10 },
        MID: { label: 'Mid Term', totalWeight: 30 },
        FINAL: { label: 'Final Exam', totalWeight: 50 }
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
        return { key: catKey, ...config, assessments: group, weightPerItem };
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
        let totalRawMax = 0;
        let totalRawObtained = 0;

        categoriesWithData.forEach(cat => {
            let catObtained = 0;
            cat.assessments.forEach(a => {
                totalRawMax += a.maxMarks;
                let aObtained = 0;
                a.assessment_questions?.forEach(q => {
                    const mk = marks.find(m => m.student_id === studentId && String(m.question_id) === String(q.id));
                    if (mk && !mk.is_absent) aObtained += (parseFloat(mk.obtained_marks) || 0);
                });
                totalRawObtained += aObtained;
                const aPercentage = a.maxMarks > 0 ? (aObtained / a.maxMarks) : 0;
                catObtained += aPercentage * cat.weightPerItem;
            });
            totalWeightedPercentage += catObtained;
        });

        const { grade, gpa } = getGradeAndGPA(totalWeightedPercentage);
        return {
            totalPercentage: totalWeightedPercentage.toFixed(1),
            rawTotal: totalRawMax.toFixed(1),
            rawObtained: totalRawObtained.toFixed(1),
            grade,
            gpa: gpa.toFixed(2)
        };
    };

    const calculateCLOAttainment = (studentId, cloId) => {
        let totalMax = 0;
        let totalObtained = 0;
        let hasData = false;

        assessments.forEach(a => {
            a.assessment_questions?.forEach(q => {
                if (String(q.clo_id) === String(cloId)) {
                    const studentMark = marks.find(m => m.student_id === studentId && String(m.question_id) === String(q.id));
                    totalMax += (parseFloat(q.max_marks) || 0);
                    if (studentMark && !studentMark.is_absent) {
                        totalObtained += (parseFloat(studentMark.obtained_marks) || 0);
                        hasData = true;
                    }
                }
            });
        });

        if (totalMax === 0) return null;
        return { percentage: (totalObtained / totalMax) * 100, hasData };
    };

    // --- Pre-compute Data for Charts & Tables ---
    // 1. GPA Stats
    const gradeCounts = {};
    GRADE_ORDER.forEach(g => gradeCounts[g] = 0);
    const studentStatsMap = {};

    students.forEach(s => {
        const stats = calculateStudentStats(s.id);
        studentStatsMap[s.id] = stats;
        gradeCounts[stats.grade]++;
    });

    const gpaBarData = GRADE_ORDER.map(grade => ({ grade, count: gradeCounts[grade] }));
    const gpaPieData = gpaBarData.filter(d => d.count > 0).map(d => ({ name: d.grade, value: d.count }));

    // 2. CLO Stats
    const classCLOData = clos.map(clo => {
        let totalMax = 0;
        let totalObtained = 0;
        students.forEach(s => {
            let sTotalMax = 0;
            let sTotalObtained = 0;
            assessments.forEach(a => {
                a.assessment_questions?.forEach(q => {
                    if (String(q.clo_id) === String(clo.id)) {
                        const m = marks.find(mk => mk.student_id === s.id && String(mk.question_id) === String(q.id));
                        sTotalMax += (parseFloat(q.max_marks) || 0);
                        if (m && !m.is_absent) sTotalObtained += (parseFloat(m.obtained_marks) || 0);
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
            fill: percentage >= 50 ? '#10B981' : '#F43F5E'
        };
    });

    // --- PDF Render ---
    const handleDownloadPDF = async () => {
        setExporting(true);
        toast.info("Generating Comprehensive Dashboard PDF... Please wait.");

        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            let currentY = 15;

            // 1. Title Header
            doc.setFontSize(18);
            doc.text("Comprehensive Course Dashboard", 14, currentY);
            currentY += 8;
            doc.setFontSize(12);
            doc.text(`${course?.code} - ${course?.title}`, 14, currentY);
            currentY += 6;
            doc.setFontSize(10);
            doc.text(`Credit Hours: ${creditHours} | Instructor: ${course?.teachers?.name || 'N/A'}`, 14, currentY);
            currentY += 12;

            // 2. Award List & GPA Assessment Table
            doc.setFontSize(14);
            doc.text("Award List & GPA Assessment Table", 14, currentY);
            currentY += 6;

            const gpaHead = [['Sr.', 'Reg No', 'Name', 'Total Marks', 'Obtained Marks', 'Percentage', 'Grade', 'GPA']];
            const gpaBody = students.map((s, idx) => {
                const stats = studentStatsMap[s.id];
                return [
                    idx + 1,
                    s.reg_no,
                    s.name,
                    stats.rawTotal,
                    stats.rawObtained,
                    `${stats.totalPercentage}%`,
                    stats.grade,
                    stats.gpa
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: gpaHead,
                body: gpaBody,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
                didDrawPage: (data) => {
                    currentY = data.cursor.y + 10;
                }
            });

            // 3. GPA Charts (Html2Canvas for visuals)
            const chartsContainer = reportRef.current?.querySelector('.grid-cols-1.lg\\:grid-cols-2');
            if (chartsContainer) {
                const canvas = await html2canvas(chartsContainer, { scale: 2, logging: false });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 28;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Check if chart fits on current page, if not, add page
                if (currentY + imgHeight + 20 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    currentY = 15;
                } else {
                    currentY += 10; // add some padding from the table above
                }

                doc.setFontSize(14);
                doc.text("Grade Distribution & Student Volume", 14, currentY);
                currentY += 5;

                doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 15;
            }

            // 4. CLO Attainment Matrix
            doc.addPage();
            currentY = 15;
            doc.setFontSize(14);
            doc.text("CLO Attainment Matrix", 14, currentY);
            currentY += 6;

            const cloHead = [['Reg No.', 'Name', ...clos.map(c => c.code)]];
            const cloBody = students.map(s => {
                const row = [s.reg_no, s.name];
                clos.forEach(clo => {
                    const att = calculateCLOAttainment(s.id, clo.id);
                    if (att && att.hasData) {
                        row.push(`${att.percentage.toFixed(1)}%`);
                    } else {
                        row.push('-');
                    }
                });
                return row;
            });

            autoTable(doc, {
                startY: currentY,
                head: cloHead,
                body: cloBody,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
                headStyles: { fillColor: [5, 150, 105] }, // Emerald-600
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index > 1) {
                        const val = parseFloat(data.cell.raw);
                        if (!isNaN(val)) {
                            if (val >= 70) data.cell.styles.textColor = [5, 150, 105]; // Green
                            else if (val >= 50) data.cell.styles.textColor = [217, 119, 6]; // Amber
                            else data.cell.styles.textColor = [225, 29, 72]; // Rose
                        }
                    }
                },
                didDrawPage: (data) => {
                    currentY = data.cursor.y + 10;
                }
            });

            // 5. CLO Graph Container
            const cloGraphContainer = reportRef.current?.querySelector('.space-y-6');
            if (cloGraphContainer) {
                doc.addPage();
                currentY = 15;
                doc.setFontSize(14);
                doc.text("Class-Wide CLO Mastery", 14, currentY);
                currentY += 5;

                const cloCanvas = await html2canvas(cloGraphContainer, { scale: 2, logging: false });
                const cloImgData = cloCanvas.toDataURL('image/png');
                const cloImgWidth = pageWidth - 28;
                const cloImgHeight = (cloCanvas.height * cloImgWidth) / cloCanvas.width;

                // If it's too tall, scale it down to fit one page
                const finalHeight = Math.min(cloImgHeight, doc.internal.pageSize.getHeight() - currentY - 10);
                const finalWidth = (finalHeight * cloImgWidth) / cloImgHeight;

                doc.addImage(cloImgData, 'PNG', 14, currentY, finalWidth, finalHeight);
            }

            doc.save(`${course?.code || 'Course'}_Comprehensive_Dashboard.pdf`);
            toast.success("PDF Downloaded Successfully");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;
    if (!course) return <div className="p-12 text-center text-slate-500">Course data not found.</div>;

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        if (percent < 0.05) return null;
        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto p-4 sm:p-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 text-white rounded-xl shadow-md flex items-center justify-center">
                        <Layout size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Comprehensive Dashboard</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase">{course.code} - {course.title}</p>
                    </div>
                </div>
                <Button onClick={handleDownloadPDF} disabled={exporting || students.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    {exporting ? <><DownloadCloud className="mr-2 h-4 w-4 animate-bounce" /> Exporting...</> : <><DownloadCloud className="mr-2 h-4 w-4" /> Download PDF</>}
                </Button>
            </div>

            <div ref={reportRef} className="bg-slate-50 p-4 sm:p-8 rounded-xl space-y-12">
                {/* 1. Header Details */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">{course.title}</h1>
                    <h2 className="text-lg font-bold text-slate-600">{course.code} • {creditHours} Credit Hours</h2>
                    <p className="text-sm text-slate-500">Instructor: {course.teachers?.name || 'Assigned Instructor'}</p>
                </div>

                {/* 2. Award List / Grade Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-blue-50/50 p-4 border-b border-slate-200 flex items-center gap-2">
                        <Award className="text-blue-600" size={20} />
                        <h3 className="font-bold text-slate-800">Award List & GPA Assessment Table</h3>
                    </div>
                    <div className="p-4">
                        <Table className="text-sm border">
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-bold border-r w-[60px]">Sr.</TableHead>
                                    <TableHead className="font-bold border-r min-w-[120px]">Reg No</TableHead>
                                    <TableHead className="font-bold border-r min-w-[200px]">Name</TableHead>
                                    <TableHead className="font-bold border-r text-center">Total Marks</TableHead>
                                    <TableHead className="font-bold border-r text-center">Obtained Marks</TableHead>
                                    <TableHead className="font-bold border-r text-center">Percentage</TableHead>
                                    <TableHead className="font-bold border-r text-center">Grade</TableHead>
                                    <TableHead className="font-bold text-center">GPA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((s, index) => {
                                    const stats = studentStatsMap[s.id];
                                    return (
                                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                                            <TableCell className="border-r text-center">{index + 1}</TableCell>
                                            <TableCell className="border-r font-medium text-slate-700">{s.reg_no}</TableCell>
                                            <TableCell className="border-r text-slate-600">{s.name}</TableCell>
                                            <TableCell className="border-r text-center text-slate-600">{stats.rawTotal}</TableCell>
                                            <TableCell className="border-r text-center font-bold text-indigo-700">{stats.rawObtained}</TableCell>
                                            <TableCell className="border-r text-center font-bold text-blue-700">{stats.totalPercentage}%</TableCell>
                                            <TableCell className="border-r text-center font-black">{stats.grade}</TableCell>
                                            <TableCell className="text-center font-bold text-emerald-600">{stats.gpa}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {students.length === 0 && (
                                    <TableRow><TableCell colSpan={8} className="text-center p-8 text-slate-500">No students enrolled.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* 3. GPA Graphs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <TrendingUp className="text-emerald-600" size={20} />
                            <h3 className="font-bold text-slate-700 text-sm">Grade Distribution %</h3>
                        </div>
                        <div className="h-[350px]">
                            {gpaPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={gpaPieData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={120} dataKey="value">
                                            {gpaPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={GRADE_COLORS[index % GRADE_COLORS.length]} />)}
                                        </Pie>
                                        <PieTooltip formatter={(val) => [`${val} Students`, 'Count']} />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">No Assessment Data</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <BarChart3 className="text-blue-600" size={20} />
                            <h3 className="font-bold text-slate-700 text-sm">Student Volume per Grade</h3>
                        </div>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gpaBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barCategoryGap="15%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="grade" tick={{ fontSize: 13, fontWeight: 'bold' }} />
                                    <YAxis allowDecimals={false} />
                                    <BarTooltip cursor={{ fill: '#f1f5f9' }} formatter={(val) => [`${val} Students`, 'Count']} />
                                    <Bar dataKey="count" name="Students">
                                        {gpaBarData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#337AB7' : '#e2e8f0'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 4. CLO Attainment Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-emerald-50/50 p-4 border-b border-slate-200 flex items-center gap-2">
                        <GraduationCap className="text-emerald-600" size={20} />
                        <h3 className="font-bold text-slate-800">CLO Attainment Matrix</h3>
                    </div>
                    <div className="p-4">
                        <Table className="text-sm border">
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-bold border-r min-w-[120px]">Reg No</TableHead>
                                    <TableHead className="font-bold border-r min-w-[200px]">Name</TableHead>
                                    {clos.map(clo => (
                                        <TableHead key={clo.id} className="font-bold border-r text-center">{clo.code}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-slate-50/50">
                                        <TableCell className="border-r font-medium text-slate-700">{s.reg_no}</TableCell>
                                        <TableCell className="border-r text-slate-600">{s.name}</TableCell>
                                        {clos.map(clo => {
                                            const att = calculateCLOAttainment(s.id, clo.id);
                                            let colorClass = "text-slate-400";
                                            let displayVal = "-";
                                            if (att && att.hasData) {
                                                const p = att.percentage;
                                                displayVal = p.toFixed(1) + "%";
                                                if (p >= 70) colorClass = "text-emerald-700 font-bold";
                                                else if (p >= 50) colorClass = "text-amber-600 font-bold";
                                                else colorClass = "text-rose-600 font-bold";
                                            }
                                            return (
                                                <TableCell key={clo.id} className={`border-r text-center ${colorClass}`}>
                                                    {displayVal}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                                {students.length === 0 && (
                                    <TableRow><TableCell colSpan={clos.length + 2} className="text-center p-8 text-slate-500">No students enrolled.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                {/* 5. Exact CLO Graph & Info Grid from CLOAttainmentGraph */}
                <div className="space-y-6">
                    <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Layout size={16} /> CLO Attainment Overview
                                    </CardTitle>
                                    <CardDescription className="text-xs font-bold mt-1">Class average percentage for each Course Learning Outcome</CardDescription>
                                </div>
                                <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 font-black">ALL CLOs</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ChartContainer config={chartConfig} className="h-[400px] w-full">
                                <BarChart data={classCLOData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12 }}
                                        domain={[0, 100]}
                                        unit="%"
                                    />
                                    <ChartTooltip
                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar
                                        dataKey="percentage"
                                        radius={[6, 6, 0, 0]}
                                        barSize={60}
                                    >
                                        {classCLOData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                            <div className="flex gap-3">
                                <TrendingUp className="text-emerald-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-emerald-900">High Mastery (&gt;70%)</h4>
                                    <p className="text-xs text-emerald-800 mt-1">Outcomes where the class has demonstrated strong understanding and application.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                            <div className="flex gap-3">
                                <Info className="text-amber-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-amber-900">Average Mastery (50-70%)</h4>
                                    <p className="text-xs text-amber-800 mt-1">Outcomes that might require additional attention or specific review sessions.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                            <div className="flex gap-3">
                                <Target className="text-rose-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-rose-900">Low Mastery (&lt;50%)</h4>
                                    <p className="text-xs text-rose-800 mt-1">Critical gaps identified. Consider adjusting teaching strategies for these outcomes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                            <Info size={14} /> Outcome Details
                        </h4>
                        <div className="space-y-3">
                            {clos.map(clo => (
                                <div key={clo.id} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <Badge className="shrink-0 font-black">{clo.code}</Badge>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-900">{clo.title || 'Untitled CLO'}</h5>
                                        <p className="text-xs text-slate-500 mt-0.5">{clo.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
