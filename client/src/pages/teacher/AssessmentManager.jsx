import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, List, FileSpreadsheet, Download, FileText, Settings2, Info, ChevronDown, Calculator, Search, CheckSquare, Loader2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import useLoaderStore from '@/store/loaderStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

export default function AssessmentManager() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoaderStore();

    const [assessments, setAssessments] = useState([]);
    const [clos, setClos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [createOpen, setCreateOpen] = useState(false);
    const [outcomesOpen, setOutcomesOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [activeAssessment, setActiveAssessment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [advancedImportFile, setAdvancedImportFile] = useState(null);
    const [advancedUploading, setAdvancedUploading] = useState(false);

    // Students State for Outcomes Grid
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [outcomesData, setOutcomesData] = useState({}); // { studentId_questionId: obtained_marks }
    const [absentData, setAbsentData] = useState({}); // { studentId_questionId: boolean }
    const [savingOutcomes, setSavingOutcomes] = useState(false);

    const [importFile, setImportFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Assignment',
        description: '',
        date: '',
        total_marks: 0,
        gpa_weight: 0,
        is_complex_engineering_problem: false,
        include_in_gpa: true,
        show_result: false,
        allow_student_upload: false,
        subActivities: []
    });

    const [importAssessmentsOpen, setImportAssessmentsOpen] = useState(false);
    const [importAssessmentsFile, setImportAssessmentsFile] = useState(null);
    const [importingAssessments, setImportingAssessments] = useState(false);

    useEffect(() => {
        if (courseId) {
            fetchAssessments();
            fetchCLOs();
        }
    }, [courseId]);

    const fetchCLOs = async () => {
        try {
            const res = await fetch(`/api/clos/${courseId}`);
            if (res.ok) setClos(await res.json());
        } catch (error) {
            console.error("Failed to fetch CLOs", error);
        }
    };

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/assessments/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setAssessments(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load assessments");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    const handleExportOutcomes = async () => {
        showLoader();
        try {
            const res = await fetch(`/api/assessments/course/${courseId}/export-all`);
            if (!res.ok) throw new Error("Failed to fetch export data");

            const { assessments: exportAssessments, marks, enrollments } = await res.json();

            // Re-use logic from handleDownloadAdvancedTemplate but pre-fill data
            const headerRow1 = ["", ""];
            const headerRow2 = ["Registration No.", "Name"];
            const merges = [];
            let currentCol = 2;

            const assessmentColMap = {}; // assessmentId_questionId -> colIndex

            exportAssessments.forEach(a => {
                const qs = a.assessment_questions || [];
                if (qs.length === 0) return;

                if (qs.length > 1) {
                    merges.push({
                        s: { r: 0, c: currentCol },
                        e: { r: 0, c: currentCol + qs.length - 1 }
                    });
                }

                headerRow1[currentCol] = a.title;
                for (let i = 1; i < qs.length; i++) headerRow1[currentCol + i] = a.title;

                qs.sort((x, y) => x.question_number.localeCompare(y.question_number)).forEach(q => {
                    const clo = clos.find(c => c.id === q.clo_id);
                    headerRow2[currentCol] = `${q.question_number} (${q.max_marks})\n${clo ? clo.code : 'N/A'}`;
                    assessmentColMap[`${a.id}_${q.id}`] = currentCol;
                    currentCol++;
                });
            });

            const dataRows = enrollments.map(e => {
                const s = e.students;
                const row = [s.reg_no, s.name];
                for (let i = 2; i < currentCol; i++) row.push("");

                // Fill marks
                exportAssessments.forEach(a => {
                    a.assessment_questions?.forEach(q => {
                        const mark = marks.find(m => m.student_id === s.id && m.question_id === q.id);
                        const colIdx = assessmentColMap[`${a.id}_${q.id}`];
                        if (mark) {
                            row[colIdx] = mark.is_absent ? "A" : mark.obtained_marks;
                        }
                    });
                });

                return row;
            });

            const aoa = [headerRow1, headerRow2, ...dataRows];
            const worksheet = XLSX.utils.aoa_to_sheet(aoa);
            worksheet['!merges'] = merges;
            worksheet['!cols'] = [{ wch: 20 }, { wch: 30 }, ...Array(currentCol - 2).fill({ wch: 15 })];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Outcomes");
            XLSX.writeFile(workbook, `Course_Outcomes_Export.xlsx`);
            toast.success("Outcomes exported successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to export outcomes");
        } finally {
            hideLoader();
        }
    };

    const handleImportAssessments = async () => {
        if (!importAssessmentsFile) return toast.error("Please select a file first");
        setImportingAssessments(true);
        try {
            const formDataFile = new FormData();
            formDataFile.append('file', importAssessmentsFile);

            const res = await fetch(`/api/assessments/course/${courseId}/import-definitions`, {
                method: 'POST',
                body: formDataFile
            });

            if (res.ok) {
                toast.success("Assessments imported successfully");
                fetchAssessments();
                setImportAssessmentsOpen(false);
                setImportAssessmentsFile(null);
            } else {
                toast.error("Failed to import assessments");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setImportingAssessments(false);
        }
    };

    const handleDownloadImportTemplate = () => {
        const data = [
            { "Assessment": "Quiz 1", "Type": "Quiz", "Date": "2024-03-01", "Question": "Q1", "Max Marks": 10, "CLO": "CLO-1" },
            { "Assessment": "Quiz 1", "Type": "Quiz", "Date": "2024-03-01", "Question": "Q2", "Max Marks": 10, "CLO": "CLO-2" },
            { "Assessment": "Assignment 1", "Type": "Assignment", "Date": "2024-03-05", "Question": "Q1", "Max Marks": 20, "CLO": "CLO-1" }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Import_Assessments_Template.xlsx");
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this Class Activity?")) return;
        showLoader();
        try {
            const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Activity Deleted");
                fetchAssessments();
            } else {
                toast.error("Failed to delete activity");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            hideLoader();
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("Are you sure you want to DELETE ALL class activities for this course? This action cannot be undone.")) return;
        showLoader();
        try {
            const res = await fetch(`/api/assessments/course/${courseId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("All Activities Deleted");
                fetchAssessments();
            } else {
                toast.error("Failed to delete all activities");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            hideLoader();
        }
    };

    // Create Modal logic
    const handleOpenCreate = () => {
        setIsEditing(false);
        setActiveAssessment(null);
        setFormData({
            title: '',
            type: 'Assignment',
            description: '',
            date: '',
            total_marks: 0,
            gpa_weight: 0,
            is_complex_engineering_problem: false,
            include_in_gpa: true,
            show_result: false,
            allow_student_upload: false,
            subActivities: [{
                id: Date.now(),
                question_number: 'Q1',
                max_marks: 0,
                clo_id: '',
                obe_weight: 0,
                complexity: '',
                not_for_obe: false,
                question_guideline: '',
                answer_guideline: ''
            }]
        });
        setCreateOpen(true);
    };

    const handleAddSubActivity = () => {
        setFormData(prev => ({
            ...prev,
            subActivities: [
                ...prev.subActivities,
                {
                    id: Date.now().toString(),
                    question_number: `Q${prev.subActivities.length + 1}`,
                    max_marks: 0,
                    obe_weight: 0,
                    complexity: '',
                    not_for_obe: false,
                    clo_id: 'none',
                    question_guideline: '',
                    answer_guideline: ''
                }
            ]
        }));
    };

    const handleRemoveSubActivity = (id) => {
        setFormData(prev => ({
            ...prev,
            subActivities: prev.subActivities.filter(sa => sa.id !== id)
        }));
    };

    const handleSubActivityChange = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            subActivities: prev.subActivities.map(sa => sa.id === id ? { ...sa, [field]: value } : sa)
        }));
    };

    const handleCreateSubmit = async () => {
        if (!formData.title || !formData.date) {
            return toast.warning("Title and Date are required");
        }

        showLoader();
        try {
            const url = isEditing
                ? `/api/assessments/${activeAssessment.id}`
                : '/api/assessments';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: courseId,
                    ...formData,
                    subActivities: formData.subActivities.map(sa => ({
                        ...sa,
                        clo_id: sa.clo_id === 'none' ? null : sa.clo_id
                    }))
                })
            });

            if (res.ok) {
                toast.success(isEditing ? "Class Activity Updated" : "Class Activity Created");
                setCreateOpen(false);
                fetchAssessments();
                // Reset form
                setFormData({
                    title: '',
                    type: 'Assignment',
                    description: '',
                    date: '',
                    total_marks: 0,
                    gpa_weight: 0,
                    is_complex_engineering_problem: false,
                    include_in_gpa: true,
                    show_result: false,
                    allow_student_upload: false,
                    subActivities: []
                });
                setIsEditing(false);
                setActiveAssessment(null);
            } else {
                const err = await res.json();
                toast.error("Operation failed", { description: err.error });
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            hideLoader();
        }
    };

    const fetchEnrolledStudents = async () => {
        try {
            const res = await fetch(`/api/students/${courseId}`);
            if (res.ok) setEnrolledStudents(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMarks = async (assessmentId) => {
        try {
            const res = await fetch(`/api/assessments/${assessmentId}/marks`);
            if (res.ok) {
                const marks = await res.json();
                const newOutcomes = {};
                const newAbsent = {};
                marks.forEach(m => {
                    const key = `${m.student_id}_${m.question_id}`;
                    newOutcomes[key] = m.obtained_marks;
                    newAbsent[key] = m.is_absent;
                });
                setOutcomesData(newOutcomes);
                setAbsentData(newAbsent);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Placeholder actions
    const handleAction = async (action, assessment) => {
        setActiveAssessment(assessment);
        switch (action) {
            case 'update':
                setIsEditing(true);
                setFormData({
                    title: assessment.title,
                    type: assessment.type,
                    description: assessment.description || '',
                    date: assessment.date ? assessment.date.split('T')[0] : '',
                    total_marks: assessment.total_marks,
                    gpa_weight: assessment.gpa_weight,
                    is_complex_engineering_problem: assessment.is_complex_engineering_problem,
                    include_in_gpa: assessment.include_in_gpa,
                    show_result: assessment.show_result,
                    allow_student_upload: assessment.allow_student_upload,
                    subActivities: assessment.assessment_questions?.map(q => ({
                        id: q.id,
                        question_number: q.question_number,
                        max_marks: q.max_marks,
                        clo_id: q.clo_id || 'none',
                        obe_weight: q.obe_weight,
                        complexity: q.complexity,
                        not_for_obe: q.not_for_obe,
                        question_guideline: q.question_guideline,
                        answer_guideline: q.answer_guideline
                    })) || []
                });
                setCreateOpen(true);
                break;
            case 'add_outcome':
                setOutcomesOpen(true);
                showLoader();
                await fetchEnrolledStudents();
                await fetchMarks(assessment.id);
                hideLoader();
                break;
            case 'download_template':
                handleDownloadTemplate(assessment);
                break;
            case 'import_outcome':
                setImportFile(null);
                setImportOpen(true);
                showLoader();
                await fetchEnrolledStudents(); // Ensure we have students loaded 
                hideLoader();
                break;
            default:
                break;
        }
    };

    const handleDownloadTemplate = async (assessment) => {
        showLoader();
        try {
            // Need students to pre-fill the template
            let students = enrolledStudents;
            if (students.length === 0) {
                const res = await fetch(`/api/students/${courseId}`);
                if (res.ok) students = await res.json();
            }

            if (students.length === 0) {
                toast.warning("No students enrolled. Cannot generate template without students.");
                hideLoader();
                return;
            }

            const data = students.map((s, index) => {
                const row = {
                    'Sr.No.': index + 1,
                    'Registration No.': s.reg_no,
                    'Name': s.name,
                };

                // Add columns for each question
                assessment.assessment_questions?.sort((a, b) => a.question_number.localeCompare(b.question_number)).forEach(q => {
                    row[`${q.question_number} (${q.max_marks})`] = ''; // Empty string for marks
                });

                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

            // Auto-size columns loosely
            const wscols = [
                { wch: 8 }, // Sr.No.
                { wch: 20 }, // Reg. No.
                { wch: 30 }, // Name
                ...assessment.assessment_questions?.map(() => ({ wch: 15 })) || []
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `${assessment.title.replace(/[^a-z0-9]/gi, '_')}_Template.xlsx`);
            toast.success("Template downloaded successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate template");
        } finally {
            hideLoader();
        }
    };

    const handleDownloadAdvancedTemplate = async () => {
        showLoader();
        try {
            let students = enrolledStudents;
            if (students.length === 0) {
                const res = await fetch(`/api/students/${courseId}`);
                if (res.ok) students = await res.json();
            }

            if (students.length === 0) {
                toast.warning("No students enrolled. Cannot generate template.");
                hideLoader();
                return;
            }

            // 1. Build Headers (Row 3 and Row 4 as per image, but let's use Row 1 and Row 2 for simplicity in aoa)
            const headerRow1 = ["", ""]; // Assessment Names
            const headerRow2 = ["Registration No.", "Name"]; // Q details
            const merges = [];
            let currentCol = 2;

            assessments.forEach(a => {
                const qs = a.assessment_questions || [];
                if (qs.length === 0) return;

                // Merge Title over questions
                if (qs.length > 1) {
                    merges.push({
                        s: { r: 0, c: currentCol },
                        e: { r: 0, c: currentCol + qs.length - 1 }
                    });
                }

                headerRow1[currentCol] = a.title;
                // Fill Row 1 with same title for internal mapping if needed, or leave empty for merges
                for (let i = 1; i < qs.length; i++) headerRow1[currentCol + i] = a.title;

                qs.sort((x, y) => x.question_number.localeCompare(y.question_number)).forEach(q => {
                    const clo = clos.find(c => c.id === q.clo_id);
                    const cloLabel = clo ? `${clo.code}` : 'N/A';
                    headerRow2[currentCol] = `${q.question_number} (${q.max_marks})\n${cloLabel}`;
                    currentCol++;
                });
            });

            // 2. Build Student Rows
            const dataRows = students.map((s, idx) => {
                const row = [s.reg_no, s.name];
                // Empty marks cells
                for (let i = 2; i < currentCol; i++) row.push("");
                return row;
            });

            // 3. Create Worksheet
            const aoa = [headerRow1, headerRow2, ...dataRows];
            const worksheet = XLSX.utils.aoa_to_sheet(aoa);

            // 4. Add Merges
            worksheet['!merges'] = merges;

            // 5. Column Widths
            const wscols = [
                { wch: 20 }, // Reg No
                { wch: 30 }, // Name
                ...Array(currentCol - 2).fill({ wch: 15 })
            ];
            worksheet['!cols'] = wscols;

            // 6. Workbook & Save
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "AdvanceTemplate");

            XLSX.writeFile(workbook, `Course_Advanced_Outcomes_Template.xlsx`);
            toast.success("Advanced template downloaded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate advanced template");
        } finally {
            hideLoader();
        }
    };

    const handleFileUpload = async () => {
        if (!importFile || !activeAssessment) {
            return toast.warning("Please select a file first");
        }

        const formData = new FormData();
        formData.append('file', importFile);

        setUploading(true);
        try {
            const res = await fetch(`/api/assessments/${activeAssessment.id}/import`, {
                method: 'POST',
                body: formData // No Content-Type header needed for FormData handled by fetch
            });

            const result = await res.json();

            if (res.ok) {
                toast.success(result.message);
                if (result.errors && result.errors.length > 0) {
                    console.warn("Import warning issues:", result.errors);
                    toast.warning(`Imported with some errors on rows. Check console.`);
                }
                setImportOpen(false);
                fetchAssessments();
            } else {
                toast.error(result.error || "Failed to import file");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error during import");
        } finally {
            setUploading(false);
            setImportFile(null);
        }
    };

    const handleAdvancedFileUpload = async () => {
        if (!advancedImportFile) {
            return toast.warning("Please select a file first");
        }

        const formData = new FormData();
        formData.append('file', advancedImportFile);

        setAdvancedUploading(true);
        showLoader();
        try {
            const res = await fetch(`/api/assessments/course/${courseId}/import-advanced`, {
                method: 'POST',
                body: formData
            });

            const result = await res.json();

            if (res.ok) {
                toast.success("Advanced Import successful", { description: result.message });
                setImportOpen(false);
                fetchAssessments();
            } else {
                toast.error(result.error || "Advanced import failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error during advanced import");
        } finally {
            setAdvancedUploading(false);
            setAdvancedImportFile(null);
            hideLoader();
        }
    };

    const handleOutcomeChange = (studentId, questionId, val, maxMarks) => {
        let numericVal = parseFloat(val);
        if (isNaN(numericVal)) numericVal = 0;
        if (numericVal > maxMarks) numericVal = maxMarks;
        if (numericVal < 0) numericVal = 0;

        setOutcomesData(prev => ({
            ...prev,
            [`${studentId}_${questionId}`]: numericVal
        }));
    };

    const handleAbsentChange = (studentId, questionId, checked) => {
        setAbsentData(prev => ({
            ...prev,
            [`${studentId}_${questionId}`]: checked
        }));
        if (checked) {
            setOutcomesData(prev => ({
                ...prev,
                [`${studentId}_${questionId}`]: 0
            }));
        }
    };

    const handleSaveOutcomes = async () => {
        if (!activeAssessment) return;
        setSavingOutcomes(true);

        const updates = [];
        enrolledStudents.forEach(student => {
            activeAssessment.assessment_questions?.forEach(q => {
                const key = `${student.id}_${q.id}`;
                if (outcomesData[key] !== undefined || absentData[key] !== undefined) {
                    updates.push({
                        assessment_id: activeAssessment.id,
                        student_id: student.id,
                        question_id: q.id,
                        obtained_marks: outcomesData[key] || 0,
                        is_absent: absentData[key] || false
                    });
                }
            });
        });

        if (updates.length === 0) {
            setSavingOutcomes(false);
            setOutcomesOpen(false);
            return toast.info("No changes to save.");
        }

        try {
            const res = await fetch(`/api/assessments/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            if (res.ok) {
                toast.success("Marks saved successfully");
                setOutcomesOpen(false);
            } else {
                toast.error("Failed to save marks");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setSavingOutcomes(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#337AB7] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Class Activities</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Course Assessments & Marks</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={handleOpenCreate} className="bg-[#107C41] hover:bg-[#0c5c30] text-white">Add Class Activity</Button>
            </div>

            {/* List Section */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white mt-4">
                <CardHeader className="bg-slate-50/50 border-b py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <List size={16} /> Activities List
                    </CardTitle>
                    <span className="text-xs font-bold text-slate-500">Total {assessments.length} results.</span>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    ) : assessments.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[60px] font-bold text-slate-700 pl-4 text-center">Sr.No.</TableHead>
                                    <TableHead className="w-[40px] text-center"><Checkbox className="rounded" /></TableHead>
                                    <TableHead className="font-bold text-slate-700">Assessment Method</TableHead>
                                    <TableHead className="font-bold text-slate-700">Date</TableHead>
                                    <TableHead className="font-bold text-slate-700">Name</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-center">Total Marks</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-center">GPA %</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 pr-4">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assessments.map((a, index) => {
                                    const totalMarks = a.assessment_questions?.reduce((sum, q) => sum + (q.max_marks || 0), 0) || 0;
                                    const calculatedGpaWeight = a.assessment_questions?.reduce((sum, q) => sum + (parseFloat(q.obe_weight) || 0), 0) || a.gpa_weight || 0;

                                    return (
                                        <TableRow key={a.id} className="hover:bg-slate-50/30">
                                            <TableCell className="text-center text-slate-500 font-medium pl-4">{index + 1}.</TableCell>
                                            <TableCell className="text-center"><Checkbox className="rounded border-slate-300" /></TableCell>
                                            <TableCell className="text-sm text-slate-600 font-medium">{a.type}</TableCell>
                                            <TableCell className="text-sm text-slate-600 font-medium">
                                                {a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-sm text-[#337AB7] font-bold cursor-pointer hover:underline">{a.title}</TableCell>
                                            <TableCell className="text-center font-bold text-slate-700">{totalMarks}</TableCell>
                                            <TableCell className="text-center font-bold text-slate-700">{calculatedGpaWeight}%</TableCell>
                                            <TableCell className="text-right pr-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="default" size="sm" className="bg-[#337AB7] hover:bg-[#286090] text-xs h-8">
                                                            Action <ChevronDown size={14} className="ml-1" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuLabel>Manage Activity</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleAction('update', a)}>Update</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction('add_outcome', a)} className="font-bold text-[#337AB7]">Add Activity Outcome</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction('download_template', a)}>Download Excel Template</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction('import_outcome', a)}>Import Activity Outcome</DropdownMenuItem>
                                                        <DropdownMenuItem>Export Class Activities</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleDelete(a.id)}>
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-b-2xl">
                            <span className="text-slate-500 text-sm">No Results found.</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex gap-2 mt-4">
                <Button variant="destructive" className="bg-[#ff5b5b] hover:bg-[#ff4040]" onClick={handleDeleteAll}>Delete All</Button>
            </div>

            {/* Create Class Activity Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] p-0 border-0 shadow-2xl overflow-hidden rounded-3xl flex flex-col">
                    <DialogHeader className="p-4 bg-[#337AB7] text-white shrink-0">
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                            <Plus size={20} /> {isEditing ? 'Update Class Activity' : 'Create Class Activity'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 bg-white flex-1 overflow-y-auto space-y-6">
                        {/* Section 1: Top Level Info */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Activity/Assessment Method <span className="text-red-500">*</span></label>
                                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Assignment">Assignment</SelectItem>
                                        <SelectItem value="Quiz">Quiz</SelectItem>
                                        <SelectItem value="Mid Term / Sessional Exam">Mid Term / Sessional Exam</SelectItem>
                                        <SelectItem value="Final Exam">Final Exam</SelectItem>
                                        <SelectItem value="Project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Name <span className="text-red-500">*</span></label>
                                <Input
                                    className="h-10 bg-slate-50"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Date <span className="text-red-500">*</span></label>
                                <Input
                                    type="date"
                                    className="h-10 bg-slate-50"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Total Marks <span className="text-red-500">*</span></label>
                                <Input
                                    type="number"
                                    className="h-10 bg-slate-50"
                                    value={formData.total_marks}
                                    onChange={(e) => setFormData({ ...formData, total_marks: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">GPA Weight</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-10 bg-slate-50"
                                    value={formData.gpa_weight}
                                    onChange={(e) => setFormData({ ...formData, gpa_weight: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="col-span-2 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="cep"
                                        checked={formData.is_complex_engineering_problem}
                                        onCheckedChange={(val) => setFormData({ ...formData, is_complex_engineering_problem: val })}
                                    />
                                    <label htmlFor="cep" className="text-xs text-slate-600 cursor-pointer">Complex Engineering Problem</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="igpa"
                                        checked={formData.include_in_gpa}
                                        onCheckedChange={(val) => setFormData({ ...formData, include_in_gpa: val })}
                                    />
                                    <label htmlFor="igpa" className="text-xs text-slate-600 cursor-pointer">Include for GPA Calculation</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="sr"
                                        checked={formData.show_result}
                                        onCheckedChange={(val) => setFormData({ ...formData, show_result: val })}
                                    />
                                    <label htmlFor="sr" className="text-xs text-slate-600 cursor-pointer">Show Result to Students</label>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6 mt-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Sub Activities / Questions</h3>

                            <div className="space-y-6">
                                {formData.subActivities.map((sa, idx) => (
                                    <Card key={sa.id} className="border border-slate-200 shadow-sm bg-slate-50/50">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600">Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        className="h-9 bg-white"
                                                        value={sa.question_number}
                                                        onChange={(e) => handleSubActivityChange(sa.id, 'question_number', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600">Max Marks <span className="text-red-500">*</span></label>
                                                    <Input
                                                        type="number"
                                                        className="h-9 bg-white"
                                                        value={sa.max_marks}
                                                        onChange={(e) => handleSubActivityChange(sa.id, 'max_marks', parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600">% OBE Weight</label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="h-9 bg-white"
                                                        value={sa.obe_weight}
                                                        onChange={(e) => handleSubActivityChange(sa.id, 'obe_weight', parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600">Complexity</label>
                                                    <Select value={sa.complexity} onValueChange={(val) => handleSubActivityChange(sa.id, 'complexity', val)}>
                                                        <SelectTrigger className="h-9 bg-white">
                                                            <SelectValue placeholder="Select Complexity" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="WP1">WP1 - Depth of knowledge req</SelectItem>
                                                            <SelectItem value="WP2">WP2 - Conflict requirements</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4 items-end">
                                                <div className="col-span-3 space-y-2">
                                                    <label className="text-xs font-bold text-slate-600">CLO</label>
                                                    <Select value={sa.clo_id} onValueChange={(val) => handleSubActivityChange(sa.id, 'clo_id', val)}>
                                                        <SelectTrigger className="h-9 bg-white">
                                                            <SelectValue placeholder="Select CLO" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {clos.map(c => (
                                                                <SelectItem key={c.id} value={c.id}>
                                                                    {c.code} - {c.title.length > 30 ? c.title.substring(0, 30) + '...' : c.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1 pb-2">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Checkbox
                                                            id={`notobe-${sa.id}`}
                                                            checked={sa.not_for_obe}
                                                            onCheckedChange={(val) => handleSubActivityChange(sa.id, 'not_for_obe', val)}
                                                        />
                                                        <label htmlFor={`notobe-${sa.id}`} className="text-xs text-slate-600 cursor-pointer">Not for OBE</label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">Question (Guideline for Question)</label>
                                                <Textarea
                                                    className="resize-none h-16 bg-white"
                                                    value={sa.question_guideline}
                                                    onChange={(e) => handleSubActivityChange(sa.id, 'question_guideline', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">Answers (Guideline for Answer)</label>
                                                <Textarea
                                                    className="resize-none h-16 bg-white"
                                                    value={sa.answer_guideline}
                                                    onChange={(e) => handleSubActivityChange(sa.id, 'answer_guideline', e.target.value)}
                                                />
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="bg-[#ff5b5b] hover:bg-[#ff4040] gap-1 h-8 text-xs"
                                                    onClick={() => handleRemoveSubActivity(sa.id)}
                                                >
                                                    <X size={14} /> Delete
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                className="mt-4 border-[#107C41] text-[#107C41] hover:bg-[#107C41] hover:text-white"
                                onClick={handleAddSubActivity}
                            >
                                <Plus size={16} className="mr-2" /> Add Sub Activity
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                        <div className="text-xs text-slate-500 italic">Fields marked with <span className="text-red-500">*</span> are required.</div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button className="bg-[#337AB7] hover:bg-[#286090]" onClick={handleCreateSubmit}>Save</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub Activity Outcomes (Marks) Grid Modal */}
            <Dialog open={outcomesOpen} onOpenChange={setOutcomesOpen}>
                <DialogContent className="sm:max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] p-0 border-0 shadow-2xl overflow-hidden rounded-3xl flex flex-col">
                    <DialogHeader className="p-4 bg-[#337AB7] text-white shrink-0">
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center justify-between">
                            <span>Add / Update Activity Outcome</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
                            <Button className="bg-[#337AB7] hover:bg-[#286090] h-9" onClick={handleSaveOutcomes} disabled={savingOutcomes}>
                                {savingOutcomes ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                Save Outcomes
                            </Button>
                            <span className="text-sm font-bold text-slate-600">
                                {activeAssessment?.title} ({activeAssessment?.type})
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar p-0">
                            <Table className="relative min-w-max">
                                <TableHeader className="sticky top-0 bg-slate-400 z-10 shadow-sm outline outline-1 outline-slate-500">
                                    <TableRow className="hover:bg-slate-400 border-none">
                                        <TableHead className="font-bold text-white pl-4 uppercase text-xs w-[150px] sticky left-0 bg-slate-400 z-20 outline outline-1 outline-slate-500">Registration No.</TableHead>
                                        <TableHead className="font-bold text-white uppercase text-xs w-[250px] sticky left-[150px] bg-slate-400 z-20 outline outline-1 outline-slate-500">Name</TableHead>
                                        {activeAssessment?.assessment_questions?.sort((a, b) => a.question_number.localeCompare(b.question_number)).map(q => (
                                            <TableHead key={`th_${q.id}`} className="font-bold text-white text-center uppercase text-xs w-[150px] border-l border-slate-300">
                                                <div className="flex flex-col items-center">
                                                    <span>{q.question_number} ({q.max_marks})</span>
                                                    <span className="text-[9px] text-slate-200">Abst | Marks</span>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrolledStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2 + (activeAssessment?.assessment_questions?.length || 0)} className="text-center py-10 text-slate-500">
                                                No students enrolled in this course yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        enrolledStudents.map((student) => (
                                            <TableRow key={student.id} className="hover:bg-blue-50/30">
                                                <TableCell className="font-mono text-xs font-bold pl-4 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 outline outline-1 outline-slate-100">{student.reg_no}</TableCell>
                                                <TableCell className="text-xs font-bold text-slate-700 uppercase sticky left-[150px] bg-white group-hover:bg-blue-50/30 z-10 outline outline-1 outline-slate-100">{student.name}</TableCell>
                                                {activeAssessment?.assessment_questions?.sort((a, b) => a.question_number.localeCompare(b.question_number)).map(q => {
                                                    const key = `${student.id}_${q.id}`;
                                                    const isAbsent = absentData[key] || false;
                                                    const marks = outcomesData[key] !== undefined ? outcomesData[key] : '';

                                                    return (
                                                        <TableCell key={`tc_${key}`} className="text-center p-2 border-l border-slate-100 bg-white">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <Checkbox
                                                                    checked={isAbsent}
                                                                    onCheckedChange={(val) => handleAbsentChange(student.id, q.id, val)}
                                                                    className="h-4 w-4 border-slate-300 rounded"
                                                                />
                                                                <Input
                                                                    type="number"
                                                                    className="w-16 h-8 text-center text-xs font-bold disabled:bg-slate-100 disabled:opacity-50"
                                                                    value={marks}
                                                                    onChange={(e) => handleOutcomeChange(student.id, q.id, e.target.value, q.max_marks)}
                                                                    disabled={isAbsent}
                                                                    max={q.max_marks}
                                                                    min={0}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Import Activity Outcome Modal */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] p-0 border-0 shadow-2xl overflow-hidden rounded-3xl flex flex-col">
                    <DialogHeader className="p-4 bg-[#337AB7] text-white shrink-0">
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center justify-between">
                            <span>Import Activity Outcome</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-8">

                        {/* Import using CSV/Excel Data */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-700 border-b pb-2">Import using CSV / Excel Data</h3>
                            <Button className="bg-[#337AB7] hover:bg-[#286090]">Proceed</Button>
                        </div>

                        {/* Import using Advance Template */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-700 border-b pb-2">Import using Advance Template</h3>
                            <div className="bg-white p-6 rounded-lg border text-center space-y-4">
                                <p className="text-sm text-slate-600">Please download the excel template to make excel file.</p>
                                <p className="text-sm text-slate-600">This option will create activities and sub activities for you using excel data.</p>
                                <p className="text-sm text-red-500 font-bold italic">Be patient! This process may take a while.. please wait</p>

                                <div className="pt-4 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept=".xlsx, .xls, .csv"
                                            onChange={(e) => setAdvancedImportFile(e.target.files[0])}
                                            className="w-64 cursor-pointer"
                                        />
                                        <Button
                                            className="bg-[#b33c2d] hover:bg-[#a03020] min-w-[120px]"
                                            onClick={handleAdvancedFileUpload}
                                            disabled={!advancedImportFile || advancedUploading}
                                        >
                                            {advancedUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                            Upload File
                                        </Button>
                                    </div>
                                    <span
                                        className="text-sm text-blue-500 underline cursor-pointer hover:text-blue-700"
                                        onClick={handleDownloadAdvancedTemplate}
                                    >
                                        Download Advance Template
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Import using Template */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-700 border-b pb-2">Import using Template</h3>
                            <div className="bg-white p-6 rounded-lg border text-center space-y-4">
                                <p className="text-sm text-slate-600">Please download the excel template and upload once filled in with marks.</p>
                                <p className="text-sm text-slate-600">Please take great care not to change or delete any existing data (like column names).</p>

                                <div className="pt-4 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept=".xlsx, .xls, .csv"
                                            onChange={(e) => setImportFile(e.target.files[0])}
                                            className="w-64 cursor-pointer"
                                        />
                                        <Button
                                            className="bg-[#337AB7] hover:bg-[#286090] min-w-[120px]"
                                            onClick={handleFileUpload}
                                            disabled={!importFile || uploading}
                                        >
                                            {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                            Upload File
                                        </Button>
                                    </div>
                                    <span
                                        className="text-sm text-blue-500 underline cursor-pointer hover:text-blue-700"
                                        onClick={() => handleDownloadTemplate(activeAssessment)}
                                    >
                                        Download Import Template
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>

            {/* Import Class Activities (Definitions) Modal */}
            <Dialog open={importAssessmentsOpen} onOpenChange={setImportAssessmentsOpen}>
                <DialogContent className="sm:max-w-2xl bg-white p-0 border-0 shadow-2xl overflow-hidden rounded-3xl">
                    <DialogHeader className="p-6 bg-[#337AB7] text-white shrink-0">
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <FileSpreadsheet className="h-6 w-6" />
                            <span>Import Class Activities</span>
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 font-medium">
                            Bulk create assessments and their sub-activities from an Excel file.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center space-y-4">
                            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-[#337AB7]">
                                <Download size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-800">Download Template First</h3>
                                <p className="text-sm text-slate-500">Ensure your file follows our standard format for bulk importing.</p>
                            </div>
                            <Button variant="outline" onClick={handleDownloadImportTemplate} className="border-[#337AB7] text-[#337AB7] hover:bg-[#337AB7] hover:text-white font-bold h-11 px-8 rounded-xl transition-all">
                                <Download size={18} className="mr-2" /> Download Import Template
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Select Excel File</label>
                            <div className="relative group">
                                <Input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setImportAssessmentsFile(e.target.files[0])}
                                    className="h-14 bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-[#337AB7] transition-all cursor-pointer file:hidden pr-12 pt-4 font-bold text-slate-600"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#337AB7]">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <div className="absolute left-3 top-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Click to browse archive</div>
                            </div>
                            {importAssessmentsFile && (
                                <p className="text-xs font-bold text-[#107C41] flex items-center gap-1 animate-in slide-in-from-left-2">
                                    <CheckSquare size={14} /> Selected: {importAssessmentsFile.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex gap-3">
                        <Button variant="outline" className="h-12 px-6 rounded-xl font-bold" onClick={() => setImportAssessmentsOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-[#337AB7] hover:bg-[#286090] text-white font-bold h-12 px-10 rounded-xl shadow-lg shadow-blue-100 transition-all flex-1"
                            onClick={handleImportAssessments}
                            disabled={importingAssessments || !importAssessmentsFile}
                        >
                            {importingAssessments ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Upload size={20} className="mr-2" />}
                            Start Bulk Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div id="printable-area" className="hidden print:block p-8">
                <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
                    <h1 className="text-3xl font-black uppercase">Class Activities Report</h1>
                    <p className="text-lg font-bold text-slate-600">Course ID: {courseId}</p>
                    <p className="text-sm">Generated on: {new Date().toLocaleString()}</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold text-slate-900">Type</TableHead>
                            <TableHead className="font-bold text-slate-900">Name</TableHead>
                            <TableHead className="font-bold text-slate-900">Date</TableHead>
                            <TableHead className="text-center font-bold text-slate-900">Total Marks</TableHead>
                            <TableHead className="text-center font-bold text-slate-900">GPA %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assessments.map(a => (
                            <TableRow key={`print-${a.id}`}>
                                <TableCell>{a.type}</TableCell>
                                <TableCell className="font-bold">{a.title}</TableCell>
                                <TableCell>{a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell className="text-center">{a.assessment_questions?.reduce((s, q) => s + q.max_marks, 0)}</TableCell>
                                <TableCell className="text-center">{a.gpa_weight}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
