import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PLOAttainment() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [plos, setPlos] = useState([]);
    const [clos, setClos] = useState([]);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState([]);
    const [assessments, setAssessments] = useState([]);

    // UI state
    const [showWithMarks, setShowWithMarks] = useState("without");
    const [weightMode, setWeightMode] = useState("actual");
    const [includeCQI, setIncludeCQI] = useState(true);

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, mRes, pRes, clRes] = await Promise.all([
                fetch(`/api/courses/${courseId}`),
                fetch(`/api/assessments/course/${courseId}/export-all`),
                fetch(`/api/programs/plos/course/${courseId}`),
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
                // Sort to match typical registry
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

    const calculateAttainment = (studentId) => {
        const results = {};
        const plosInCourse = [...new Set(clos.map(clo => clo.plo_id).filter(id => id && id !== 'none'))];
        
        plosInCourse.forEach(ploId => {
            const mappedClos = clos.filter(clo => clo.plo_id === ploId);
            let totalWeightedScore = 0;
            let totalWeight = 0;

            mappedClos.forEach(clo => {
                // Filter marks for this student and this CLO
                const cloMarks = marks.filter(m => 
                    m.student_id === studentId && 
                    m.assessment_questions?.clo_id === clo.id &&
                    (includeCQI || !m.assessment_questions?.not_for_obe)
                );

                if (cloMarks.length === 0) return;

                let sumObtained = 0;
                let sumMax = 0;
                let sumPercentages = 0;

                cloMarks.forEach(m => {
                    const max = m.assessment_questions?.max_marks || 10;
                    sumObtained += m.obtained_marks;
                    sumMax += max;
                    sumPercentages += (m.obtained_marks / max) * 100;
                });

                let cloScore = 0;
                if (weightMode === "actual") {
                    cloScore = sumMax > 0 ? (sumObtained / sumMax) * 100 : 0;
                } else {
                    // Normalized: average of percentages
                    cloScore = sumPercentages / cloMarks.length;
                }

                totalWeightedScore += cloScore;
                totalWeight += 1;
            });

            const weightedTotal = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
            results[ploId] = {
                weightedTotal: weightedTotal.toFixed(2),
                isAchieved: weightedTotal >= 50 // Standard institutional KPI
            };
        });
        return results;
    };

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF('landscape');
            const title = "PLO Attainment Report";
            const courseCode = course?.code || "N/A";
            const courseTitle = course?.title || "N/A";
            doc.setFontSize(16);
            doc.text(title, 14, 15);
            doc.setFontSize(10);
            doc.text(`${courseCode} - ${courseTitle}`, 14, 22);
            doc.text(`Weighting: ${weightMode === 'actual' ? 'Actual' : 'Normalized'} | CQI: ${includeCQI ? 'Yes' : 'No'}`, 14, 27);

            const activePlos = plos.filter(p => clos.some(clo => clo.plo_id === p.id));

            const head = [
                [
                    { content: 'PLO', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
                    ...activePlos.map(plo => ({ content: plo.code, colSpan: 2, styles: { halign: 'center', textColor: '#3b82f6', fontStyle: 'bold' } }))
                ],
                [
                    { content: 'Registration No.', styles: { fillColor: [229, 231, 235], fontStyle: 'bold' } },
                    { content: 'Name', styles: { fillColor: [229, 231, 235], fontStyle: 'bold' } },
                    ...activePlos.flatMap(plo => [
                        { content: 'Weighted Total', styles: { halign: 'center', fontStyle: 'bold' } },
                        { content: 'Achieved (50%)', styles: { halign: 'center', fontStyle: 'bold' } }
                    ])
                ]
            ];

            const body = students.map((student) => {
                const attainment = calculateAttainment(student.id);
                const row = [student.reg_no, student.name];
                activePlos.forEach(plo => {
                    const res = attainment[plo.id] || { weightedTotal: "-", isAchieved: false };
                    row.push(String(res.weightedTotal), res.isAchieved ? "Y" : "N");
                });
                return row;
            });

            autoTable(doc, {
                startY: 35,
                head: head,
                body: body,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [200, 200, 200] },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 0) data.cell.styles.textColor = '#3b82f6';
                }
            });
            doc.save(`PLO_Attainment_${courseCode}.pdf`);
            toast.success("PDF Downloaded successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF");
        }
    };

    const coursePlos = plos.filter(p => clos.some(clo => clo.plo_id === p.id));

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="p-6 bg-white min-h-screen font-sans">
            <h2 className="text-[22px] text-slate-500 mb-6">PLOs Attainment</h2>

            <div className="flex flex-wrap items-start gap-x-16 gap-y-4 text-[13px] text-slate-700 mb-10">
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="markDisplay" value="without" checked={showWithMarks === "without"} onChange={() => setShowWithMarks("without")} className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer" />
                        Without Marks
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="markDisplay" value="with" checked={showWithMarks === "with"} onChange={() => setShowWithMarks("with")} className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer" />
                        With Marks
                    </label>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="weightMode" value="actual" checked={weightMode === "actual"} onChange={() => setWeightMode("actual")} className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer" />
                        Actual Weights
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="weightMode" value="normalized" checked={weightMode === "normalized"} onChange={() => setWeightMode("normalized")} className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer" />
                        Normalized Weights
                    </label>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-0.5">
                    <input type="checkbox" checked={includeCQI} onChange={(e) => setIncludeCQI(e.target.checked)} className="w-3.5 h-3.5 accent-[#2196F3] rounded-sm cursor-pointer" />
                    Include CQI Activity
                </label>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={fetchData} className="bg-[#2196F3] hover:bg-blue-600 text-white rounded px-5 py-1.5 text-[13px] shadow-sm transition-colors">Show Result</button>
                    <button onClick={handleDownloadPDF} className="bg-[#2196F3] hover:bg-blue-600 text-white rounded px-5 py-1.5 text-[13px] shadow-sm transition-colors">PDF</button>
                </div>
            </div>

            <div className="font-bold text-[13px] mb-2 flex items-center gap-1.5">
                <span className="text-slate-800">Program Batch :</span>
                <span className="text-[#2196F3]">BSCV2020</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white min-w-[250px]">PLO</th>
                            {coursePlos.map(plo => (
                                <th key={`plo-${plo.id}`} colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-[#2196F3] bg-white">{plo.code}</th>
                            ))}
                        </tr>
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white">Activity</th>
                            {coursePlos.map(plo => {
                                const mappedClos = clos.filter(c => c.plo_id === plo.id);
                                const activityCodes = assessments
                                    .filter(a => a.assessment_questions?.some(q => mappedClos.some(c => c.id === q.clo_id)))
                                    .map(a => a.name)
                                    .join(', ');

                                return (
                                    <React.Fragment key={`act-${plo.id}`}>
                                        <th rowSpan={3} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white align-middle min-w-[90px] text-[10px]">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-blue-600 truncate max-w-[80px]">{activityCodes || 'N/A'}</span>
                                                <div className="border-t border-slate-200 pt-1">
                                                    <span>Weighted Total</span>
                                                </div>
                                            </div>
                                        </th>
                                        <th rowSpan={3} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white align-middle min-w-[90px] text-[10px]">
                                            <div className="flex flex-col gap-1">
                                                <span>PLO Achieved</span>
                                            </div>
                                        </th>
                                    </React.Fragment>
                                );
                            })}
                        </tr>
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white">Assigned CLO</th>
                            {/* Handled by rowSpan in Activity row */}
                        </tr>
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white">% Weight</th>
                            {/* Handled by rowSpan in Activity row */}
                        </tr>
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 bg-white"></th>
                            {coursePlos.map(plo => (
                                <th key={`kpi-${plo.id}`} colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white text-[10px]">KPI 50%</th>
                            ))}
                        </tr>
                        <tr className="bg-[#e4e4e4] border-b border-slate-300">
                            <th className="p-2.5 font-bold text-slate-800 w-[180px] border-r border-slate-300">Registration No.</th>
                            <th className="p-2.5 font-bold text-slate-800 w-[240px] border-r border-slate-300">Name</th>
                            {coursePlos.map(plo => (
                                <React.Fragment key={`empty-${plo.id}`}>
                                    <th className="p-2.5 border-r border-slate-300"></th>
                                    <th className="p-2.5 border-r border-slate-300"></th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => {
                            const attainment = calculateAttainment(student.id);
                            return (
                                <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                    <td className="p-2.5 text-[#3b82f6] font-medium border-r border-slate-200">{student.reg_no}</td>
                                    <td className="p-2.5 text-slate-700 uppercase border-r border-slate-200">{student.name}</td>
                                    {coursePlos.map(plo => {
                                        const res = attainment[plo.id] || { weightedTotal: "-", isAchieved: false };
                                        return (
                                            <React.Fragment key={`${student.id}-${plo.id}`}>
                                                <td className="p-2.5 text-center text-slate-700 border-r border-slate-200">
                                                    <div className="flex flex-col">
                                                        <span>{res.weightedTotal}</span>
                                                        {showWithMarks === 'with' && (
                                                            <span className="text-[10px] text-blue-500 font-bold">Show Details</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2.5 text-center text-slate-700 border-r border-slate-200 font-bold">
                                                    {res.isAchieved ? <span className="text-green-600">Y</span> : <span className="text-red-600">N</span>}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {students.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500 text-[13px]">No student marks data available.</div>
            )}
        </div>
    );
}
