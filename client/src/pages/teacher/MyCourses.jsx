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
            const res = await fetch(`/api/courses/${activeCourseId}`);
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
                    <h2 className="text-2xl font-bold text-slate-800">Initialize Your Workflow</h2>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                        Please select a <span className="text-blue-600 font-semibold">Program Semester</span> from the sidebar to begin managing your assigned curriculum.
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
                    <h2 className="text-2xl font-bold text-slate-800">Academic Path Selected</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed text-sm">
                        Semester navigation is active. Now, <span className="text-emerald-600 font-semibold">choose a course</span> from your assignment list to manage its OBE framework.
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
                            <Badge className="rounded-full bg-blue-600 text-[10px] font-semibold uppercase px-4 py-1.5 shadow-lg shadow-blue-500/20">
                                {courseDetails.code}
                            </Badge>
                            <span className="text-xs font-semibold text-slate-400 uppercase">Active Specialization</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mt-2">
                            {courseDetails.title}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium max-w-2xl mt-2 leading-relaxed">
                            {courseDetails.description || "In-depth exploration of core principles, methodologies, and practical applications within the specified academic domain."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-0 shadow-md rounded-[2.5rem] bg-white group hover:-translate-y-1 transition-all duration-300">
                            <CardHeader className="p-8 pb-4">
                                <div className="p-4 bg-orange-50 rounded-2xl w-fit mb-4">
                                    <Clock className="text-orange-600" size={24} />
                                </div>
                                <CardTitle className="text-[10px] font-semibold text-slate-400 uppercase">Contact Hours</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-3xl font-bold text-slate-800">
                                    {courseDetails.credit_hours} <span className="text-xl text-slate-400">CH</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-2">Theoretical Credits per Week</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md rounded-[2.5rem] bg-white group hover:-translate-y-1 transition-all duration-300">
                            <CardHeader className="p-8 pb-4">
                                <div className="p-4 bg-purple-50 rounded-2xl w-fit mb-4">
                                    <FlaskConical className="text-purple-600" size={24} />
                                </div>
                                <CardTitle className="text-[10px] font-semibold text-slate-400 uppercase">Laboratory Component</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-3xl font-bold text-slate-800">
                                    {courseDetails.lab_hours || 0} <span className="text-xl text-slate-400">LH</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-2">Practical & Experimental Hours</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md rounded-[2.5rem] bg-blue-600 text-white group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Target size={120} />
                            </div>
                            <CardHeader className="p-8 pb-4">
                                <div className="p-4 bg-white/10 rounded-2xl w-fit mb-4">
                                    <CheckCircle2 size={24} />
                                </div>
                                <CardTitle className="text-[10px] font-semibold text-blue-100 uppercase">OBE Status</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-3xl font-bold">OPTIMIZED</p>
                                <p className="text-xs text-blue-100/70 mt-2">CLO-PLO Framework Verified</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="p-8 bg-slate-100/50 rounded-[3rem] border border-slate-200 border-dashed flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold text-slate-800">Ready to synchronize progress?</h3>
                            <p className="text-xs text-slate-500 font-medium max-w-sm">Use the sidebar tools to manage CLOs, define assessments, and track student attainment for this course.</p>
                        </div>
                        <div className="flex gap-4">
                            <Button 
                                onClick={() => navigate(`/teacher/course/${activeCourseId}/assessments`)}
                                className="h-11 px-6 rounded-xl bg-slate-950 text-white hover:bg-blue-600 transition-all font-semibold text-xs shadow-md shadow-slate-950/10"
                            >
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

