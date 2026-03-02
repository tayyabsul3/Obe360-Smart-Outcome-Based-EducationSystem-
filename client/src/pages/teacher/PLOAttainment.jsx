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
                fetch(`http://localhost:5000/api/courses/${courseId}`),
                fetch(`http://localhost:5000/api/assessments/course/${courseId}/export-all`),
                fetch(`http://localhost:5000/api/plos`),
                fetch(`http://localhost:5000/api/clos/course/${courseId}`)
            ]);

            if (cRes.ok) setCourse(await cRes.json());
            if (pRes.ok) setPlos(await pRes.json());
            if (clRes.ok) setClos(await clRes.json());

            if (mRes.ok) {
                const data = await mRes.json();
                setMarks(data.marks || []);
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
                const cloMarks = marks.filter(m => m.student_id === studentId);
                const sum = cloMarks.reduce((acc, curr) => {
                    const max = curr.assessment_questions?.max_marks || 10;
                    return acc + (curr.obtained_marks / max) * 100;
                }, 0);
                const avg = cloMarks.length > 0 ? sum / cloMarks.length : 0;
                totalWeightedScore += avg;
                totalWeight += 1;
            });
            const weightedTotal = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
            results[ploId] = {
                weightedTotal: weightedTotal.toFixed(2),
                isAchieved: weightedTotal >= 40
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
            doc.text(`Program Batch: BSCV2020 | Semester: 2nd Semester`, 14, 27);

            const activePlos = plos.filter(p => clos.some(clo => clo.plo_id === p.id));

            const head = [
                [
                    { content: 'PLO', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
                    ...activePlos.map(plo => ({ content: plo.code, colSpan: 2, styles: { halign: 'center', textColor: '#3b82f6', fontStyle: 'bold' } }))
                ],
                [
                    { content: 'Activity', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
                    ...activePlos.flatMap(plo => [
                        { content: 'Weighted Total', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } },
                        { content: 'PLO Acheived', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } }
                    ])
                ],
                [
                    { content: 'Assigned CLO', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }
                ],
                [
                    { content: '% Weight', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }
                ],
                [
                    { content: '', colSpan: 2 },
                    ...activePlos.map(plo => ({ content: 'KPI 40%', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }))
                ],
                [
                    { content: 'Registration No.', styles: { fillColor: [229, 231, 235], fontStyle: 'bold' } },
                    { content: 'Name', styles: { fillColor: [229, 231, 235], fontStyle: 'bold' } },
                    ...activePlos.flatMap(plo => [
                        { content: '', styles: { fillColor: [229, 231, 235] } },
                        { content: '', styles: { fillColor: [229, 231, 235] } }
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
                bodyStyles: { textColor: [50, 50, 50] },
                alternateRowStyles: { fillColor: [255, 255, 255] },
                didParseCell: function (data) {
                    if (data.section === 'body' && data.column.index === 0) {
                        data.cell.styles.textColor = '#3b82f6';
                    }
                    if (data.section === 'body' && data.column.index > 1) {
                        data.cell.styles.halign = 'center';
                    }
                }
            });
            doc.save(`PLO_Attainment_${courseCode}.pdf`);
            toast.success("PDF Downloaded successfully!");
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    const coursePlos = plos.filter(p => clos.some(clo => clo.plo_id === p.id));

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="p-6 bg-white min-h-screen font-sans">
            {/* Page Title */}
            <h2 className="text-[22px] text-slate-500 mb-6">PLOs Attainment</h2>

            {/* Top Controls */}
            <div className="flex flex-wrap items-start gap-x-16 gap-y-4 text-[13px] text-slate-700 mb-10">
                {/* Mark Display */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="markDisplay"
                            value="without"
                            checked={showWithMarks === "without"}
                            onChange={() => setShowWithMarks("without")}
                            className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer"
                        />
                        Without Marks
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="markDisplay"
                            value="with"
                            checked={showWithMarks === "with"}
                            onChange={() => setShowWithMarks("with")}
                            className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer"
                        />
                        With Marks
                    </label>
                </div>

                {/* Weighting Strategy */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="weightMode"
                            value="actual"
                            checked={weightMode === "actual"}
                            onChange={() => setWeightMode("actual")}
                            className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer"
                        />
                        Actual Weights
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="weightMode"
                            value="normalized"
                            checked={weightMode === "normalized"}
                            onChange={() => setWeightMode("normalized")}
                            className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer"
                        />
                        Normalized Weights
                    </label>
                </div>

                {/* CQI Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer mt-0.5">
                    <input
                        type="checkbox"
                        checked={includeCQI}
                        onChange={(e) => setIncludeCQI(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#2196F3] rounded-sm cursor-pointer"
                    />
                    Include CQI Activity
                </label>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={fetchData}
                        className="bg-[#2196F3] hover:bg-blue-600 text-white rounded px-5 py-1.5 text-[13px] shadow-sm transition-colors"
                    >
                        Show Result
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-[#2196F3] hover:bg-blue-600 text-white rounded px-5 py-1.5 text-[13px] shadow-sm transition-colors"
                    >
                        PDF
                    </button>
                </div>
            </div>

            {/* Program Batch Details */}
            <div className="font-bold text-[13px] mb-2 flex items-center gap-1.5">
                <span className="text-slate-800">Program Batch :</span>
                <span className="text-[#2196F3]">BSCV2020</span>
            </div>

            {/* Exact Table UI */}
            <div className="overflow-x-auto border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                        {/* Row 1 */}
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 tracking-wide min-w-[250px] whitespace-nowrap bg-white">
                                PLO
                            </th>
                            {coursePlos.map(plo => (
                                <th key={`plo-${plo.id}`} colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-[#2196F3] bg-white">
                                    {plo.code}
                                </th>
                            ))}
                        </tr>
                        {/* Row 2 */}
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white">
                                Activity
                            </th>
                            {coursePlos.map(plo => (
                                <React.Fragment key={`activity-${plo.id}`}>
                                    <th rowSpan={3} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white align-middle min-w-[90px]">
                                        <div className="flex flex-col">
                                            <span>Weighted</span>
                                            <span>Total</span>
                                        </div>
                                    </th>
                                    <th rowSpan={3} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white align-middle min-w-[90px]">
                                        <div className="flex flex-col">
                                            <span>PLO</span>
                                            <span>Acheived</span>
                                        </div>
                                    </th>
                                </React.Fragment>
                            ))}
                        </tr>
                        {/* Row 3 */}
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white">
                                Assigned CLO
                            </th>
                        </tr>
                        {/* Row 4 */}
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white">
                                % Weight
                            </th>
                        </tr>
                        {/* Row 5 */}
                        <tr>
                            <th colSpan={2} className="border-b border-r border-slate-200 p-2.5 bg-white"></th>
                            {coursePlos.map(plo => (
                                <th key={`kpi-${plo.id}`} colSpan={2} className="border-b border-r border-slate-200 p-2.5 text-center font-bold text-slate-800 bg-white">
                                    KPI 40%
                                </th>
                            ))}
                        </tr>
                        {/* Row 6 */}
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
                                                    {res.weightedTotal}
                                                </td>
                                                <td className="p-2.5 text-center text-slate-700 border-r border-slate-200">
                                                    {res.isAchieved ? "Y" : "N"}
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
                <div className="text-center py-12 text-slate-500 text-[13px]">
                    No student marks data available to calculate PLO attainment.
                </div>
            )}
        </div>
    );
}
