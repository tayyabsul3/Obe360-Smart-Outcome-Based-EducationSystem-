import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';

export default function Assignments() {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');

    // Schedule/Assignment State
    const [schedule, setSchedule] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (selectedClassId) loadSchedule();
    }, [selectedClassId]);

    const fetchClasses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/classes');
            const data = await res.json();
            setClasses(data);
        } catch (err) { console.error(err) }
    }

    const fetchTeachers = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
        if (data) setTeachers(data);
    }

    const loadSchedule = async () => {
        setLoading(true);
        try {
            const cls = classes.find(c => c.id === selectedClassId);
            if (!cls) return;

            const resCourses = await fetch(`http://localhost:5000/api/courses/program/${cls.program_id}`);
            const allProgramCourses = await resCourses.json();
            const semesterCourses = allProgramCourses.filter(c => c.semester === cls.semester);

            const resAssign = await fetch(`http://localhost:5000/api/assignments/class/${selectedClassId}`);
            const existingAssignments = await resAssign.json();

            const merged = semesterCourses.map(pc => {
                const assignment = existingAssignments.find(a => a.course_id === pc.course_id);
                return {
                    course: pc.course, // The joined course object
                    assignment
                };
            });
            setSchedule(merged);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handleAssign = async (courseId, teacherId) => {
        if (!teacherId || !selectedClassId) return;
        try {
            const res = await fetch('http://localhost:5000/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class_id: selectedClassId,
                    course_id: courseId,
                    teacher_id: teacherId
                }),
            });
            if (res.ok) {
                loadSchedule(); // Refresh
            }
        } catch (err) { console.error(err); }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Teacher Assignments</h1>
                <div className="w-1/3">
                    <Label>Select Class</Label>
                    <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Course List</CardTitle>
                </CardHeader>
                <CardContent>
                    {!selectedClassId ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Please select a class to view assignments.
                        </div>
                    ) : loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course Code</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Assigned Teacher</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedule.map((item) => (
                                    <TableRow key={item.course.id}>
                                        <TableCell className="font-medium">{item.course.code}</TableCell>
                                        <TableCell>{item.course.title}</TableCell>
                                        <TableCell>
                                            {item.assignment ? (
                                                <span className="text-green-600 font-medium">
                                                    {item.assignment.teacher?.full_name || item.assignment.teacher?.email}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={item.assignment?.teacher_id || ""}
                                                onValueChange={(val) => handleAssign(item.course.id, val)}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <SelectValue placeholder="Assign Teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {schedule.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No courses found in study plan for this semester.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
