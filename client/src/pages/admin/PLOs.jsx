import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import useLoaderStore from '@/store/loaderStore';
import {
    ArrowRight,
    Download,
    FileSpreadsheet,
    GitMerge,
    Pencil,
    Plus,
    Search,
    Target,
    Trash2,
    Upload,
} from 'lucide-react';

const PLO_TITLE_PATTERN = /^PLO-\d+$/;

export default function PLOs() {
    const { showLoader, hideLoader } = useLoaderStore();
    const ploFileRef = useRef(null);

    const [programs, setPrograms] = useState([]);
    const [programLoading, setProgramLoading] = useState(true);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [programSearch, setProgramSearch] = useState('');

    const [plos, setPlos] = useState([]);
    const [ploLoading, setPloLoading] = useState(false);
    const [selectedPlos, setSelectedPlos] = useState([]);

    const [createTitle, setCreateTitle] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editingPlo, setEditingPlo] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteContext, setDeleteContext] = useState({ type: null, ids: [], title: '' });

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [hasErrors, setHasErrors] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchPrograms();
    }, []);

    useEffect(() => {
        if (!selectedProgram && programs.length > 0) {
            setSelectedProgram(programs[0]);
        }
    }, [programs, selectedProgram]);

    useEffect(() => {
        if (!selectedProgram) {
            setPlos([]);
            setSelectedPlos([]);
            return;
        }

        fetchPLOs(selectedProgram.id);
    }, [selectedProgram]);

    const filteredPrograms = useMemo(() => {
        const query = programSearch.trim().toLowerCase();
        if (!query) return programs;

        return programs.filter((program) =>
            program.title.toLowerCase().includes(query) ||
            program.code.toLowerCase().includes(query)
        );
    }, [programSearch, programs]);

    const totalPloCount = useMemo(
        () => plos.length,
        [plos]
    );

    const fetchPrograms = async () => {
        setProgramLoading(true);
        try {
            const response = await fetch('/api/programs');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load programs');
            }
            setPrograms(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load programs');
        } finally {
            setProgramLoading(false);
        }
    };

    const fetchPLOs = async (programId) => {
        setPloLoading(true);
        try {
            const response = await fetch(`/api/programs/${programId}/plos`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load PLOs');
            }
            setPlos(data);
            setSelectedPlos([]);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load PLOs');
        } finally {
            setPloLoading(false);
        }
    };

    const resetCreateForm = () => {
        setCreateTitle('');
        setCreateDescription('');
    };

    const validatePloTitle = (title) => {
        if (!PLO_TITLE_PATTERN.test(title)) {
            toast.error('Invalid PLO title', {
                description: "Use the format 'PLO-1', 'PLO-2', and so on.",
            });
            return false;
        }

        return true;
    };

    const handleCreatePlo = async (event) => {
        event.preventDefault();
        if (!selectedProgram || !validatePloTitle(createTitle)) return;

        showLoader();
        try {
            const response = await fetch('/api/programs/plos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: selectedProgram.id,
                    title: createTitle,
                    description: createDescription,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create PLO');
            }

            toast.success('PLO created');
            setCreateOpen(false);
            resetCreateForm();
            fetchPLOs(selectedProgram.id);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to create PLO');
        } finally {
            hideLoader();
        }
    };

    const openEditDialog = (plo) => {
        setEditingPlo(plo);
        setEditTitle(plo.title);
        setEditDescription(plo.description || '');
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingPlo || !validatePloTitle(editTitle)) return;

        showLoader();
        try {
            const response = await fetch(`/api/programs/plos/${editingPlo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDescription,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update PLO');
            }

            toast.success('PLO updated');
            setEditOpen(false);
            setEditingPlo(null);
            fetchPLOs(selectedProgram.id);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to update PLO');
        } finally {
            hideLoader();
        }
    };

    const openDeleteDialog = (plo) => {
        setDeleteContext({
            type: 'single',
            ids: [plo.id],
            title: plo.title,
        });
        setDeleteOpen(true);
    };

    const openBulkDeleteDialog = () => {
        if (selectedPlos.length === 0) return;
        setDeleteContext({
            type: 'bulk',
            ids: selectedPlos,
            title: `${selectedPlos.length} PLOs`,
        });
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedProgram || deleteContext.ids.length === 0) return;

        showLoader();
        try {
            const deletions = deleteContext.ids.map((id) =>
                fetch(`/api/programs/plos/${id}`, { method: 'DELETE' })
            );
            const responses = await Promise.all(deletions);
            const failed = responses.find((response) => !response.ok);

            if (failed) {
                const data = await failed.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete PLO');
            }

            toast.success(deleteContext.type === 'bulk' ? 'PLOs deleted' : 'PLO deleted');
            setDeleteOpen(false);
            setSelectedPlos([]);
            fetchPLOs(selectedProgram.id);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to delete PLO');
        } finally {
            hideLoader();
        }
    };

    const togglePloSelection = (id) => {
        setSelectedPlos((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const toggleAllPlos = () => {
        if (selectedPlos.length === plos.length) {
            setSelectedPlos([]);
            return;
        }

        setSelectedPlos(plos.map((plo) => plo.id));
    };

    const removePreviewRow = (id) => {
        const nextData = previewData.filter((row) => row._id !== id);
        setPreviewData(nextData);
        setHasErrors(nextData.some((row) => !row.isValid));
        if (nextData.length === 0) {
            setPreviewOpen(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file || !selectedProgram) return;

        showLoader();
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data.map((item) => {
                    const title = `${item.title || ''}`.trim();
                    const description = `${item.description || ''}`.trim();
                    const isValid = PLO_TITLE_PATTERN.test(title);
                    return {
                        title,
                        description,
                        isValid,
                        _id: `${title}-${description}-${Math.random()}`,
                    };
                });

                if (rows.length === 0) {
                    toast.error('CSV file is empty');
                    hideLoader();
                    return;
                }

                setPreviewData(rows);
                setHasErrors(rows.some((row) => !row.isValid));
                setPreviewOpen(true);
                if (ploFileRef.current) {
                    ploFileRef.current.value = '';
                }
                hideLoader();
            },
            error: (error) => {
                console.error(error);
                hideLoader();
                toast.error('Failed to parse CSV');
            },
        });
    };

    const confirmImport = async () => {
        if (!selectedProgram) return;

        const payload = previewData
            .filter((row) => row.isValid)
            .map(({ title, description }) => ({ title, description }));

        if (payload.length === 0) {
            toast.error('No valid PLO rows to import');
            return;
        }

        setImporting(true);
        showLoader();
        try {
            const response = await fetch('/api/programs/plos/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: selectedProgram.id,
                    plos: payload,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to import PLOs');
            }

            toast.success('PLO import completed');
            setPreviewOpen(false);
            setPreviewData([]);
            fetchPLOs(selectedProgram.id);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to import PLOs');
        } finally {
            setImporting(false);
            hideLoader();
        }
    };

    const downloadTemplate = () => {
        const content = 'title,description\nPLO-1,Apply engineering knowledge to solve domain problems';
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'plos_template.csv';
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">PLO Module</h1>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Program learning outcomes management workspace
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="rounded-full" onClick={downloadTemplate}>
                        <Download size={14} className="mr-2" /> Template
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => ploFileRef.current?.click()}
                        disabled={!selectedProgram}
                    >
                        <Upload size={14} className="mr-2" /> Import CSV
                    </Button>
                    <Button className="rounded-full bg-blue-600 hover:bg-blue-700" onClick={() => setCreateOpen(true)} disabled={!selectedProgram}>
                        <Plus size={14} className="mr-2" /> Add PLO
                    </Button>
                    <input
                        ref={ploFileRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-2xl bg-blue-50 p-3">
                            <Target size={22} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selected Program</p>
                            <p className="text-lg font-black text-slate-900">{selectedProgram?.code || '--'}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-2xl bg-emerald-50 p-3">
                            <GitMerge size={22} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active PLOs</p>
                            <p className="text-lg font-black text-slate-900">{totalPloCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-2xl bg-amber-50 p-3">
                            <FileSpreadsheet size={22} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Programs</p>
                            <p className="text-lg font-black text-slate-900">{programs.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="rounded-2xl bg-rose-50 p-3">
                            <Trash2 size={22} className="text-rose-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selected</p>
                            <p className="text-lg font-black text-slate-900">{selectedPlos.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="space-y-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight text-slate-900">Programs</CardTitle>
                            <p className="text-sm text-slate-500">Choose a degree program before managing outcomes.</p>
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={programSearch}
                                onChange={(event) => setProgramSearch(event.target.value)}
                                placeholder="Search by code or title"
                                className="h-12 rounded-2xl pl-11"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {programLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-20 rounded-2xl" />
                            ))
                        ) : filteredPrograms.length > 0 ? (
                            filteredPrograms.map((program) => (
                                <button
                                    key={program.id}
                                    type="button"
                                    onClick={() => setSelectedProgram(program)}
                                    className={cn(
                                        'w-full rounded-2xl border p-4 text-left transition-all',
                                        selectedProgram?.id === program.id
                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{program.title}</p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                {program.code}
                                            </p>
                                        </div>
                                        <ArrowRight size={16} className={selectedProgram?.id === program.id ? 'text-blue-600' : 'text-slate-300'} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                                No programs match the current search.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-col gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                                {selectedProgram ? `${selectedProgram.title} Outcomes` : 'Program Outcomes'}
                            </CardTitle>
                            <p className="mt-1 text-sm text-slate-500">
                                Create, edit, import, and remove PLO records for the selected program.
                            </p>
                        </div>
                        {selectedPlos.length > 0 && (
                            <Button variant="destructive" className="rounded-full" onClick={openBulkDeleteDialog}>
                                <Trash2 size={14} className="mr-2" /> Delete Selected
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-6">
                        {!selectedProgram ? (
                            <div className="rounded-3xl border border-dashed border-slate-200 px-6 py-16 text-center">
                                <p className="text-lg font-black text-slate-800">Select a program</p>
                                <p className="mt-2 text-sm text-slate-500">PLO screens activate once a program is selected.</p>
                            </div>
                        ) : ploLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <Skeleton key={index} className="h-28 rounded-3xl" />
                                ))}
                            </div>
                        ) : plos.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <Checkbox
                                        checked={selectedPlos.length === plos.length}
                                        onCheckedChange={toggleAllPlos}
                                    />
                                    <span className="text-sm font-bold text-slate-600">Select all outcomes</span>
                                </div>
                                {plos.map((plo) => (
                                    <div
                                        key={plo.id}
                                        className={cn(
                                            'flex gap-4 rounded-3xl border p-5 transition-all',
                                            selectedPlos.includes(plo.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 bg-white'
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedPlos.includes(plo.id)}
                                            onCheckedChange={() => togglePloSelection(plo.id)}
                                            className="mt-1"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                                                    PLO-{plo.plo_number}
                                                </span>
                                                <h3 className="text-lg font-black text-slate-900">{plo.title}</h3>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {plo.description || 'No description provided yet.'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 self-start">
                                            <Button variant="outline" size="icon" className="rounded-2xl" onClick={() => openEditDialog(plo)}>
                                                <Pencil size={14} />
                                            </Button>
                                            <Button variant="outline" size="icon" className="rounded-2xl text-red-600" onClick={() => openDeleteDialog(plo)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-200 px-6 py-16 text-center">
                                <p className="text-lg font-black text-slate-800">No PLOs defined</p>
                                <p className="mt-2 text-sm text-slate-500">Create the first outcome or import them from CSV.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-xl rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Add PLO</DialogTitle>
                        <DialogDescription>
                            Outcome will be added to {selectedProgram?.title || 'the selected program'}.
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-5" onSubmit={handleCreatePlo}>
                        <div className="space-y-2">
                            <Label>PLO Title</Label>
                            <Input
                                value={createTitle}
                                onChange={(event) => setCreateTitle(event.target.value)}
                                placeholder="PLO-1"
                                className="h-12 rounded-2xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={createDescription}
                                onChange={(event) => setCreateDescription(event.target.value)}
                                placeholder="Describe the outcome expectation"
                                rows={5}
                                className="rounded-2xl"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" className="rounded-full" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>
                                Cancel
                            </Button>
                            <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700">
                                Create PLO
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-xl rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Edit PLO</DialogTitle>
                        <DialogDescription>Update title and description for the selected outcome.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label>PLO Title</Label>
                            <Input
                                value={editTitle}
                                onChange={(event) => setEditTitle(event.target.value)}
                                placeholder="PLO-1"
                                className="h-12 rounded-2xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={editDescription}
                                onChange={(event) => setEditDescription(event.target.value)}
                                rows={5}
                                className="rounded-2xl"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" className="rounded-full bg-blue-600 hover:bg-blue-700" onClick={handleSaveEdit}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-3xl rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Import Preview</DialogTitle>
                        <DialogDescription>
                            Review rows before importing outcomes into {selectedProgram?.title}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {previewData.map((row) => (
                            <div
                                key={row._id}
                                className={cn(
                                    'flex items-start justify-between gap-4 rounded-2xl border p-4',
                                    row.isValid ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50'
                                )}
                            >
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900">{row.title || 'Missing title'}</p>
                                    <p className="mt-1 text-sm text-slate-600">{row.description || 'No description'}</p>
                                    {!row.isValid && (
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                                            Title must match `PLO-number`
                                        </p>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => removePreviewRow(row._id)}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <div className="mr-auto text-sm text-slate-500">
                            {hasErrors ? 'Invalid rows remain and will be skipped.' : 'All rows are valid.'}
                        </div>
                        <Button type="button" variant="outline" className="rounded-full" onClick={() => setPreviewOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" className="rounded-full bg-blue-600 hover:bg-blue-700" onClick={confirmImport} disabled={importing}>
                            {importing ? 'Importing...' : 'Confirm Import'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="rounded-[2rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black">Delete PLO</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteContext.type === 'bulk'
                                ? `Delete ${deleteContext.title} from ${selectedProgram?.title}.`
                                : `Delete ${deleteContext.title} from ${selectedProgram?.title}.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="rounded-full bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
