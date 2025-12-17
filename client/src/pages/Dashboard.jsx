import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, User, ArrowUpRight } from 'lucide-react';
import useAuthStore from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        programs: 0,
        courses: 0,
        classes: 0,
        teachers: 0
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard/stats');
            const data = await res.json();
            if (res.ok) {
                setStats(data.stats);
                setChartData(data.chartData);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Total Programs",
            value: stats.programs,
            description: "Active academic programs",
            icon: GraduationCap,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            title: "Total Courses",
            value: stats.courses,
            description: "Courses in catalog",
            icon: BookOpen,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            title: "Active Classes",
            value: stats.classes,
            description: "Ongoing sections",
            icon: Users,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
        {
            title: "Faculty Members",
            value: stats.teachers,
            description: "Registerd teachers",
            icon: User,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || 'Admin'}. Here is an overview of the system.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="border-slate-200 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[60px] mb-2" />
                                <Skeleton className="h-3 w-[140px]" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-600">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`${stat.bgColor} p-2 rounded-full`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground pt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Program Distribution</CardTitle>
                        <CardDescription>
                            Number of active classes per program.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            {loading ? (
                                <Skeleton className="h-full w-full" />
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    No data available for chart.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {loading ? (
                            Array(2).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-md" />
                            ))
                        ) : (
                            <>
                                <div
                                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => navigate('/admin/teachers')}
                                >
                                    <div className="bg-blue-100 p-2.5 rounded-full group-hover:bg-blue-200 transition-colors">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-semibold leading-none">Manage Faculty</p>
                                        <p className="text-xs text-muted-foreground">View or invite teachers.</p>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-slate-900" />
                                </div>
                                <div
                                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => navigate('/admin/courses')}
                                >
                                    <div className="bg-green-100 p-2.5 rounded-full group-hover:bg-green-200 transition-colors">
                                        <BookOpen className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-semibold leading-none">Course Catalog</p>
                                        <p className="text-xs text-muted-foreground">Add or edit courses.</p>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-slate-900" />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
