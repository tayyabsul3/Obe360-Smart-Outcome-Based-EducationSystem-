import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, List, FileSpreadsheet, Upload, Download, FileText, AlertCircle, X, CheckSquare, Loader2, GitMerge, Settings2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import useLoaderStore from '@/store/loaderStore';
import { cn } from '@/lib/utils';

export default function CLOManager() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoaderStore();

    // Data State
    const [clos, setClos] = useState([]);
    const [availablePlos, setAvailablePlos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
    const [manualDialogOpen, setManualDialogOpen] = useState(false);

    // Workflow State: 1 = CLO Info, 2 = PLO Mapping
    const [stage, setStage] = useState(1);

    // Edit/Create State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'Cognitive',
        is_active: true,
        // Mapping fields
        plo_id: 'none',
        learning_type: 'Cognitive',
        level: 'C1',
        emphasis_level: 'Medium'
    });

    useEffect(() => {
        if (courseId) {
            fetchCLOs();
            fetchAvailablePlos();
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

    const fetchAvailablePlos = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/programs/plos/course/${courseId}`);
            if (res.ok) setAvailablePlos(await res.json());
        } catch (error) {
            console.error("Failed to load PLOs:", error);
        }
    };

    const openCreate = () => {
        setFormData({
            code: `CLO-${clos.length + 1}`,
            description: '',
            type: 'Cognitive',
            is_active: true,
            plo_id: 'none',
            learning_type: 'Cognitive',
            level: 'C1',
            emphasis_level: 'Medium'
        });
        setEditingId(null);
        setStage(1);
        setChoiceDialogOpen(false);
        setManualDialogOpen(true);
    };

    const handleEditCLOInfo = (clo) => {
        setEditingId(clo.id);
        setFormData({
            ...formData,
            code: clo.code,
            description: clo.description,
            type: clo.type || 'Cognitive',
            is_active: clo.is_active ?? true,
        });
        setStage(1);
        setManualDialogOpen(true);
    };

    const handleEditMapping = async (clo) => {
        setEditingId(clo.id);
        setStage(2);

        // Fetch current mapping for this CLO
        try {
            const res = await fetch(`http://localhost:5000/api/clos/${clo.id}/mapping`);
            if (res.ok) {
                const mapping = await res.json();
                if (mapping && mapping.length > 0) {
                    const m = mapping[0]; // Assuming 1-to-1 for this UI simplified view
                    setFormData({
                        ...formData,
                        code: clo.code,
                        description: clo.description,
                        plo_id: m.plo_id,
                        learning_type: m.learning_type || clo.type || 'Cognitive',
                        level: m.level || 'C1',
                        emphasis_level: m.emphasis_level || 'Medium'
                    });
                } else {
                    setFormData({
                        ...formData,
                        code: clo.code,
                        description: clo.description,
                        plo_id: 'none',
                        learning_type: clo.type || 'Cognitive',
                        level: 'C1',
                        emphasis_level: 'Medium'
                    });
                }
            }
        } catch (error) {
            console.error(error);
        }

        setManualDialogOpen(true);
    };

    const handleSave = async (shouldMap = false) => {
        if (!formData.code || !formData.description) {
            return toast.warning("Code and Description are required");
        }

        if (stage === 1 && shouldMap) {
            setStage(2);
            return;
        }

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
                toast.success("Saved Successfully");
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

    const taxonomyLevels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'A1', 'A2', 'A3', 'A4', 'A5'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#337AB7] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <List size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">CLOs Manager</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Course Learning Outcomes & PLO Mapping</p>
                    </div>
                </div>
                <Button onClick={() => setChoiceDialogOpen(true)} className="gap-2 bg-[#337AB7] hover:bg-[#286090] h-11 px-6 rounded-xl font-bold">
                    <Plus size={18} /> Add New CLO
                </Button>
            </div>

            {/* List Section */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <List size={16} /> Defined Outcomes ({clos.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    ) : clos.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[120px] font-bold text-slate-700 pl-6">CODE</TableHead>
                                    <TableHead className="font-bold text-slate-700">DESCRIPTION</TableHead>
                                    <TableHead className="w-[120px] font-bold text-slate-700">TYPE</TableHead>
                                    <TableHead className="w-[100px] font-bold text-slate-700">STATUS</TableHead>
                                    <TableHead className="text-right w-[150px] font-bold text-slate-700 pr-6">EDIT INFO / PLO</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clos.map((clo) => (
                                    <TableRow key={clo.id} className="hover:bg-slate-50/30 group transition-colors">
                                        <TableCell className="font-black text-blue-600 pl-6">{clo.code}</TableCell>
                                        <TableCell className="text-sm text-slate-600 font-medium leading-relaxed py-4">{clo.description}</TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
                                                {clo.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn("h-2 w-2 rounded-full", clo.is_active ? "bg-green-500" : "bg-slate-300")} />
                                                <span className={cn("text-[10px] font-black uppercase tracking-wider", clo.is_active ? "text-green-600" : "text-slate-400")}>
                                                    {clo.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg border-slate-200 text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleEditCLOInfo(clo)}
                                                    title="Edit CLO Info"
                                                >
                                                    <Info size={14} className="stroke-[3]" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg border-slate-200 text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => handleEditMapping(clo)}
                                                    title="Edit PLO Mapping"
                                                >
                                                    <GitMerge size={14} className="stroke-[3]" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg border-slate-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(clo.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-b-2xl">
                            <List className="h-16 w-16 mx-auto mb-6 text-slate-100 stroke-[1]" />
                            <p className="font-black text-slate-300 uppercase tracking-widest text-sm">Course has no outcomes yet</p>
                            <Button variant="link" className="text-blue-600 mt-2 font-bold" onClick={openCreate}>Create the first CLO</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Workflow Modal */}
            <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
                <DialogContent className="sm:max-w-[650px] p-0 border-0 shadow-2xl overflow-hidden rounded-3xl">
                    <DialogHeader className="p-6 bg-[#337AB7] text-white">
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                            <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                {stage}/2
                            </span>
                            {stage === 1
                                ? (editingId ? 'UPDATE COURSE LEARNING OUTCOME' : 'CREATE COURSE LEARNING OUTCOME')
                                : 'MAP CLO TO PROGRAM LEARNING OUTCOME'
                            }
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">
                            {stage === 1 ? 'Step 1: CLO Information' : 'Step 2: PLO Mapping Configuration'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 bg-white">
                        {stage === 1 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-8 flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CLO Code *</label>
                                        <Input
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="e.g. CLO-1"
                                            className="h-12 bg-slate-50 border-0 rounded-xl font-black text-blue-800 focus-visible:ring-blue-500/20"
                                        />
                                    </div>
                                    <div className="col-span-4 flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active *</label>
                                        <div className="h-12 px-4 bg-slate-50 rounded-xl flex items-center gap-3 cursor-pointer" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                                            <Checkbox
                                                checked={formData.is_active}
                                                onCheckedChange={(val) => setFormData({ ...formData, is_active: val })}
                                                className="h-5 w-5 rounded-md border-slate-300"
                                            />
                                            <span className={cn("text-xs font-black uppercase transition-colors", formData.is_active ? "text-green-600" : "text-slate-400")}>
                                                {formData.is_active ? 'ENABLED' : 'DISABLED'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outcome Description *</label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter the learning outcome details..."
                                        rows={5}
                                        className="bg-slate-50 border-0 rounded-xl text-sm font-medium resize-none focus-visible:ring-blue-500/20 p-4"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Learning Type</label>
                                        <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                            <SelectTrigger className="h-12 bg-slate-50 border-0 rounded-xl font-black text-xs uppercase tracking-widest">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                <SelectItem value="Cognitive" className="font-bold text-xs uppercase">Cognitive</SelectItem>
                                                <SelectItem value="Psychomotor" className="font-bold text-xs uppercase">Psychomotor</SelectItem>
                                                <SelectItem value="Affective" className="font-bold text-xs uppercase">Affective</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <p className="text-[9px] text-slate-400 font-bold italic px-2">* Required fields must be completed before saving.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                                        <Info size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Mapping Focus</p>
                                        <p className="text-sm font-black text-blue-900 mt-1">{formData.code} — {formData.description.substring(0, 60)}...</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Program Learning Outcome (PLO) *</label>
                                    <Select value={formData.plo_id} onValueChange={(val) => setFormData({ ...formData, plo_id: val })}>
                                        <SelectTrigger className="h-14 bg-slate-50 border-0 rounded-2xl font-bold text-sm">
                                            <SelectValue placeholder="Choose PLO..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl max-h-[300px]">
                                            <SelectItem value="none" className="font-bold text-slate-400">NOT MAPPED</SelectItem>
                                            {availablePlos.map(plo => (
                                                <SelectItem key={plo.id} value={plo.id} className="py-3 px-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-black text-blue-700 uppercase tracking-tighter">PLO-{plo.plo_number}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{plo.description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxonomy Level</label>
                                        <Select value={formData.level} onValueChange={(val) => setFormData({ ...formData, level: val })}>
                                            <SelectTrigger className="h-12 bg-slate-50 border-0 rounded-xl font-black text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {taxonomyLevels.map(lvl => (
                                                    <SelectItem key={lvl} value={lvl} className="font-bold text-xs">{lvl}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emphasis Level</label>
                                        <Select value={formData.emphasis_level} onValueChange={(val) => setFormData({ ...formData, emphasis_level: val })}>
                                            <SelectTrigger className="h-12 bg-slate-50 border-0 rounded-xl font-black text-xs uppercase tracking-widest">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Low" className="font-bold text-xs uppercase">Low</SelectItem>
                                                <SelectItem value="Medium" className="font-bold text-xs uppercase">Medium</SelectItem>
                                                <SelectItem value="High" className="font-bold text-xs uppercase">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Learning Type</label>
                                        <Select value={formData.learning_type} onValueChange={(val) => setFormData({ ...formData, learning_type: val })}>
                                            <SelectTrigger className="h-12 bg-slate-50 border-0 rounded-xl font-black text-xs uppercase tracking-widest">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Cognitive" className="font-bold text-xs uppercase text-blue-600">Cognitive</SelectItem>
                                                <SelectItem value="Psychomotor" className="font-bold text-xs uppercase text-purple-600">Psychomotor</SelectItem>
                                                <SelectItem value="Affective" className="font-bold text-xs uppercase text-orange-600">Affective</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between sm:justify-between px-8">
                        {stage === 1 ? (
                            <>
                                <Button variant="ghost" onClick={() => setManualDialogOpen(false)} className="font-black text-[10px] uppercase tracking-widest h-10 px-6">Discard</Button>
                                <div className="flex gap-3">
                                    <Button onClick={() => handleSave(false)} variant="outline" className="border-2 border-[#337AB7] text-[#337AB7] hover:bg-[#337AB7] hover:text-white font-black text-[10px] uppercase tracking-widest h-10 px-8 rounded-xl transition-all">
                                        SAVE CLO ONLY
                                    </Button>
                                    <Button onClick={() => handleSave(true)} className="bg-[#337AB7] hover:bg-[#286090] font-black text-[10px] uppercase tracking-widest h-10 px-8 rounded-xl shadow-lg shadow-blue-100">
                                        SAVE & MAP PLO
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => setStage(1)} className="font-black text-[10px] uppercase tracking-widest h-10 px-6">Back to Info</Button>
                                <Button onClick={() => handleSave(false)} className="bg-[#337AB7] hover:bg-[#286090] font-black text-[10px] uppercase tracking-widest h-10 px-12 rounded-xl shadow-lg shadow-blue-100">
                                    SAVE CONFIGURATION
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Choice Modal */}
            <Dialog open={choiceDialogOpen} onOpenChange={setChoiceDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8 border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">ADD CLO</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Choose your preferred entry method</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-10">
                        <button
                            className="flex flex-col items-center gap-4 p-8 bg-slate-50 border-2 border-transparent rounded-3xl hover:border-[#337AB7] hover:bg-blue-50/50 transition-all text-[#337AB7] group"
                            onClick={openCreate}
                        >
                            <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText size={32} />
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest">Manual Entry</span>
                        </button>
                        <div className="flex flex-col items-center gap-4 p-8 bg-slate-50 border-2 border-transparent rounded-3xl hover:border-green-600 hover:bg-green-50/50 transition-all text-green-600 group relative">
                            <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={32} />
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest">Import CSV</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
