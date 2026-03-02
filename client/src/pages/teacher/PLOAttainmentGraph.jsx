import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { User as UserIcon, Eye } from 'lucide-react';

export default function PLOAttainmentGraph() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [plos, setPlos] = useState([]);
    const [clos, setClos] = useState([]);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState([]);

    // UI state
    const [weightMode, setWeightMode] = useState("actual");
    const [includeCQI, setIncludeCQI] = useState(true);
    const [genderFilter, setGenderFilter] = useState("both");

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
                    reg_no: e.students.reg_no,
                    gender: e.students.gender || 'M'
                })) || [];
                setStudents(studentList);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load PLO data");
        } finally {
            setLoading(false);
        }
    };

    const calculateGraphData = () => {
        const filteredStudents = genderFilter === "both"
            ? students
            : students.filter(s => s.gender === (genderFilter === "male" ? "M" : "F"));

        if (filteredStudents.length === 0) return [];

        const activePlos = plos.filter(p => clos.some(clo => clo.plo_id === p.id));

        return activePlos.map(plo => {
            const mappedClos = clos.filter(clo => clo.plo_id === plo.id);
            let achievementCount = 0;

            filteredStudents.forEach(student => {
                let totalWeightedScore = 0;
                let totalWeight = 0;

                mappedClos.forEach(clo => {
                    const cloMarks = marks.filter(m => m.student_id === student.id);
                    const sum = cloMarks.reduce((acc, curr) => {
                        const max = curr.assessment_questions?.max_marks || 10;
                        return acc + (curr.obtained_marks / max) * 100;
                    }, 0);
                    const avg = cloMarks.length > 0 ? sum / cloMarks.length : 0;

                    totalWeightedScore += avg;
                    totalWeight += 1;
                });

                const weightedTotal = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
                if (weightedTotal >= 40) achievementCount++;
            });

            return {
                name: plo.code,
                fullName: plo.title,
                value: Number(((achievementCount / filteredStudents.length) * 100).toFixed(0))
            };
        });
    };

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    const data = calculateGraphData();
    const colors = ['#0275d8', '#5cb85c', '#f0ad4e', '#d9534f', '#5bc0de'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border shadow-sm">
                    <div className="bg-[#b5b5b5] text-white font-bold text-xs p-1.5 px-3">
                        {payload[0].payload.name}
                    </div>
                    <div className="p-2 flex items-center gap-2 text-xs text-slate-700 bg-white border border-t-0 border-slate-200">
                        <div className="w-2.5 h-2.5 bg-[#0275d8]"></div>
                        <span>Students Acheived %</span>
                        <span className="font-bold ml-1">{payload[0].value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white min-h-screen font-sans">
            {/* Page Title */}
            <h2 className="text-[22px] px-6 pt-6 text-slate-500 mb-6 font-normal">PLO Attainment Graph</h2>

            {/* Inner Container to hold content */}
            <div className="px-6 pb-20 max-w-[1200px]">

                {/* Course Details Card */}
                <div className="border border-slate-300 shadow-sm rounded-sm bg-white p-4 mb-6 flex items-start gap-4">
                    <div className="bg-[#aab0b6] text-white rounded-full p-2 w-12 h-12 flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <UserIcon size={32} strokeWidth={2.5} />
                    </div>
                    <div className="pt-0.5">
                        <h3 className="text-[17px] font-bold text-[#626262] mb-1.5">{course?.code}- {course?.title}</h3>
                        <p className="text-[13px] font-medium text-[#777] flex items-center gap-1.5">
                            <Eye size={18} className="text-[#8ac24a]" strokeWidth={2.5} />
                            {course?.code}T (B) / Nahid Mosharaf / Fall 2020 (2nd Semester)
                        </p>
                    </div>
                </div>

                {/* Top Controls */}
                <div className="flex flex-wrap items-start gap-x-12 gap-y-4 text-[13px] text-slate-700 mb-10 pb-6 border-b border-slate-100">

                    {/* Weighting Strategy */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[#428bca]">
                            <input
                                type="radio"
                                name="weightModeGraph"
                                value="actual"
                                checked={weightMode === "actual"}
                                onChange={() => setWeightMode("actual")}
                                className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer"
                            />
                            Actual Weights
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
                            <input
                                type="radio"
                                name="weightModeGraph"
                                value="normalized"
                                checked={weightMode === "normalized"}
                                onChange={() => setWeightMode("normalized")}
                                className="w-3.5 h-3.5 accent-slate-400 cursor-pointer"
                            />
                            Normalized Weights
                        </label>
                    </div>

                    {/* CQI Checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                        <input
                            type="checkbox"
                            checked={includeCQI}
                            onChange={(e) => setIncludeCQI(e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#2196F3] rounded-sm cursor-pointer"
                        />
                        Include CQI Activity
                    </label>

                    {/* Gender Filters */}
                    <div className="flex items-center gap-4 text-slate-700">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name="genderGraph"
                                value="both"
                                checked={genderFilter === "both"}
                                onChange={() => setGenderFilter("both")}
                                className="w-3.5 h-3.5 accent-[#2196F3] cursor-pointer"
                            />
                            Both
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name="genderGraph"
                                value="male"
                                checked={genderFilter === "male"}
                                onChange={() => setGenderFilter("male")}
                                className="w-3.5 h-3.5 accent-slate-400 cursor-pointer"
                            />
                            Male
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name="genderGraph"
                                value="female"
                                checked={genderFilter === "female"}
                                onChange={() => setGenderFilter("female")}
                                className="w-3.5 h-3.5 accent-slate-400 cursor-pointer"
                            />
                            Female
                        </label>
                    </div>

                    {/* Action Button */}
                    <div className="ml-10 shrink-0">
                        <button
                            onClick={fetchData}
                            className="bg-[#2a87d0] hover:bg-blue-600 text-white rounded px-5 py-1.5 text-[13px] shadow-sm transition-colors"
                        >
                            Show Graph
                        </button>
                    </div>
                </div>

                {/* Graph Title */}
                <div className="text-center mb-8">
                    <h3 className="text-[14px] text-slate-700">
                        Program Learning Outcomes Attainment (<span className="text-slate-800 font-bold">BSCV2020</span>)
                    </h3>
                </div>

                {/* The Chart */}
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 150, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />

                            <XAxis
                                dataKey="name"
                                axisLine={{ stroke: '#999' }}
                                tickLine={{ stroke: '#999' }}
                                tick={{ fill: '#333', fontSize: 11 }}
                                dy={10}
                            />

                            <YAxis
                                axisLine={{ stroke: '#999' }}
                                tickLine={{ stroke: '#999' }}
                                tick={{ fill: '#333', fontSize: 11 }}
                                domain={[0, 100]}
                                tickCount={11} // 0, 10, 20... 100
                                label={{ value: '% Attainment', angle: -90, position: 'insideLeft', dx: -10, dy: 50, style: { textAnchor: 'middle', fill: '#555', fontSize: 13 } }}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                            {/* Threshold Line at 50% */}
                            <ReferenceLine
                                y={50}
                                stroke="#ccc"
                                strokeopacity={0.5}
                                label={{
                                    position: 'right',
                                    value: 'Attainment Threshold',
                                    fill: '#999',
                                    fontSize: 11,
                                    dx: 10
                                }}
                            />

                            <Bar
                                dataKey="value"
                                barSize={250} // Make bars massive to match screenshot
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {data.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500 text-[13px]">
                        No data available to plot PLO attainment graph.
                    </div>
                )}
            </div>
        </div>
    );
}
