import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import useSemesterStore from '@/store/semesterStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, ArrowRight, GraduationCap, CheckCircle2, Clock, FileText, FlaskConical, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function MyCourses() {
    const { user } = useAuthStore();
    const {
        workingSemesterId,
        selectedProgramId,
        selectedSemesterNum,
        activeCourseId,
        setActiveCourseId
    } = useSemesterStore();
    const { courseId: routeCourseId } = useParams(); // For when navigation happens via URL
    const [courseDetails, setCourseDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (routeCourseId && routeCourseId !== activeCourseId) {
            setActiveCourseId(routeCourseId);
        }
    }, [routeCourseId]);

    useEffect(() => {
        if (activeCourseId) {
            fetchCourseDetails();
        }
    }, [activeCourseId]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:5000/api/courses/${activeCourseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourseDetails(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Phase 1: No Semester Selected
    if (!selectedProgramId || !selectedSemesterNum) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="bg-blue-50 p-8 rounded-[3rem] shadow-inner-sm">
                    <Calendar className="h-20 w-20 text-blue-500 opacity-80" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Initialize Your Workflow</h2>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                        Please select a <span className="text-blue-600 font-bold">Program Semester</span> from the sidebar to begin managing your assigned curriculum.
                    </p>
                </div>
            </div>
        );
    }

    // Phase 2: Semester Selected but No Course Selected
    if (!activeCourseId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in slide-in-from-bottom-6 duration-700">
                <div className="bg-emerald-50 p-8 rounded-[3rem] shadow-inner-sm">
                    <BookOpen className="h-20 w-20 text-emerald-500 opacity-80" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Academic Path Selected</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                        Semester navigation is active. Now, <span className="text-emerald-600 font-bold">choose a course</span> from your assignment list to manage its OBE framework.
                    </p>
                </div>
            </div>
        );
    }

    // Phase 3: Course Details
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {loading ? (
                <div className="space-y-6">
                    <Skeleton className="h-20 w-2/3 rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}
                    </div>
                </div>
            ) : courseDetails ? (
                <>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Badge className="rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 shadow-lg shadow-blue-500/20">
                                {courseDetails.code}
                            </Badge>
                            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Active Specialization</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight mt-2">
                            {courseDetails.title}
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-2xl mt-2 leading-relaxed">
                            {courseDetails.description || "In-depth exploration of core principles, methodologies, and practical applications within the specified academic domain."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <div className="p-4 bg-orange-50 rounded-2xl w-fit mb-4">
                                    <Clock className="text-orange-600" size={24} />
                                </div>
                                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Hours</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-4xl font-black text-slate-800 tracking-tighter">
                                    {courseDetails.credit_hours} <span className="text-xl text-slate-400">CH</span>
                                </p>
                                <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-tight">Theoretical Credits per Week</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <div className="p-4 bg-purple-50 rounded-2xl w-fit mb-4">
                                    <FlaskConical className="text-purple-600" size={24} />
                                </div>
                                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Laborary Component</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-4xl font-black text-slate-800 tracking-tighter">
                                    {courseDetails.lab_hours || 0} <span className="text-xl text-slate-400">LH</span>
                                </p>
                                <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-tight">Practical & Experimental Hours</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-xl rounded-[2.5rem] bg-blue-600 text-white group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Target size={120} />
                            </div>
                            <CardHeader className="p-8 pb-4">
                                <div className="p-4 bg-white/10 rounded-2xl w-fit mb-4">
                                    <CheckCircle2 size={24} />
                                </div>
                                <CardTitle className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em]">OBE Status</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-4xl font-black tracking-tighter">OPTIMIZED</p>
                                <p className="text-xs text-blue-100/70 font-bold mt-2 uppercase tracking-tight">CLO-PLO Framework Verified</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="p-10 bg-slate-100/50 rounded-[3.5rem] border border-slate-200 border-dashed flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Ready to synchronize progress?</h3>
                            <p className="text-sm text-slate-500 font-medium max-w-sm">Use the sidebar tools to manage CLOs, define assessments, and track student attainment for this course.</p>
                        </div>
                        <div className="flex gap-4">
                            <Button className="h-14 px-8 rounded-2xl bg-slate-900 border-0 shadow-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all">
                                Define Assessments
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-20 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Metadata Loading Error</p>
                </div>
            )}
        </div>
    );
}

