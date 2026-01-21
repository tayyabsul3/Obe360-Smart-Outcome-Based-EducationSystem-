import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle, Settings2, Plus, Trash2, FileText, List, Pencil, X, CheckSquare, Search, MoreHorizontal, Clock } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from '@/components/ui/checkbox';
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

    useEffect(() => {
        fetchPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgram) {
            fetchPLOs(selectedProgram.id);
            setSelectedPlos([]); // Reset selection when switching programs
        } else {
            setPlos([]);
        }
    }, [selectedProgram]);

    const fetchPrograms = async () => {
        setLoading(true);
        // showLoader();
        try {
            const res = await fetch('http://localhost:5000/api/programs');
            const data = await res.json();
            setPrograms(data);
        } catch (error) {
            console.error('Error fetching programs:', error);
            toast.error("Network error");
        } finally {
            setLoading(false);
            // hideLoader();
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

    // --- Program Actions ---

    const openEditProgram = (prog) => {
        setIsEditingProgram(true);
        setEditingProgramId(prog.id);
        setTitle(prog.title);
        setCode(prog.code);
        setDuration(prog.duration_years);
        setManualProgramOpen(true);
    };

    const initiateDeleteProgram = (prog) => {
        setDeleteContext({ type: 'PROGRAM', id: prog.id, title: prog.code });
        setDeleteAlertOpen(true);
    };

    const initiateDeletePlo = (plo) => {
        setDeleteContext({ type: 'PLO', id: plo.id, title: `PLO-${plo.plo_number}` });
        setDeleteAlertOpen(true);
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Programs</h1>
                    <p className="text-muted-foreground">Manage academic degree programs and outcomes.</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Study Plan Import Group */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border">
                        <Button variant="ghost" size="sm" onClick={() => downloadTemplate('STUDY_PLAN')} title="Template">
                            <Download size={14} className="mr-1" /> Plan
                        </Button>
                        <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>
                        <Button variant="ghost" size="sm" onClick={() => studyPlanFileRef.current?.click()}>
                            <Upload size={14} className="mr-2" /> Import Study Plan
                        </Button>
                        <input type="file" ref={studyPlanFileRef} className="hidden" accept=".csv" onChange={(e) => handleFileSelect(e, 'STUDY_PLAN')} />
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                    {/* Add Program Button (Opens Choice Dialog) */}
                    <Dialog open={addProgramOpen} onOpenChange={setAddProgramOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setIsEditingProgram(false); setTitle(''); setCode(''); setDuration(4); }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Program
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Program</DialogTitle>
                                <DialogDescription>Choose how you want to add programs.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all gap-3"
                                    onClick={() => { setAddProgramOpen(false); setManualProgramOpen(true); }}
                                >
                                    <div className="bg-white p-3 rounded-full shadow-sm"><FileText className="h-6 w-6 text-blue-600" /></div>
                                    <span className="font-semibold text-sm">Manual Entry</span>
                                </div>
                                <div
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all gap-3 relative"
                                >
                                    <div className="bg-white p-3 rounded-full shadow-sm"><FileSpreadsheet className="h-6 w-6 text-green-600" /></div>
                                    <span className="font-semibold text-sm">Import CSV</span>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".csv"
                                        ref={programFileRef}
                                        onChange={(e) => handleFileSelect(e, 'PROGRAM')}
                                        onClick={(e) => e.target.value = null}
                                    />
                                    <div className="absolute top-2 right-2" onClick={(e) => { e.stopPropagation(); downloadTemplate('PROGRAM'); }}>
                                        <Download size={14} className="text-muted-foreground hover:text-black" title="Download Template" />
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Manual Creation/Edit Dialog */}
                    <Dialog open={manualProgramOpen} onOpenChange={setManualProgramOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isEditingProgram ? 'Edit Program' : 'Create Program Manually'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmitProgram} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Program Title</Label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bachelor of Science in Software Engineering" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Program Code</Label>
                                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BSSE" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Years)</Label>
                                    <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                                </div>
                                <Button type="submit" className="w-full">{isEditingProgram ? 'Update Program' : 'Create Program'}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            {/* Universal Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Review Import Data</DialogTitle>
                        <DialogDescription>
                            {hasErrors ?
                                <span className="text-red-500 flex items-center gap-1"><AlertCircle size={14} /> Please fix or remove rows with errors.</span> :
                                `Found ${previewData.length} records. Ready to import.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto border rounded-md my-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {previewData.length > 0 && Object.keys(previewData[0]._visual_).map((key) => (
                                        <TableHead key={key}>{key}</TableHead>
                                    ))}
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewData.map((row) => (
                                    <TableRow key={row._id} className={!row.isValid ? "bg-red-50" : ""}>
                                        {Object.values(row._visual_).map((val, idx) => (
                                            <TableCell key={idx}>{val || <span className="text-red-400 text-xs italic">Missing</span>}</TableCell>
                                        ))}
                                        <TableCell>
                                            {row.isValid ? <span className="text-green-600 text-xs font-medium">Valid</span> : <span className="text-red-600 text-xs font-bold">Invalid</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => removeRowFromPreview(row._id)}>
                                                <X size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
                        <Button onClick={confirmImport} disabled={importing || hasErrors}>
                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteContext.type === 'PROGRAM' ? (
                                <>
                                    You are about to delete <strong>{deleteContext.title}</strong>. This action cannot be undone.
                                    This will permanently delete the program and <strong>remove all associated data</strong> including Study Plans, Classes, and PLOs.
                                </>
                            ) : deleteContext.type === 'PLO_BULK' ? (
                                <>
                                    You are about to delete <strong>{deleteContext.title}</strong>. This action cannot be undone.
                                </>
                            ) : (
                                <>
                                    You are about to delete <strong>{deleteContext.title}</strong>. This action cannot be undone.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* PLO Edit Dialog - New */}
            <Dialog open={editPloOpen} onOpenChange={setEditPloOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Program Learning Outcome</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={editPloTitle} onChange={e => setEditPloTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={editPloDesc} onChange={e => setEditPloDesc(e.target.value)} rows={5} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPloOpen(false)}>Cancel</Button>
                        <Button onClick={saveEditPlo}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>All Programs</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>PLOs</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {programs.map((program) => (
                                    <TableRow key={program.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-medium text-slate-700">
                                                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                    <FileText size={16} />
                                                </div>
                                                {program.code}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-slate-800">{program.title}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                                <Clock size={14} />
                                                {program.duration_years} Years
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-normal" onClick={() => { setSelectedProgram(program); setEditingPloId(null); }}>
                                                        <CheckSquare size={14} />
                                                        <span>Manage Outcomes</span>
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-[800px] sm:w-[540px] z-50">
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl border-b pb-4 mb-4">
                                                            {program.code} Learning Outcomes
                                                        </SheetTitle>
                                                        <SheetDescription>
                                                            Define the Program Learning Outcomes (PLOs) for this degree.
                                                        </SheetDescription>
                                                    </SheetHeader>

                                                    <Tabs defaultValue="list" className="mt-4">
                                                        <TabsList className="grid w-full grid-cols-2">
                                                            <TabsTrigger value="list">Outcomes List</TabsTrigger>
                                                            <TabsTrigger value="add">Add / Import</TabsTrigger>
                                                        </TabsList>

                                                        {/* List Tab */}
                                                        <TabsContent value="list" className="space-y-4 mt-4">

                                                            {/* Filters & Bulk Actions */}
                                                            {plos.length > 0 && (
                                                                <div className="flex items-center justify-between pb-2 mb-2 border-b">
                                                                    <div className="flex items-center gap-2">
                                                                        <Checkbox
                                                                            checked={selectedPlos.length === plos.length && plos.length > 0}
                                                                            onCheckedChange={toggleSelectAllPlos}
                                                                        />
                                                                        <span className="text-sm text-muted-foreground">{selectedPlos.length} selected</span>
                                                                    </div>
                                                                    {selectedPlos.length > 0 && (
                                                                        <Button variant="destructive" size="sm" onClick={initiateBulkDeletePlos} className="animate-in fade-in transition-all">
                                                                            <Trash2 className="mr-2 h-3 w-3" /> Delete Selected
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {ploLoading ? (
                                                                <Skeleton className="h-56 w-full" />
                                                            ) : plos.length > 0 ? (
                                                                /* Scrollable List */
                                                                <div className="h-[60vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                                                    {plos.map(plo => (
                                                                        <div key={plo.id} className={`p-3 border rounded-lg bg-white shadow-sm flex gap-3 group relative transition-all duration-200 hover:shadow-md ${selectedPlos.includes(plo.id) ? 'border-primary/50 bg-blue-50/50' : ''}`}>
                                                                            <div className="pt-1">
                                                                                <Checkbox
                                                                                    checked={selectedPlos.includes(plo.id)}
                                                                                    onCheckedChange={() => togglePloSelection(plo.id)}
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <div className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-xs h-fit whitespace-nowrap">
                                                                                        PLO-{plo.plo_number}
                                                                                    </div>
                                                                                    <h5 className="font-bold text-sm text-slate-800">{plo.title}</h5>
                                                                                </div>
                                                                                <p className="text-sm text-slate-600 leading-relaxed">{plo.description}</p>
                                                                            </div>

                                                                            {/* Actions */}
                                                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => openEditPloDialog(plo)}>
                                                                                    <Pencil size={14} />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600" onClick={() => initiateDeletePlo(plo)}>
                                                                                    <Trash2 size={14} />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded border border-dashed flex flex-col items-center justify-center gap-2">
                                                                    <List className="h-8 w-8 text-slate-300" />
                                                                    <p>No PLOs defined yet.</p>
                                                                </div>
                                                            )}
                                                        </TabsContent>

                                                        {/* Add Tab */}
                                                        <TabsContent value="add" className="space-y-6 mt-4">
                                                            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-medium text-sm">Add Single PLO</h4>
                                                                    <span className="text-xs text-muted-foreground">Auto-numbered</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Title</Label>
                                                                    <Input
                                                                        placeholder="e.g. Engineering Knowledge"
                                                                        value={newPloTitle}
                                                                        onChange={e => setNewPloTitle(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Description</Label>
                                                                    <Textarea
                                                                        placeholder="Describe the outcome..."
                                                                        value={newPloDesc}
                                                                        onChange={e => setNewPloDesc(e.target.value)}
                                                                    />
                                                                </div>
                                                                <Button onClick={handleCreatePlo} disabled={creatingPlo} className="w-full" size="sm">
                                                                    {creatingPlo ? 'Adding...' : 'Add Outcome'}
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-4 pt-4 border-t">
                                                                <h4 className="font-medium text-sm">Bulk Import PLOs (CSV)</h4>
                                                                <div className="flex gap-2">
                                                                    <Button variant="outline" size="sm" onClick={() => downloadTemplate('PLO')}>
                                                                        <Download className="mr-2 h-3 w-3" /> Template
                                                                    </Button>
                                                                    <div className="relative flex-1">
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            ref={ploFileRef}
                                                                            accept=".csv"
                                                                            onChange={(e) => handleFileSelect(e, 'PLO')}
                                                                        />
                                                                        <Button variant="outline" size="sm" className="w-full" onClick={() => ploFileRef.current?.click()}>
                                                                            <Upload className="mr-2 h-3 w-3" /> Upload CSV
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TabsContent>
                                                    </Tabs>
                                                </SheetContent>
                                            </Sheet>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-3">
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Options</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditProgram(program)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4 text-slate-500" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => initiateDeleteProgram(program)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Program
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {programs.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                                            No programs found. Use "Add Program" to get started.
                                        </TableCell>
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
