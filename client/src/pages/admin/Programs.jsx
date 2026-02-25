import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle, Settings2, Plus, Trash2, FileText, List, Pencil, X, CheckSquare, Search, MoreHorizontal, Clock, GraduationCap, Users, GitMerge, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useLoaderStore from '@/store/loaderStore';
import { ScrollArea } from "@/components/ui/scroll-area" // Assuming this exists or using div

export default function Programs() {
    // Global Loader
    const { showLoader, hideLoader } = useLoaderStore();

    // Data State
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [addProgramOpen, setAddProgramOpen] = useState(false);
    const [manualProgramOpen, setManualProgramOpen] = useState(false);

    // Import Preview State (Generic)
    const [previewOpen, setPreviewOpen] = useState(false);
    const [importType, setImportType] = useState(null); // 'PROGRAM', 'STUDY_PLAN', 'PLO'
    const [previewData, setPreviewData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [hasErrors, setHasErrors] = useState(false);

    // Delete Confirmation State
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [deleteContext, setDeleteContext] = useState({ type: null, id: null, title: '', isBulk: false });

    // Refs for File Inputs
    const programFileRef = useRef(null);
    const studyPlanFileRef = useRef(null);
    const ploFileRef = useRef(null);

    // Form State (Programs)
    const [isEditingProgram, setIsEditingProgram] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState(null);
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [duration, setDuration] = useState(4);

    // PLO Manager State
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [plos, setPlos] = useState([]);
    const [ploLoading, setPloLoading] = useState(false);

    const [newPloTitle, setNewPloTitle] = useState('');
    const [newPloDesc, setNewPloDesc] = useState('');
    const [creatingPlo, setCreatingPlo] = useState(false);

    // PLO Selection & Bulk Actions
    const [selectedPlos, setSelectedPlos] = useState([]);

    // PLO Edit Dialog State
    const [editPloOpen, setEditPloOpen] = useState(false);
    const [editingPloId, setEditingPloId] = useState(null);
    const [editPloTitle, setEditPloTitle] = useState('');
    const [editPloDesc, setEditPloDesc] = useState('');

    // Study Plan State
    const [studyPlan, setStudyPlan] = useState([]);
    const [spLoading, setSpLoading] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [courseSelectorOpen, setCourseSelectorOpen] = useState(false);
    const [targetSemester, setTargetSemester] = useState(null);
    const [assigningCourse, setAssigningCourse] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');

    useEffect(() => {
        fetchPrograms();
        fetchAllCourses();
    }, []);

    useEffect(() => {
        if (selectedProgram) {
            fetchPLOs(selectedProgram.id);
            fetchStudyPlan(selectedProgram.id);
            setSelectedPlos([]); // Reset selection when switching programs
        } else {
            setPlos([]);
            setStudyPlan([]);
        }
    }, [selectedProgram]);

    const fetchAllCourses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/courses');
            const data = await res.json();
            setAllCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchStudyPlan = async (programId) => {
        setSpLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/courses/program/${programId}`);
            if (res.ok) {
                const data = await res.json();
                setStudyPlan(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load study plan");
        } finally {
            setSpLoading(false);
        }
    };

    const handleAssignCourse = async (courseId) => {
        if (!selectedProgram || !targetSemester) return;

        setAssigningCourse(true);
        try {
            const res = await fetch(`http://localhost:5000/api/courses/program/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programId: selectedProgram.id,
                    courseId,
                    semester: targetSemester
                })
            });

            if (res.ok) {
                toast.success("Course assigned successfully");
                fetchStudyPlan(selectedProgram.id);
                setCourseSelectorOpen(false);
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to assign course");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setAssigningCourse(false);
        }
    };

    const handleRemoveFromStudyPlan = async (mappingId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/courses/program/unassign/${mappingId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success("Course removed from study plan");
                fetchStudyPlan(selectedProgram.id);
            } else {
                toast.error("Failed to remove course");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        }
    };

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/programs');
            const data = await res.json();
            setPrograms(data);
        } catch (error) {
            console.error('Error fetching programs:', error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const fetchPLOs = async (programId) => {
        setPloLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/programs/${programId}/plos`);
            if (res.ok) {
                const data = await res.json();
                setPlos(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load PLOs");
        } finally {
            setPloLoading(false);
        }
    };

    // --- Action Triggers & Deletion logic ---

    const openEditProgram = (prog) => {
        setIsEditingProgram(true);
        setEditingProgramId(prog.id);
        setTitle(prog.title);
        setCode(prog.code);
        setDuration(prog.duration_years);
        setManualProgramOpen(true);
    };

    const initiateDeleteProgram = (program) => {
        setDeleteContext({ type: 'PROGRAM', id: program.id, title: program.title });
        setDeleteAlertOpen(true);
    };

    const initiateDeletePlo = (plo) => {
        setDeleteContext({ type: 'PLO', id: plo.id, title: plo.title });
        setDeleteAlertOpen(true);
    };

    const executeDelete = async () => {
        try {
            let res;
            if (deleteContext.type === 'PROGRAM') {
                res = await fetch(`http://localhost:5000/api/programs/${deleteContext.id}`, { method: 'DELETE' });
            } else if (deleteContext.type === 'PLO') {
                res = await fetch(`http://localhost:5000/api/plos/${deleteContext.id}`, { method: 'DELETE' });
            } else if (deleteContext.type === 'PLO_BULK') {
                res = await fetch(`http://localhost:5000/api/plos/bulk-delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: deleteContext.ids })
                });
            }

            if (res && res.ok) {
                toast.success(`${deleteContext.title} purged successfully`);
                if (deleteContext.type === 'PROGRAM') {
                    fetchPrograms();
                    if (selectedProgram?.id === deleteContext.id) setSelectedProgram(null);
                } else {
                    fetchPLOs(selectedProgram.id);
                    setSelectedPlos([]); // Clear selection after bulk delete
                }
            } else {
                toast.error("Deletion failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error during purge");
        } finally {
            setDeleteAlertOpen(false);
        }
    };

    const initiateBulkDeletePlos = () => {
        if (selectedPlos.length === 0) return;
        setDeleteContext({
            type: 'PLO_BULK',
            ids: selectedPlos,
            title: `${selectedPlos.length} outcomes`,
            isBulk: true
        });
        setDeleteAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        setDeleteAlertOpen(false);
        const { type, id, ids } = deleteContext;
        showLoader();

        try {
            if (type === 'PROGRAM') {
                const res = await fetch(`http://localhost:5000/api/programs/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    toast.success("Program deleted");
                    fetchPrograms();
                } else {
                    toast.error("Failed to delete program");
                }
            } else if (type === 'PLO') {
                const res = await fetch(`http://localhost:5000/api/programs/plos/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    toast.success("PLO Deleted");
                    if (selectedProgram) fetchPLOs(selectedProgram.id);
                }
            } else if (type === 'PLO_BULK') {
                // Simulate bulk delete by calling delete endpoint for each ID (Promise.all)
                // Ideally backend should support bulk delete, but loop works for now
                const promises = ids.map(pid => fetch(`http://localhost:5000/api/programs/plos/${pid}`, { method: 'DELETE' }));
                await Promise.all(promises);
                toast.success("Selected PLOs deleted");
                setSelectedPlos([]);
                if (selectedProgram) fetchPLOs(selectedProgram.id);
            }
        } catch (error) {
            console.error(error);
            toast.error("Operation failed");
        } finally {
            hideLoader();
        }
    };

    const handleSubmitProgram = async (e) => {
        e.preventDefault();
        showLoader();
        const url = isEditingProgram
            ? `http://localhost:5000/api/programs/${editingProgramId}`
            : 'http://localhost:5000/api/programs';

        const method = isEditingProgram ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, code, duration_years: duration }),
            });
            if (res.ok) {
                setManualProgramOpen(false);
                fetchPrograms();
                setTitle('');
                setCode('');
                setIsEditingProgram(false);
                setEditingProgramId(null);
                toast.success(isEditingProgram ? "Program Updated" : "Program Created");
            } else {
                toast.error("Operation failed");
            }
        } catch (error) {
            console.error('Error saving program:', error);
        } finally {
            hideLoader();
        }
    };

    // --- PLO Actions ---

    const handleCreatePlo = async (e) => {
        e.preventDefault();
        if (!selectedProgram) return;
        setCreatingPlo(true);
        showLoader();
        try {
            const res = await fetch(`http://localhost:5000/api/programs/plos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: selectedProgram.id,
                    title: newPloTitle,
                    description: newPloDesc
                })
            });
            if (res.ok) {
                toast.success("PLO Added");
                setNewPloTitle('');
                setNewPloDesc('');
                fetchPLOs(selectedProgram.id);
            } else {
                toast.error("Failed to add PLO");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCreatingPlo(false);
            hideLoader();
        }
    };

    const openEditPloDialog = (plo) => {
        setEditingPloId(plo.id);
        setEditPloTitle(plo.title);
        setEditPloDesc(plo.description);
        setEditPloOpen(true);
    };

    const saveEditPlo = async () => {
        showLoader();
        try {
            const res = await fetch(`http://localhost:5000/api/programs/plos/${editingPloId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editPloTitle,
                    description: editPloDesc
                })
            });
            if (res.ok) {
                toast.success("PLO Updated");
                setEditPloOpen(false);
                setEditingPloId(null);
                fetchPLOs(selectedProgram.id);
            } else {
                toast.error("Failed to update PLO");
            }
        } catch (error) {
            console.error(error);
        } finally {
            hideLoader();
        }
    };

    // PLO Selection Logic
    const togglePloSelection = (id) => {
        setSelectedPlos(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAllPlos = () => {
        if (selectedPlos.length === plos.length) {
            setSelectedPlos([]);
        } else {
            setSelectedPlos(plos.map(p => p.id));
        }
    };

    // --- CSV Parsing ---

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        showLoader();

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rawData = results.data;
                if (rawData.length === 0) {
                    toast.error("File is empty");
                    hideLoader();
                    return;
                }
                processAndPreview(rawData, type);
                hideLoader();

                // Reset inputs
                if (programFileRef.current) programFileRef.current.value = "";
                if (studyPlanFileRef.current) studyPlanFileRef.current.value = "";
                if (ploFileRef.current) ploFileRef.current.value = "";
            },
            error: (err) => {
                toast.error("CSV Error", { description: err.message });
                hideLoader();
            }
        });
    };

    const processAndPreview = (data, type) => {
        let processed = [];
        let errorFound = false;

        const validate = (item, validator, visuals) => {
            const isValid = validator(item);
            if (!isValid) errorFound = true;
            return { ...item, isValid, _visual_: visuals(item), _id: Math.random() }; // _id for temporary key
        };

        if (type === 'PROGRAM') {
            processed = data.map(item => validate(
                item,
                (i) => i.code && i.title && i.duration_years,
                (i) => ({ Code: i.code, Title: i.title, Duration: i.duration_years })
            ));
        }
        else if (type === 'STUDY_PLAN') {
            processed = data.map(item => validate(
                item,
                (i) => i.program_code && i.course_code && i.semester,
                (i) => ({ Program: i.program_code, Course: i.course_code, Semester: i.semester })
            ));
        }
        else if (type === 'PLO') {
            processed = data.map(item => validate(
                item,
                (i) => i.title,
                (i) => ({ Title: i.title, Description: i.description })
            ));
        }

        setImportType(type);
        setPreviewData(processed);
        setHasErrors(errorFound);
        setAddProgramOpen(false);
        setPreviewOpen(true);
    };

    const removeRowFromPreview = (id) => {
        const newData = previewData.filter(row => row._id !== id);
        setPreviewData(newData);
        // Re-check for errors
        const stillHasErrors = newData.some(row => !row.isValid);
        setHasErrors(stillHasErrors);
        if (newData.length === 0) setPreviewOpen(false);
    };

    const confirmImport = async () => {
        setImporting(true);
        showLoader();
        try {
            // Strip UI flags
            const payload = previewData.filter(d => d.isValid).map(({ isValid, _visual_, _id, ...rest }) => rest);

            let url = '';
            let body = {};

            if (importType === 'PROGRAM') {
                url = 'http://localhost:5000/api/programs/bulk';
                body = { programs: payload.map(p => ({ title: p.title, code: p.code, duration_years: parseInt(p.duration_years) || 4 })) };
            }
            else if (importType === 'STUDY_PLAN') {
                url = 'http://localhost:5000/api/courses/study-plan/bulk';
                body = { items: payload };
            }
            else if (importType === 'PLO') {
                url = 'http://localhost:5000/api/programs/plos/bulk';
                body = { program_id: selectedProgram?.id, plos: payload };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await res.json();
            if (res.ok) {
                toast.success("Import Successful");
                setPreviewOpen(false);
                if (importType === 'PROGRAM') fetchPrograms();
                if (importType === 'PLO' && selectedProgram) fetchPLOs(selectedProgram?.id);
            } else {
                toast.error("Import Failed", { description: result.error });
            }

        } catch (error) {
            console.error(error);
            toast.error("Import Error");
        } finally {
            setImporting(false);
            hideLoader();
        }
    };

    // --- Templates ---
    const downloadTemplate = (type) => {
        let content = "";
        let filename = "";

        if (type === 'PROGRAM') {
            content = "code,title,duration_years\nBSSE,Software Engineering,4";
            filename = "programs_template.csv";
        } else if (type === 'STUDY_PLAN') {
            content = "program_code,course_code,semester\nBSSE,CSC-101,1";
            filename = "study_plan_template.csv";
        } else if (type === 'PLO') {
            content = "title,description\nEngineering Knowledge,Apply knowledge of mathematics...";
            filename = "plos_template.csv";
        }

        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Conditional View: List vs Management Hub */}
            {!selectedProgram ? (
                /* VIEW 1: DEGREE CATALOG & STATS */
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Programs</h1>
                            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mt-1">Institutional Curriculum & Outcome Management</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-full shadow-sm" onClick={() => downloadTemplate('STUDY_PLAN')}>
                                <Download size={14} className="mr-2" /> Template
                            </Button>
                            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md" onClick={() => { setIsEditingProgram(false); setTitle(''); setCode(''); setDuration(4); setManualProgramOpen(true); }}>
                                <Plus size={16} className="mr-2" /> Add Program
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Degrees', value: programs.length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Total PLOs', value: '48', icon: List, color: 'text-orange-600', bg: 'bg-orange-50' },
                            { label: 'Course Catalog', value: allCourses.length, icon: GitMerge, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Active Batches', value: '12', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                        ].map((stat, i) => (
                            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                        <stat.icon size={24} className={stat.color} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Degree Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-56 w-full rounded-3xl" />)
                        ) : programs.length > 0 ? (
                            programs.map(program => (
                                <Card
                                    key={program.id}
                                    className="group overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all active:scale-[0.98] cursor-pointer rounded-3xl shadow-sm hover:shadow-xl"
                                    onClick={() => setSelectedProgram(program)}
                                >
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row justify-between items-start">
                                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-blue-600 text-lg border border-slate-100">
                                            {program.code.substring(0, 2)}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white rounded-xl">
                                                    <MoreHorizontal size={16} className="text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl p-2">
                                                <DropdownMenuItem onClick={() => openEditProgram(program)} className="rounded-lg">
                                                    <Pencil size={14} className="mr-2" /> Edit Info
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-500 rounded-lg" onClick={() => initiateDeleteProgram(program)}>
                                                    <Trash2 size={14} className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">{program.title}</h3>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-blue-100">{program.code}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{program.duration_years} Years Duration</span>
                                        </div>
                                        <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white border-0 rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 transition-all shadow-lg shadow-slate-900/10">
                                            Manage Program
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                <GraduationCap size={48} className="text-slate-300 mb-4" />
                                <h3 className="text-lg font-black text-slate-800">No Degrees Established</h3>
                                <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium">Create your first academic program to start defining outcomes and semester plans.</p>
                                <Button className="mt-6 rounded-full" onClick={() => setManualProgramOpen(true)}>Add Program</Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* VIEW 2: DEGREE MANAGEMENT HUB */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="h-12 w-12 p-0 rounded-2xl hover:bg-white hover:shadow-md transition-all group" onClick={() => setSelectedProgram(null)}>
                            <ArrowLeft size={20} className="text-slate-600 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{selectedProgram.title}</h1>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-white shadow-sm">{selectedProgram.code}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Curriculum & Learning Outcome Workspace</p>
                        </div>
                    </div>

                    <Tabs defaultValue="plos" className="w-full">
                        <TabsList className="bg-white border p-1.5 rounded-[2rem] h-16 shadow-lg w-full max-w-[700px]">
                            <TabsTrigger value="plos" className="rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest h-full flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                                <GitMerge size={18} /> Outcomes
                            </TabsTrigger>
                            <TabsTrigger value="study-plan" className="rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest h-full flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                                <FileSpreadsheet size={18} /> Study Plan
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest h-full flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                                <Settings2 size={18} /> Configuration
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="plos" className="mt-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* PLO List Component */}
                                <Card className="lg:col-span-2 border-0 shadow-xl rounded-[2.5rem] overflow-hidden bg-white/50 backdrop-blur-sm">
                                    <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Active Learning Outcomes</h3>
                                        {selectedPlos.length > 0 && (
                                            <Button variant="destructive" size="sm" className="rounded-full h-8 px-4 font-black uppercase text-[10px] tracking-wider" onClick={initiateBulkDeletePlos}>
                                                Purge {selectedPlos.length} Items
                                            </Button>
                                        )}
                                    </div>
                                    <div className="p-8">
                                        {ploLoading ? (
                                            <div className="space-y-4">
                                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
                                            </div>
                                        ) : plos.length > 0 ? (
                                            <div className="space-y-4">
                                                {plos.map(plo => (
                                                    <div
                                                        key={plo.id}
                                                        className={cn(
                                                            "p-6 rounded-3xl border-2 transition-all duration-300 group relative flex gap-5",
                                                            selectedPlos.includes(plo.id) ? "border-blue-500 bg-blue-50/50" : "bg-white border-slate-100 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            checked={selectedPlos.includes(plo.id)}
                                                            onCheckedChange={() => togglePloSelection(plo.id)}
                                                            className="mt-1 h-5 w-5 rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">PLO-{plo.plo_number}</span>
                                                                <h4 className="font-black text-slate-800 text-lg tracking-tight">{plo.title}</h4>
                                                            </div>
                                                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{plo.description}</p>
                                                        </div>
                                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md" onClick={() => openEditPloDialog(plo)}>
                                                                <Pencil size={16} className="text-slate-400 hover:text-blue-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md" onClick={() => initiateDeletePlo(plo)}>
                                                                <Trash2 size={16} className="text-slate-400 hover:text-red-600" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                                                <p className="font-bold text-slate-400">No outcomes defined for this program.</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* PLO Controls Component */}
                                <div className="space-y-6">
                                    <Card className="border-0 shadow-xl rounded-[2.5rem] bg-blue-600 text-white overflow-hidden">
                                        <CardHeader className="p-8 pb-4">
                                            <h3 className="text-xl font-black tracking-tight">Outcome Builder</h3>
                                            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">Add Outcome for {selectedProgram.code}</p>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-blue-100 tracking-widest ml-1">Title</Label>
                                                    <Input
                                                        placeholder="e.g. Engineering Knowledge"
                                                        value={newPloTitle}
                                                        onChange={e => setNewPloTitle(e.target.value)}
                                                        className="h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 ring-0 focus-visible:ring-0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-blue-100 tracking-widest ml-1">Description</Label>
                                                    <Textarea
                                                        placeholder="Define the scope..."
                                                        value={newPloDesc}
                                                        onChange={e => setNewPloDesc(e.target.value)}
                                                        className="rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 min-h-[140px] leading-relaxed ring-0 focus-visible:ring-0"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleCreatePlo}
                                                    disabled={creatingPlo}
                                                    className="w-full h-14 bg-white text-blue-600 hover:bg-white/90 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all"
                                                >
                                                    {creatingPlo ? 'Encrypting...' : 'Add PLO Entry'}
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-4 py-2 opacity-50">
                                                <div className="h-[1px] flex-1 bg-white/30"></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest">or batch import</span>
                                                <div className="h-[1px] flex-1 bg-white/30"></div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button variant="ghost" className="rounded-2xl h-12 bg-white/10 hover:bg-white/20 border-white/5 font-bold text-[10px] uppercase tracking-widest" onClick={() => downloadTemplate('PLO')}>
                                                    <Download size={16} className="mr-2" /> Template
                                                </Button>
                                                <Button variant="ghost" className="rounded-2xl h-12 bg-white/10 hover:bg-white/20 border-white/5 font-bold text-[10px] uppercase tracking-widest" onClick={() => ploFileRef.current?.click()}>
                                                    <Upload size={16} className="mr-2" /> CSV Upload
                                                </Button>
                                                <input type="file" ref={ploFileRef} className="hidden" accept=".csv" onChange={(e) => handleFileSelect(e, 'PLO')} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-lg rounded-[2.5rem] p-8 text-center bg-slate-50">
                                        <div className="max-w-xs mx-auto space-y-3">
                                            <FileText size={32} className="mx-auto text-slate-300" />
                                            <h4 className="font-black text-slate-800">Need Guidance?</h4>
                                            <p className="text-xs text-slate-500 font-medium">Download our PLO mapping guidelines to ensure OBE compliance across all programs.</p>
                                            <Button variant="link" className="text-blue-600 font-black uppercase text-[10px] tracking-widest underline">Compliance Guide</Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="study-plan" className="mt-8">
                            <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                                <CardHeader className="p-10 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">8-Semester Study Roadmap</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Curriculum progression for {selectedProgram.duration_years} academic years</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white" onClick={() => downloadTemplate('STUDY_PLAN')}>
                                            <Download size={16} className="mr-2" /> Template
                                        </Button>
                                        <Button variant="outline" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white" onClick={() => studyPlanFileRef.current.click()}>
                                            <Upload size={16} className="mr-2" /> Import Plan
                                        </Button>
                                        <input type="file" ref={studyPlanFileRef} className="hidden" accept=".csv" onChange={(e) => handleFileSelect(e, 'STUDY_PLAN')} />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10">
                                    {spLoading ? (
                                        <div className="grid grid-cols-4 gap-8">
                                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                <div key={sem} className="space-y-5 flex flex-col h-full">
                                                    <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg">
                                                        <span className="text-[11px] font-black uppercase tracking-widest">Semester {sem}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">Y{(Math.ceil(sem / 2))}</span>
                                                    </div>

                                                    <div className="flex-1 space-y-3 p-2 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-slate-100 transition-colors">
                                                        {studyPlan.filter(plan => plan.semester === sem).map(item => (
                                                            <div key={item.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-blue-100">
                                                                        {item.course?.code}
                                                                    </span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 rounded-lg"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveFromStudyPlan(item.id);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </Button>
                                                                </div>
                                                                <p className="text-xs font-black text-slate-800 leading-tight mb-3 line-clamp-2">{item.course?.title}</p>
                                                                <div className="flex items-center justify-between border-t pt-3">
                                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                        <Clock size={10} /> {item.course?.credit_hours} HR
                                                                    </span>
                                                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></span>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <Button
                                                            variant="ghost"
                                                            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white hover:border-slate-300 hover:text-slate-600 transition-all flex flex-col gap-2"
                                                            onClick={() => {
                                                                setTargetSemester(sem);
                                                                setCourseSelectorOpen(true);
                                                            }}
                                                        >
                                                            <Plus size={20} className="text-slate-300" />
                                                            Assign Course
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings" className="mt-8">
                            <Card className="border-0 shadow-2xl rounded-[3rem] p-20 text-center bg-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>
                                <div className="max-w-md mx-auto space-y-6 relative">
                                    <div className="h-20 w-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-xl rotate-3">
                                        <Settings2 size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Institutional Configuration</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                                            Fine-tune the academic parameters for {selectedProgram.title}.
                                            Adjust duration, credit limits, and OBE mapping strictness.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-6">
                                        <div className="p-6 bg-slate-50 rounded-3xl text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                                            <p className="text-xl font-black text-slate-800">{selectedProgram.duration_years} Years</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Semester Cycle</p>
                                            <p className="text-xl font-black text-slate-800">Bi-Annual</p>
                                        </div>
                                    </div>
                                    <Button className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all">Update Institutional Data</Button>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* SHARED MODALS & OVERLAYS */}

            {/* 0. Course Selector Hub */}
            <Dialog open={courseSelectorOpen} onOpenChange={setCourseSelectorOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden">
                    <div className="p-10 pb-6 border-b bg-slate-50/50">
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Course Repository</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Select course for Semester {targetSemester}</DialogDescription>

                        <div className="mt-6 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <Input
                                placeholder="Search courses by code or title..."
                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-white ring-0 focus-visible:ring-0 shadow-sm"
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-[50vh] overflow-auto p-10 pt-6 space-y-3">
                        {allCourses.filter(c =>
                            c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                            c.code.toLowerCase().includes(courseSearch.toLowerCase())
                        ).length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching courses in repository</p>
                            </div>
                        ) : (
                            allCourses
                                .filter(c =>
                                    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                                    c.code.toLowerCase().includes(courseSearch.toLowerCase())
                                )
                                .map(course => {
                                    const isAlreadyAssigned = studyPlan.some(plan => plan.course_id === course.id);
                                    return (
                                        <div
                                            key={course.id}
                                            className={cn(
                                                "flex items-center justify-between p-5 rounded-2xl border border-slate-50 transition-all",
                                                isAlreadyAssigned ? "bg-slate-50/50 opacity-60" : "hover:bg-blue-50/50 hover:border-blue-100 cursor-pointer"
                                            )}
                                            onClick={() => !isAlreadyAssigned && handleAssignCourse(course.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-blue-600 border border-slate-50 uppercase text-[10px]">
                                                    {course.code.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-sm leading-tight">{course.title}</h4>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{course.code} • {course.credit_hours} HR</p>
                                                </div>
                                            </div>
                                            {isAlreadyAssigned ? (
                                                <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-500 px-3 py-1 rounded-full">Assigned</span>
                                            ) : (
                                                <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                                                    <Plus size={20} />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>

                    <div className="p-8 pt-0 border-t bg-slate-50/50 flex justify-end px-10">
                        <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest h-14" onClick={() => setCourseSelectorOpen(false)}>Close Repository</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 1. Program Creation Entry Choice */}
            <Dialog open={addProgramOpen} onOpenChange={setAddProgramOpen}>
                <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Expand Academic Catalog</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">Select your preferred methodology for adding new programs.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-8">
                        <div
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all gap-4 group"
                            onClick={() => { setAddProgramOpen(false); setManualProgramOpen(true); }}
                        >
                            <div className="bg-white p-5 rounded-3xl shadow-lg group-hover:scale-110 transition-transform"><FileText className="h-8 w-8 text-blue-600" /></div>
                            <span className="font-black text-xs uppercase tracking-widest text-slate-600">Manual Entry</span>
                        </div>
                        <div
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] hover:border-green-600 hover:bg-green-50/50 cursor-pointer transition-all gap-4 group relative"
                        >
                            <div className="bg-white p-5 rounded-3xl shadow-lg group-hover:scale-110 transition-transform"><FileSpreadsheet className="h-8 w-8 text-green-600" /></div>
                            <span className="font-black text-xs uppercase tracking-widest text-slate-600">Bulk CSV Import</span>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".csv"
                                ref={programFileRef}
                                onChange={(e) => handleFileSelect(e, 'PROGRAM')}
                                onClick={(e) => e.target.value = null}
                            />
                            <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white shadow-sm" onClick={(e) => { e.stopPropagation(); downloadTemplate('PROGRAM'); }}>
                                <Download size={14} className="text-slate-400 hover:text-slate-900" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 2. Manual Program Form */}
            <Dialog open={manualProgramOpen} onOpenChange={setManualProgramOpen}>
                <DialogContent className="sm:max-w-lg rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">{isEditingProgram ? 'Edit Program' : 'Add Program'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitProgram} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Degree Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Bachelor of Science in Software Engineering"
                                required
                                className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Program Code</Label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="BSSE"
                                    required
                                    className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Duration (Years)</Label>
                                <Input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    required
                                    className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all">
                            {isEditingProgram ? 'Update' : 'Add'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 3. Universal Preview Stream */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col rounded-[3rem] border-0 shadow-2xl p-0 overflow-hidden">
                    <div className="p-10 pb-6 border-b bg-slate-50/50">
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Data Preview</DialogTitle>
                        <DialogDescription className="mt-2">
                            {hasErrors ?
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest border border-red-100 mt-2">
                                    <AlertCircle size={14} /> Critical: Validation Errors Detected
                                </span> :
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest border border-green-100 mt-2">
                                    <CheckSquare size={14} /> Ready: {previewData.length} records validated
                                </span>
                            }
                        </DialogDescription>
                    </div>

                    <div className="flex-1 overflow-auto p-10 pt-6">
                        <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                        {previewData.length > 0 && Object.keys(previewData[0]._visual_).map((key) => (
                                            <TableHead key={key} className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">{key}</TableHead>
                                        ))}
                                        <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Status</TableHead>
                                        <TableHead className="w-[80px] h-14"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row) => (
                                        <TableRow key={row._id} className={cn("hover:bg-slate-50/30 transition-colors border-b border-slate-50", !row.isValid ? "bg-red-50/50" : "")}>
                                            {Object.values(row._visual_).map((val, idx) => (
                                                <TableCell key={idx} className="font-bold text-slate-700">{val || <span className="text-red-400 text-[10px] font-black uppercase">Null</span>}</TableCell>
                                            ))}
                                            <TableCell>
                                                {row.isValid ?
                                                    <span className="text-[9px] font-black uppercase bg-green-100 text-green-700 px-2 py-1 rounded-full">Pass</span> :
                                                    <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-2 py-1 rounded-full">Fail</span>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white text-slate-300 hover:text-red-500" onClick={() => removeRowFromPreview(row._id)}>
                                                    <X size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="p-10 pt-6 border-t bg-slate-50/50 flex justify-end gap-3">
                        <Button variant="ghost" className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest" onClick={() => setPreviewOpen(false)}>Cancel</Button>
                        <Button onClick={confirmImport} disabled={importing || hasErrors} className="rounded-2xl h-12 px-10 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10">
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 4. Delete Mitigation Protocol */}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            {deleteContext.type === 'PROGRAM' ? (
                                <>
                                    Confirm deletion of <strong>{deleteContext.title}</strong>. This will cascade and permanently purge all associated Study Plans, PLOs, and Course Allocations. This cannot be reversed.
                                </>
                            ) : (
                                <>
                                    Confirm the permanent removal of <strong>{deleteContext.title}</strong>. This record will be erased from the institutional database.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8">
                        <AlertDialogCancel className="rounded-2xl h-12 px-8 border-0 bg-slate-100 font-bold uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-600/20" onClick={executeDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 5. PLO Modulation Interface */}
            <Dialog open={editPloOpen} onOpenChange={setEditPloOpen}>
                <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Edit Outcome</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PLO Title</Label>
                            <Input
                                value={editPloTitle}
                                onChange={e => setEditPloTitle(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description</Label>
                            <Textarea
                                value={editPloDesc}
                                onChange={e => setEditPloDesc(e.target.value)}
                                rows={6}
                                className="rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-medium leading-relaxed"
                            />
                        </div>
                    </div>
                    <div className="mt-10 flex gap-3">
                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest" onClick={() => setEditPloOpen(false)}>Cancel</Button>
                        <Button onClick={saveEditPlo} className="flex-[2] h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">Save</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
