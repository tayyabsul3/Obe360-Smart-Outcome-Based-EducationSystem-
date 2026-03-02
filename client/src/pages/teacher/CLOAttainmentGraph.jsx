import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    BarChart3, 
    Target, 
    TrendingUp,
    Info,
    Layout
} from 'lucide-react';
import { toast } from 'sonner';

export default function CLOAttainmentGraph() {
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
                const studentList = data.enrollments.map(e => ({
                    id: e.student_id
                }));
                setStudents(studentList);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load charting data");
        } finally {
            setLoading(false);
        }
    };

    const calculateCLOMastery = (cloId) => {
        let totalMax = 0;
        let totalObtained = 0;

        students.forEach(s => {
            assessments.forEach(a => {
                if (!a.include_in_gpa) return;
                a.assessment_questions?.forEach(q => {
                    if (q.clo_id === cloId && !q.not_for_obe) {
                        const studentMark = marks.find(m => m.student_id === s.id && m.question_id === q.id);
                        totalMax += (q.max_marks || 0);
                        if (studentMark && !studentMark.is_absent) {
                            totalObtained += (studentMark.obtained_marks || 0);
                        }
                    }
                });
            });
        });

        return totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    };

    const chartData = clos.map(clo => ({
        clo: clo.code,
        attainment: calculateCLOMastery(clo.id),
        fullTitle: clo.title
    }));

    const chartConfig = {
      attainment: {
        label: "Attainment Mastery",
        color: "hsl(var(--chart-2))",
      },
    }

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-96 w-full" /></div>;

    const getBarColor = (val) => {
        if (val >= 70) return "hsl(var(--chart-2))"; // Emerald/Green theme
        if (val >= 50) return "hsl(var(--chart-4))"; // Amber/Yellow theme
        return "hsl(var(--chart-1))"; // Rose/Red theme
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none">CLO Mastery Graph</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Class-wide Outcome Performance Visualizer</p>
                    </div>
                </div>
            </div>

            {/* Main Mastery Chart */}
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
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
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100" />
                            <XAxis 
                                dataKey="clo" 
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
                                dataKey="attainment" 
                                radius={[6, 6, 0, 0]} 
                                barSize={60}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.attainment)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Legend/Info Grid */}
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
    );
}
