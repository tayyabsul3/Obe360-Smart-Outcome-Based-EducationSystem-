import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, List, FileSpreadsheet, Upload, Download, FileText, AlertCircle, X, CheckSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import useLoaderStore from '@/store/loaderStore';
import Papa from 'papaparse';

export default function CLOManager() {
    const { courseId } = useParams();
    const { showLoader, hideLoader } = useLoaderStore();

    // Data State
    const [clos, setClos] = useState([]);
    const [plos, setPlos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
    const [manualDialogOpen, setManualDialogOpen] = useState(false);

    // Edit/Create State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        type: 'Cognitive',
        level: 'C1',
        plo_id: 'none'
    });

    // Import State
    const fileInputRef = useRef(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [hasErrors, setHasErrors] = useState(false);

    useEffect(() => {
        if (courseId) {
            fetchCLOs();
            fetchPLOs();
        }
    }, [courseId]);

    const fetchCLOs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/clos/${courseId}`);
            if (res.ok) setClos(await res.json());
        } catch (error) {
            console.error(error);
            toast.error("Failed to load CLOs");
        } finally {
            setLoading(false);
        }
    };

    const fetchPLOs = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/programs/plos/course/${courseId}`);
            if (res.ok) setPlos(await res.json());
        } catch (error) {
            console.error("Failed to fetch PLOs", error);
        }
    };

    // --- Manual CRUD ---

    const openCreate = () => {
        const nextNum = clos.length + 1;
        setFormData({
            code: `CLO-${nextNum}`,
            title: '',
            description: '',
            type: 'Cognitive',
            level: 'C1',
            plo_id: 'none'
        });
        setEditingId(null);
        setChoiceDialogOpen(false);
        setManualDialogOpen(true);
    };

    const handleEdit = (clo) => {
        setEditingId(clo.id);
        setFormData({
            code: clo.code,
            title: clo.title || '',
            description: clo.description || '',
            type: clo.type || 'Cognitive',
            level: clo.level || 'C1',
            plo_id: clo.plo_id || 'none' // Assuming backend returns this if we joined, but currently getCLOs might not join. 
            // If getCLOs doesn't return plo_id, this might be empty.
            // For now, let's assume getCLOs is simple. If we want to show existing mapping, we need to update getCLOs to join.
            // But let's proceed with saving correctly first.
        });
        setManualDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.code) return toast.warning("Code is required");

        showLoader();
        const url = editingId
            ? `http://localhost:5000/api/clos/${editingId}`
            : 'http://localhost:5000/api/clos';

        const method = editingId ? 'PUT' : 'POST';
        const body = {
            course_id: courseId,
            ...formData
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(editingId ? "CLO Updated" : "CLO Created");
                fetchCLOs();
                setManualDialogOpen(false);
            } else {
                toast.error("Operation failed");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            hideLoader();
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this CLO?")) return;
        showLoader();
        try {
            const res = await fetch(`http://localhost:5000/api/clos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("CLO Deleted");
                fetchCLOs();
            }
        } catch (error) {
            toast.error("Failed to delete");
        } finally {
            hideLoader();
        }
    };

    // --- CSV (Keep existing logic, maybe simplify) ---
    // (Existing CSV Logic Omitted/Compressed for brevity if not changing, but I will include it to ensure file integrity)

    const downloadTemplate = () => {
        const content = "title,description\nAnalyze Algorithms,Evaluate the efficiency...";
        const blob = new Blob([content], { type: 'text/csv' });
        const text = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = text;
        a.download = "clos_template.csv";
        a.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setChoiceDialogOpen(false);
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
                processAndPreview(rawData);
                hideLoader();
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
            error: (err) => {
                toast.error("CSV Error");
                hideLoader();
            }
        });
    };

    const processAndPreview = (data) => {
        let errorFound = false;
        let currentCount = clos.length;
        const processed = data.map((item, index) => {
            const isValid = item.title && item.title.trim() !== '';
            if (!isValid) errorFound = true;
            return {
                ...item,
                code: `CLO-${currentCount + index + 1}`,
                isValid,
                _id: Math.random()
            };
        });
        setPreviewData(processed);
        setHasErrors(errorFound);
        setPreviewOpen(true);
    };

    const removeRowFromPreview = (id) => {
        const newData = previewData.filter(row => row._id !== id);
        setPreviewData(newData);
        setHasErrors(newData.some(row => !row.isValid));
        if (newData.length === 0) setPreviewOpen(false);
    };

    const confirmImport = async () => {
        setImporting(true);
        showLoader();
        try {
            const validRows = previewData.filter(d => d.isValid);
            let successCount = 0;
            let currentCount = clos.length;
            for (let i = 0; i < validRows.length; i++) {
                const row = validRows[i];
                const nextCode = `CLO-${currentCount + i + 1}`;
                await fetch('http://localhost:5000/api/clos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        course_id: courseId,
                        code: nextCode,
                        title: row.title,
                        description: row.description || '',
                        type: 'Cognitive', // Default for import
                        level: 'C1'
                    })
                });
                successCount++;
            }
            toast.success(`Imported ${successCount} CLOs`);
            setPreviewOpen(false);
            fetchCLOs();
        } catch (error) {
            toast.error("Import Failed");
        } finally {
            setImporting(false);
            hideLoader();
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">Course Learning Outcomes</h2>
                    <p className="text-xs text-muted-foreground">Define and manage course outcomes.</p>
                </div>
                <div>
                    <Dialog open={choiceDialogOpen} onOpenChange={setChoiceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 h-8">
                                <Plus size={14} /> Add CLO
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add Course Learning Outcome</DialogTitle>
                                <DialogDescription>Choose how you want to add outcomes.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all gap-3"
                                    onClick={openCreate}
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
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        onClick={(e) => e.target.value = null}
                                    />
                                    <div className="absolute top-2 right-2" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                                        <Download size={14} className="text-muted-foreground hover:text-black" title="Download Template" />
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : clos.length > 0 ? (
                        <div className="border rounded-md bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="w-[80px]">Code</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type/Level</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clos.map((clo) => (
                                        <TableRow key={clo.id} className="group hover:bg-slate-50/50">
                                            <TableCell className="font-medium align-top">
                                                <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-xs border border-blue-100 whitespace-nowrap">
                                                    {clo.code}
                                                </span>
                                            </TableCell>
                                            <TableCell className="align-top font-medium text-slate-800 text-xs">
                                                {clo.title}
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex flex-col gap-1">
                                                    {clo.type && <span className="text-[10px] uppercase font-bold text-slate-500">{clo.type}</span>}
                                                    {clo.level && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded w-fit">{clo.level}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs align-top max-w-sm">
                                                {clo.description}
                                            </TableCell>
                                            <TableCell className="text-right align-top">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(clo)}>
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => handleDelete(clo.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 border border-dashed rounded-lg bg-slate-50/30">
                            <List className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">No CLOs defined yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Manual Form Dialog */}
            <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit CLO' : 'Create New CLO'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                        {/* Left Col: Basic Info */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Code</label>
                                <Input value={formData.code} readOnly className="bg-slate-50 font-mono text-xs" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Communication Skills"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the learning outcome..."
                                    rows={5}
                                />
                            </div>
                        </div>

                        {/* Right Col: OBE Mapping */}
                        <div className="space-y-4 border-l pl-6">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <CheckSquare size={16} className="text-blue-600" /> OBE Mapping
                            </h3>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Domain Type</label>
                                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cognitive">Cognitive (Knowledge)</SelectItem>
                                        <SelectItem value="Psychomotor">Psychomotor (Skills)</SelectItem>
                                        <SelectItem value="Affective">Affective (Attitude)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Bloom's Level</label>
                                <Select value={formData.level} onValueChange={(val) => setFormData({ ...formData, level: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="C1">C1 - Remember</SelectItem>
                                        <SelectItem value="C2">C2 - Understand</SelectItem>
                                        <SelectItem value="C3">C3 - Apply</SelectItem>
                                        <SelectItem value="C4">C4 - Analyze</SelectItem>
                                        <SelectItem value="C5">C5 - Evaluate</SelectItem>
                                        <SelectItem value="C6">C6 - Create</SelectItem>
                                        <SelectItem value="P1">P1 - Perception</SelectItem>
                                        <SelectItem value="P2">P2 - Set</SelectItem>
                                        <SelectItem value="P3">P3 - Guided Response</SelectItem>
                                        <SelectItem value="P4">P4 - Mechanism</SelectItem>
                                        <SelectItem value="P5">P5 - Complex Overt Response</SelectItem>
                                        <SelectItem value="A1">A1 - Receiving</SelectItem>
                                        <SelectItem value="A2">A2 - Responding</SelectItem>
                                        <SelectItem value="A3">A3 - Valuing</SelectItem>
                                        <SelectItem value="A4">A4 - Organizing</SelectItem>
                                        <SelectItem value="A5">A5 - Characterizing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Map to PLO</label>
                                <Select value={formData.plo_id} onValueChange={(val) => setFormData({ ...formData, plo_id: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select PLO..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Mapping</SelectItem>
                                        {plos.map(plo => (
                                            <SelectItem key={plo.id} value={plo.id}>
                                                PLO-{plo.plo_number}: {plo.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setManualDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Create CLO'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CSV Preview Dialog (Re-used) */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Review Import Data</DialogTitle>
                        <DialogDescription>
                            {hasErrors ?
                                <span className="text-red-500 flex items-center gap-1"><AlertCircle size={14} /> Fix or remove invalid rows.</span> :
                                `Found ${previewData.length} valid records.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto border rounded-md my-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewData.map((row) => (
                                    <TableRow key={row._id} className={!row.isValid ? "bg-red-50" : ""}>
                                        <TableCell className="font-medium text-xs">{row.title || <span className="text-red-400 italic">Missing</span>}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{row.description}</TableCell>
                                        <TableCell>
                                            {row.isValid ? <span className="text-green-600 text-xs font-bold">Valid</span> : <span className="text-red-600 text-xs font-bold">Invalid</span>}
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
        </div>
    );
}
