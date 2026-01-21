import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, ArrowRight, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function MyCourses() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchAssignments();
    }, [user]);

    const fetchAssignments = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/assignments/teacher/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Courses</h1>
                    <p className="text-slate-500">Manage your assigned classes and assessments.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/teacher/analytics')}>View Analytics</Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                </div>
            ) : assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((item) => (
                        <Card
                            key={item.id}
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 hover:border-blue-300 relative overflow-hidden"
                            onClick={() => navigate(`/teacher/course/${item.course_id}`)}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="mb-2 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                        {item.course?.code}
                                    </Badge>
                                    <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <CardTitle className="text-xl group-hover:text-blue-700 transition-colors line-clamp-1">{item.course?.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{item.course?.description || 'No description available'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>Fall 2024</span> {/* Placeholder for Session */}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <GraduationCap size={14} />
                                        <span>BSSE-5A</span> {/* Placeholder for Class Name */}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No Courses Assigned</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        You have not been assigned any courses yet. Please contact the administrator.
                    </p>
                </div>
            )}
        </div>
    );
}
