import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as BarTooltip,
    PieChart, Pie, Cell, Legend, Tooltip as PieTooltip
} from 'recharts';

const COLORS = ['#107C41', '#2ca02c', '#89c540', '#f1c40f', '#e67e22', '#d35400', '#e74c3c', '#c0392b', '#7f8c8d'];
const GRADE_ORDER = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

export default function GPAAttainmentGraph() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [graphData, setGraphData] = useState(null);

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, mRes] = await Promise.all([
                fetch(`/api/courses/${courseId}`),
                fetch(`/api/assessments/course/${courseId}/export-all`)
            ]);

            let cData = null, mData = { marks: [], assessments: [], enrollments: [] };
            if (cRes.ok) cData = await cRes.json();
            if (mRes.ok) mData = await mRes.json();

            setCourse(cData);

            const assessments = mData.assessments || [];
            const marks = mData.marks || [];
            const students = mData.enrollments?.map(e => ({ id: e.student_id })) || [];

            // --- GPA Calculation Logic ---
            const creditHours = cData?.credit_hours || 3;
            const categoryConfig = {
                ASSIGNMENT: { totalWeight: 10 },
                QUIZ: { totalWeight: 10 },
                MID: { totalWeight: 30 },
                FINAL: { totalWeight: 50 }
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
                return { key: catKey, assessments: group, weightPerItem };
            });

            const getGrade = (percentage) => {
                if (percentage >= 85) return 'A';
                if (percentage >= 80) return 'A-';
                if (percentage >= 75) return 'B+';
                if (percentage >= 71) return 'B';
                if (percentage >= 68) return 'B-';
                if (percentage >= 64) return 'C+';
                if (percentage >= 61) return 'C';
                if (percentage >= 58) return 'C-';
                if (percentage >= 54) return 'D+';
                if (percentage >= 50) return 'D';
                return 'F';
            };

            // Calculate each student's grade
            const gradeCounts = {};
            GRADE_ORDER.forEach(g => gradeCounts[g] = 0);

            students.forEach(student => {
                let totalWeightedPercentage = 0;
                categoriesWithData.forEach(cat => {
                    let catObtained = 0;
                    cat.assessments.forEach(a => {
                        let aObtained = 0;
                        a.assessment_questions?.forEach(q => {
                            const mark = marks.find(m => m.student_id === student.id && String(m.question_id) === String(q.id));
                            if (mark && !mark.is_absent) aObtained += (parseFloat(mark.obtained_marks) || 0);
                        });
                        const aPercentage = a.maxMarks > 0 ? (aObtained / a.maxMarks) : 0;
                        catObtained += aPercentage * cat.weightPerItem;
                    });
                    totalWeightedPercentage += catObtained;
                });

                const grade = getGrade(totalWeightedPercentage);
                gradeCounts[grade]++;
            });

            // Format for Recharts
            const barData = GRADE_ORDER.map(grade => ({
                grade,
                count: gradeCounts[grade]
            })).filter(d => true); // Optionally filter(d => d.count > 0) to hide 0s

            const pieData = barData.filter(d => d.count > 0).map(d => ({
                name: d.grade,
                value: d.count
            }));

            setGraphData({ barData, pieData, totalStudents: students.length });

        } catch (error) {
            console.error(error);
            toast.error("Failed to load GPA data");
        } finally {
            setLoading(false);
        }
    };

    if (loading || !graphData) {
        return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;
    }

    const { barData, pieData, totalStudents } = graphData;
    const courseCodeStr = course?.code ? `- ${course.code}` : '';

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#337AB7] text-white rounded-xl shadow-md flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">GPA Attainment Graph</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase">Class Grade Distribution Analysis</p>
                    </div>
                </div>
            </div>

            {totalStudents === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">No students enrolled to generate GPA metrics.</p>
                </div>
            ) : pieData.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">No assessment marks found to calculate student grades.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* PIE CHART */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                            <h3 className="font-bold text-slate-700 text-sm mb-4">Grade Distribution % {courseCodeStr}</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={120} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <PieTooltip formatter={(val) => [`${val} Students`, 'Count']} />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* BAR CHART */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                            <h3 className="font-bold text-slate-700 text-sm mb-6">Student Volume per Grade {courseCodeStr}</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barCategoryGap="15%">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="grade" tick={{ fontSize: 13, fontWeight: 'bold' }} />
                                        <YAxis allowDecimals={false} label={{ value: 'No. of Students', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                                        <BarTooltip cursor={{ fill: '#f1f5f9' }} formatter={(val) => [`${val} Students`, 'Count']} />
                                        <Bar dataKey="count" name="Students" barSize={40} maxBarSize={60} radius={[4, 4, 0, 0]}>
                                            {barData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#337AB7' : '#e2e8f0'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
