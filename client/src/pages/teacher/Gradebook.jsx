import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Users, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import useLoaderStore from '@/store/loaderStore';
import { Skeleton } from '@/components/ui/skeleton';

export default function Gradebook() {
    const { courseId } = useParams();
    const { showLoader, hideLoader } = useLoaderStore();

    // Data State
    const [students, setStudents] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [marks, setMarks] = useState({}); // Map: "studentId_questionId" -> value
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    useEffect(() => {
        if (selectedAssessmentId) {
            fetchQuestionsAndMarks(selectedAssessmentId);
        }
    }, [selectedAssessmentId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, aRes] = await Promise.all([
                fetch(`http://localhost:5000/api/students/${courseId}`),
                fetch(`http://localhost:5000/api/assessments/${courseId}`)
            ]);

            if (sRes.ok) setStudents(await sRes.json());
            if (aRes.ok) {
                const aData = await aRes.json();
                setAssessments(aData);
                if (aData.length > 0) setSelectedAssessmentId(aData[0].id);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestionsAndMarks = async (assessmentId) => {
        showLoader();
        try {
            const res = await fetch(`http://localhost:5000/api/assessments/${assessmentId}/questions`);
            if (res.ok) {
                const qData = await res.json();
                setQuestions(qData);
                // Ideally fetch existings marks here too and populate `marks` state
                // For now, let's just allow entry.
            }
        } catch (error) {
            console.error(error);
        } finally {
            hideLoader();
        }
    };

    const handleSeedStudents = async () => {
        showLoader();
        try {
            const res = await fetch(`http://localhost:5000/api/students/${courseId}/seed`, { method: 'POST' });
            if (res.ok) {
                toast.success("Students Seeded Successfully!");
                fetchData();
            } else {
                toast.error("Failed to seed");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            hideLoader();
        }
    };

    const handleMarkChange = (studentId, questionId, value) => {
        // Enforce max marks logic here if needed?
        setMarks(prev => ({
            ...prev,
            [`${studentId}_${questionId}`]: value
        }));
    };

    const handleSaveMarks = async () => {
        const updates = [];
        Object.keys(marks).forEach(key => {
            const [studentId, questionId] = key.split('_');
            const val = parseFloat(marks[key]);
            if (!isNaN(val)) {
                updates.push({ student_id: studentId, question_id: questionId, obtained_marks: val });
            }
        });

        if (updates.length === 0) return toast.info("No marks to save");

        showLoader();
        try {
            const res = await fetch('http://localhost:5000/api/assessments/marks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            if (res.ok) {
                toast.success("Marks Saved");
            } else {
                toast.error("Failed to save marks");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gradebook</h2>
                    <p className="text-muted-foreground">Enter marks and track student performance.</p>
                </div>
                <div className="flex gap-2">
                    {students.length === 0 && (
                        <Button variant="outline" className="gap-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={handleSeedStudents}>
                            <Users size={16} /> Seed Dummy Students
                        </Button>
                    )}
                    <Button onClick={handleSaveMarks} disabled={students.length === 0 || assessments.length === 0} className="gap-2">
                        <Save size={16} /> Save Changes
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 border border-dashed rounded-lg text-center">
                    <Users className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Students Enrolled</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                        This course has no students yet. Seed dummy data to test the Gradebook.
                    </p>
                    <Button onClick={handleSeedStudents}>Seed Students</Button>
                </div>
            ) : assessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 border border-dashed rounded-lg text-center">
                    <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Assessments Found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Create an assessment first to start grading.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium">Select Assessment:</label>
                        <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {assessments.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.title} ({a.type})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border rounded-md bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-100">
                                    <TableHead className="w-[200px]">Student Name</TableHead>
                                    <TableHead className="w-[150px]">Reg No</TableHead>
                                    {questions.map(q => (
                                        <TableHead key={q.id} className="text-center w-[100px]">
                                            <div className="flex flex-col">
                                                <span>{q.question_number}</span>
                                                <span className="text-[10px] font-normal text-muted-foreground">({q.max_marks} marks)</span>
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{student.reg_no}</TableCell>
                                        {questions.map(q => (
                                            <TableCell key={q.id} className="p-2">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-center"
                                                    placeholder="-"
                                                    min={0}
                                                    max={q.max_marks}
                                                    value={marks[`${student.id}_${q.id}`] || ''}
                                                    onChange={e => handleMarkChange(student.id, q.id, e.target.value)}
                                                />
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right font-bold w-[100px]">
                                            {questions.reduce((sum, q) => {
                                                const val = parseFloat(marks[`${student.id}_${q.id}`] || 0);
                                                return sum + val;
                                            }, 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
