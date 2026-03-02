import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { FileDown, FileSpreadsheet, Target } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export default function PLOReport() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [plos, setPlos] = useState([]);
    const [clos, setClos] = useState([]);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState([]);
    const [assessments, setAssessments] = useState([]);

    const chartRef = useRef(null);

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, mRes, pRes, clRes] = await Promise.all([
                fetch(`/api/courses/${courseId}`),
                fetch(`/api/assessments/course/${courseId}/export-all`),
                fetch(`/api/plos`),
                fetch(`/api/clos/${courseId}`)
            ]);

            if (cRes.ok) setCourse(await cRes.json());
            if (pRes.ok) setPlos(await pRes.json());
            if (clRes.ok) setClos(await clRes.json());

            if (mRes.ok) {
                const data = await mRes.json();
                setMarks(data.marks || []);
                setAssessments(data.assessments || []);
                const studentList = data.enrollments?.map(e => ({
                    id: e.student_id,
                    name: e.students.name,
                    reg_no: e.students.reg_no
                })) || [];
                studentList.sort((a, b) => a.reg_no.localeCompare(b.reg_no));
                setStudents(studentList);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load PLO data");
        } finally {
            setLoading(false);
        }
    };

    const getAttainmentData = () => {
        // 1. Build question map: question_id -> { clo_id, max_marks }
        const qMap = {};
        assessments.forEach(a => {
            if (a.assessment_questions) {
                a.assessment_questions.forEach(q => {
                    qMap[q.id] = { clo_id: q.clo_id, max_marks: q.max_marks };
                });
            }
        });

        // 2. Map PLO -> CLOs
        const ploToClos = {};
        plos.forEach(p => {
            ploToClos[p.id] = clos.filter(c => c.plo_id === p.id).map(c => c.id);
        });

        // 3. Calculate for each student
        const studentResults = students.map(student => {
            const studentMarks = marks.filter(m => m.student_id === student.id);
            const ploScores = {};

            plos.forEach(plo => {
                const cloIds = ploToClos[plo.id] || [];
                if (cloIds.length === 0) {
                    ploScores[plo.id] = { score: 0, achieved: false, attempted: false };
                    return;
                }

                let totalCloPercentage = 0;
                let validClosCount = 0;

                cloIds.forEach(cloId => {
                    const mappedQuestions = Object.entries(qMap)
                        .filter(([qId, qData]) => qData.clo_id === cloId)
                        .map(([qId]) => qId);

                    if (mappedQuestions.length === 0) return;

                    let sumObtained = 0;
                    let sumMax = 0;

                    mappedQuestions.forEach(qId => {
                        const m = studentMarks.find(mark => String(mark.question_id) === String(qId));
                        const maxMarks = qMap[qId].max_marks || 0;
                        if (m && !m.is_absent) {
                            sumObtained += m.obtained_marks || 0;
                        }
                        sumMax += maxMarks;
                    });

                    if (sumMax > 0) {
                        const cloScore = (sumObtained / sumMax) * 100;
                        totalCloPercentage += cloScore;
                        validClosCount++;
                    }
                });

                if (validClosCount > 0) {
                    const ploAvg = totalCloPercentage / validClosCount;
                    ploScores[plo.id] = {
                        score: parseFloat(ploAvg.toFixed(2)),
                        achieved: ploAvg >= 50, // Standard KPI
                        attempted: true
                    };
                } else {
                    ploScores[plo.id] = { score: 0, achieved: false, attempted: false };
                }
            });

            return { ...student, ploScores };
        });

        // 4. Calculate Aggregate Graph Data
        const activePlos = plos.filter(p => clos.some(c => c.plo_id === p.id));
        const graphData = activePlos.map(plo => {
            let achievementCount = 0;
            let validStudents = 0;

            studentResults.forEach(sr => {
                const res = sr.ploScores[plo.id];
                if (res && res.attempted) {
                    validStudents++;
                    if (res.achieved) achievementCount++;
                }
            });

            const percentage = validStudents > 0 ? (achievementCount / validStudents) * 100 : 0;
            return {
                name: plo.code,
                fullName: plo.title,
                value: Number(percentage.toFixed(0))
            };
        });

        return { studentResults, graphData, activePlos };
    };

    const handleExportPDF = async () => {
        const toastId = toast.loading("Generating Unified PDF...");
        try {
            const { studentResults, activePlos } = getAttainmentData();
            const doc = new jsPDF('landscape');

            // Wait for chart image
            let chartImage = null;
            if (chartRef.current) {
                const canvas = await html2canvas(chartRef.current, { scale: 2 });
                chartImage = canvas.toDataURL('image/jpeg', 1.0);
            }

            // Header
            doc.setFontSize(16);
            doc.text("Unified PLO Attainment Report", 14, 15);
            doc.setFontSize(10);
            doc.text(`${course?.code || ''} - ${course?.title || ''}`, 14, 22);

            let currentY = 30;

            // Add Chart
            if (chartImage) {
                // Adjust chart size to fit landscape A4 comfortably
                doc.addImage(chartImage, 'JPEG', 14, currentY, 260, 90);
                currentY += 95;
            }

            // Add Table
            const head = [
                ['Reg No.', 'Name', ...activePlos.map(p => p.code)]
            ];

            const body = studentResults.map(s => {
                const row = [s.reg_no, s.name];
                activePlos.forEach(plo => {
                    const res = s.ploScores[plo.id];
                    row.push(res && res.attempted ? `${res.score}% (${res.achieved ? 'Y' : 'N'})` : '-');
                });
                return row;
            });

            autoTable(doc, {
                startY: currentY,
                head: head,
                body: body,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [59, 130, 246] },
                didParseCell: (data) => {
                    // Highlight 'N' in light red
                    if (data.section === 'body' && data.column.index > 1) {
                        const val = data.cell.raw;
                        if (val && val.includes('(N)')) {
                            data.cell.styles.fillColor = [254, 226, 226]; // tailwind red-100
                            data.cell.styles.textColor = [220, 38, 38]; // tailwind red-600
                        }
                    }
                }
            });

            doc.save(`PLO_Report_${course?.code || 'Course'}.pdf`);
            toast.dismiss(toastId);
            toast.success("PDF Generated Successfully!");
        } catch (error) {
            console.error(error);
            toast.dismiss(toastId);
            toast.error("Failed to generate PDF");
        }
    };

    const handleExportExcel = () => {
        try {
            const { studentResults, activePlos } = getAttainmentData();

            const dataToExport = studentResults.map(s => {
                const row = {
                    'Registration Number': s.reg_no,
                    'Student Name': s.name
                };

                activePlos.forEach(plo => {
                    const res = s.ploScores[plo.id];
                    row[`${plo.code} Score (%)`] = res && res.attempted ? res.score : '-';
                    row[`${plo.code} Attained`] = res && res.attempted ? (res.achieved ? 'Yes' : 'No') : '-';
                });

                return row;
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "PLO Attainment");
            XLSX.writeFile(wb, `PLO_Report_${course?.code || 'Course'}.xlsx`);
            toast.success("Excel Downloaded!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate Excel");
        }
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    const { studentResults, graphData, activePlos } = getAttainmentData();

    return (
        <div className="p-6 bg-white min-h-screen font-sans max-w-[1400px] mx-auto animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Target className="text-blue-600" /> Unified PLO Report
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{course?.code} - {course?.title}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <FileSpreadsheet size={16} /> Excel Export
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <FileDown size={16} /> PDF Export
                    </button>
                </div>
            </div>

            {/* Warning if no data */}
            {activePlos.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm mb-6">
                    No PLOs are mapped to CLOs in this course yet. Please map queries to CLOs, and CLOs to PLOs.
                </div>
            )}

            {/* Graph Section */}
            {activePlos.length > 0 && (
                <div className="border border-slate-200 rounded-xl shadow-sm mb-8 overflow-hidden bg-white">
                    <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700">Class PLO Achievement Summary</h3>
                    </div>
                    <div className="p-6" ref={chartRef}>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={{ stroke: '#cbd5e1' }}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        axisLine={{ stroke: '#cbd5e1' }}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 12 }}
                                        label={{ value: '% Students Achieved (>=50%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white border shadow-lg rounded-lg p-3">
                                                        <p className="font-bold text-slate-800 text-sm mb-1">{payload[0].payload.fullName}</p>
                                                        <p className="text-blue-600 font-bold">{payload[0].value}% Achieved</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'KPI Threshold', fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={80}>
                                        {graphData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.value >= 50 ? '#3b82f6' : '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Section */}
            {activePlos.length > 0 && (
                <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white pb-10">
                    <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700">Detailed Student Attainment</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-blue-50/50">
                                    <th className="p-3 border-b border-slate-200 font-semibold text-slate-600">Reg No.</th>
                                    <th className="p-3 border-b border-slate-200 font-semibold text-slate-600">Name</th>
                                    {activePlos.map(plo => (
                                        <th key={plo.id} className="p-3 border-b border-slate-200 font-bold text-blue-700 text-center">
                                            {plo.code}
                                            <div className="text-[10px] font-normal text-slate-500 truncate max-w-[120px] mx-auto" title={plo.title}>
                                                {plo.title}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {studentResults.map((student, idx) => (
                                    <tr key={student.id} className={`border-b border-slate-100 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                        <td className="p-3 text-blue-600 font-medium whitespace-nowrap">{student.reg_no}</td>
                                        <td className="p-3 text-slate-700">{student.name}</td>
                                        {activePlos.map(plo => {
                                            const res = student.ploScores[plo.id];
                                            if (!res || !res.attempted) {
                                                return <td key={plo.id} className="p-3 text-center text-slate-400">-</td>;
                                            }
                                            return (
                                                <td key={plo.id} className="p-3 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span className="font-semibold text-slate-700">{res.score}%</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${res.achieved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                            {res.achieved ? 'ACHIEVED' : 'NOT ACHIEVED'}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {studentResults.length === 0 && (
                                    <tr>
                                        <td colSpan={activePlos.length + 2} className="p-8 text-center text-slate-500">
                                            No student data found for calculating attainment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
