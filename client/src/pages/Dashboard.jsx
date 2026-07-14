import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, User, ArrowUpRight, Activity, Calendar, Building } from 'lucide-react';
import useAuthStore from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

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
    
    const containerRef = useRef(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (!loading && containerRef.current) {
            // GSAP fade-in of stats cards and charts
            gsap.fromTo(cardsRef.current, 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
            );
        }
    }, [loading]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
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
            description: "Active academic tracks",
            icon: GraduationCap,
            color: "text-blue-600",
            bgColor: "bg-blue-50 border-blue-100/50",
            gradient: "from-blue-500/10 to-indigo-500/5"
        },
        {
            title: "Total Courses",
            value: stats.courses,
            description: "Courses in system catalog",
            icon: BookOpen,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50 border-emerald-100/50",
            gradient: "from-emerald-500/10 to-teal-500/5"
        },
        {
            title: "Active Sections",
            value: stats.classes,
            description: "Ongoing academic classes",
            icon: Users,
            color: "text-amber-600",
            bgColor: "bg-amber-50 border-amber-100/50",
            gradient: "from-amber-500/10 to-orange-500/5"
        },
        {
            title: "Faculty Members",
            value: stats.teachers,
            description: "Registered faculty teachers",
            icon: User,
            color: "text-violet-600",
            bgColor: "bg-violet-50 border-violet-100/50",
            gradient: "from-violet-500/10 to-purple-500/5"
        },
    ];

    return (
        <div className="space-y-8 pb-10" ref={containerRef}>
            {/* Header with gradient overlay */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 to-indigo-950 p-8 text-white shadow-lg border border-slate-800">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">OBE360 SYSTEM CONTROL</span>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-slate-300">
                            Welcome back, {user?.user_metadata?.full_name || 'Admin'}. Here is your institution's OBE statistics.
                        </p>
                    </div>
                    {user?.user_metadata?.organization_name && (
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 self-start md:self-auto">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300">
                                <Building className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none mb-0.5">Organization</p>
                                <p className="text-sm font-semibold leading-none text-white">
                                    {user.user_metadata.organization_name}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="border-slate-100 shadow-sm rounded-3xl">
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
                            <Card 
                                key={index} 
                                ref={el => cardsRef.current[index] = el}
                                className="border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden bg-white cursor-pointer group"
                            >
                                <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-6">
                                    <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`${stat.bgColor} border p-2.5 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Secondary Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Program Chart */}
                <Card 
                    ref={el => cardsRef.current[4] = el}
                    className="col-span-4 border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden"
                >
                    <CardHeader className="border-b border-slate-50 py-5 px-6">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <span>Program Distribution</span>
                        </div>
                        <CardDescription className="text-xs text-slate-400">
                            Number of active classes/sections per program.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            {loading ? (
                                <Skeleton className="h-full w-full rounded-2xl" />
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc', radius: 8 }}
                                            contentStyle={{ 
                                                borderRadius: '16px', 
                                                border: '1px solid #f1f5f9', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                                                fontFamily: 'Poppins, sans-serif',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar dataKey="value" fill="url(#blueGradient)" radius={[8, 8, 0, 0]} barSize={32} />
                                        <defs>
                                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#6366f1" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-100 rounded-2xl">
                                    <Calendar className="w-8 h-8 opacity-50" />
                                    <span className="text-xs">No active batches or classes data available.</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card 
                    ref={el => cardsRef.current[5] = el}
                    className="col-span-3 border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden"
                >
                    <CardHeader className="border-b border-slate-50 py-5 px-6">
                        <CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {loading ? (
                            Array(2).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                            ))
                        ) : (
                            <>
                                <div
                                    className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group"
                                    onClick={() => navigate('/admin/teachers')}
                                >
                                    <div className="bg-blue-50 border border-blue-100/50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <p className="text-sm font-semibold text-slate-700 leading-none">Manage Faculty</p>
                                        <p className="text-xs text-slate-400">Add, invite or review teachers.</p>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                </div>
                                
                                <div
                                    className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group"
                                    onClick={() => navigate('/admin/courses')}
                                >
                                    <div className="bg-emerald-50 border border-emerald-100/50 p-3 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                                        <BookOpen className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <p className="text-sm font-semibold text-slate-700 leading-none">Course Catalog</p>
                                        <p className="text-xs text-slate-400">Review and construct course curricula.</p>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
