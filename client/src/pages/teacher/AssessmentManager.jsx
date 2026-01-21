import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, FileText, ExternalLink, Calculator, ArrowRight, Save } from 'lucide-react';
import { toast } from 'sonner';
import useLoaderStore from '@/store/loaderStore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';

export default function AssessmentManager() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoaderStore();

    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Wizard State
    const [createOpen, setCreateOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Details, 2: Questions

    // Step 1: Details
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        type: 'Quiz',
        drive_link: ''
    });

    // Step 2: Questions
    const [questions, setQuestions] = useState([
        { id: 1, question_number: 'Q1', max_marks: 5, clo_id: 'none' }
    ]);

    useEffect(() => {
        if (courseId) {
            fetchAssessments();
        }
    }, [courseId]);

    const fetchAssessments = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/assessments/${courseId}`);
            if (res.ok) setAssessments(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // const fetchCLOs = async () => { // Removed
    //     try {
    //         const res = await fetch(`http://localhost:5000/api/clos/${courseId}`);
    //         if (res.ok) setClos(await res.json());
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };

    // --- Wizard Logic --- (Removed question related functions)

    // const addQuestionRow = () => {
    //     setQuestions([
    //         ...questions,
    //         { id: Date.now(), question_number: `Q${questions.length + 1}`, max_marks: 5, clo_id: 'none' }
    //     ]);
    // };

    // const removeQuestionRow = (id) => {
    //     if (questions.length === 1) return;
    //     setQuestions(questions.filter(q => q.id !== id));
    // };

    // const updateQuestion = (id, field, value) => {
    //     setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    // };

    // File Upload State
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleCreate = async () => {
        if (!newAssessment.title) return toast.warning("Title is required");

        setUploading(true);
        showLoader();
        try {
            let fileUrl = null;

            // 1. Upload File if selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${courseId}/${Date.now()}.${fileExt}`;
                const { data, error } = await supabase.storage
                    .from('assessments')
                    .upload(fileName, file);

                if (error) throw error;

                // Get Public URL
                const { data: urlData } = supabase.storage
                    .from('assessments')
                    .getPublicUrl(fileName);

                fileUrl = urlData.publicUrl;
            }

            // 2. Create Assessment
            const res = await fetch('http://localhost:5000/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: courseId,
                    title: newAssessment.title,
                    type: newAssessment.type,
                    description: newAssessment.description, // Sending description
                    drive_link: fileUrl // Store the file URL or the manual link
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error("Server Error:", errData);
                throw new Error(errData.error || "Failed to create assessment");
            }
            // const assessmentData = await res.json(); // Not needed if questions are removed

            // 3. Create Questions (Removed)
            // const finalQuestions = questions.map(q => ({
            //     question_number: q.question_number,
            //     max_marks: q.max_marks,
            //     clo_id: q.clo_id === 'none' ? null : q.clo_id
            // }));

            // await fetch(`http://localhost:5000/api/assessments/${assessmentData.id}/questions`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ questions: finalQuestions })
            // });

            toast.success("Assessment Created");
            setCreateOpen(false);
            fetchAssessments();
            // Reset state
            // setStep(1); // Removed
            setNewAssessment({ title: '', type: 'Assignment', description: '', deadline: '' });
            setFile(null);
            // setQuestions([{ id: 1, question_number: 'Q1', max_marks: 5, clo_id: 'none' }]); // Removed

        } catch (error) {
            console.error(error);
            toast.error("Creation Failed", { description: error.message });
        } finally {
            setUploading(false);
            hideLoader();
        }
    };

    const handleDelete = async (assessmentId) => {
        if (!window.confirm("Are you sure you want to delete this assessment?")) return;
        showLoader();
        try {
            const res = await fetch(`http://localhost:5000/api/assessments/${assessmentId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to delete assessment");
            }
            toast.success("Assessment deleted successfully.");
            fetchAssessments();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete assessment", { description: error.message });
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
                    <p className="text-slate-500">Create and manage assignments and quizzes.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Plus size={16} /> Create Assessment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create Assessment</DialogTitle>
                            <DialogDescription>Add a new assignment or quiz for this course.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={newAssessment.title}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                        placeholder="e.g. Midterm Exam"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={newAssessment.type}
                                        onValueChange={(val) => setNewAssessment({ ...newAssessment, type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Quiz">Quiz</SelectItem>
                                            <SelectItem value="Assignment">Assignment</SelectItem>
                                            <SelectItem value="Exam">Exam</SelectItem>
                                            <SelectItem value="Project">Project</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={newAssessment.description}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                    placeholder="Instructions for students..."
                                    className="resize-none h-24"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Attach File (Question Paper)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="cursor-pointer"
                                    />
                                </div>
                                {file && (
                                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit flex items-center gap-2">
                                        <FileText size={12} />
                                        {file.name} ({(file.size / 1024).toFixed(0)} KB)
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Create Assessment'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Assessment List */}
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {assessments.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-800">{item.title}</h3>
                                    <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                                </div>
                                {item.description && (
                                    <p className="text-sm text-slate-600 line-clamp-1">{item.description}</p>
                                )}
                                <div className="flex gap-4 text-xs text-slate-400">
                                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                                    {item.drive_link && (
                                        <a
                                            href={item.drive_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:underline z-10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <FileText size={12} /> View File
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {assessments.length === 0 && (
                        <div className="text-center py-10 text-slate-500 border border-dashed rounded-lg">
                            No assessments created yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
