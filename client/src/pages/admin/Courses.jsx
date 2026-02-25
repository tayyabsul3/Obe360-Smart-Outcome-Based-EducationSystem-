import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle, Plus, Search, MoreHorizontal, Pencil, Trash2, FileText, BookOpen, FlaskConical, Clock, LayoutGrid, List, CheckSquare } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('GRID'); // GRID | LIST
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog States
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [deleteContext, setDeleteContext] = useState({ id: null, title: '' });

    // CSV Import State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [parsedData, setParsedData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [validationErrors, setValidationErrors] = useState(false);
    const fileInputRef = useRef(null);

    // Form State
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [creditHours, setCreditHours] = useState(3);
    const [labHours, setLabHours] = useState(0);

    // Metrics State
    const [stats, setStats] = useState({
        total: 0,
        labCourses: 0,
        totalCredits: 0,
        avgCredits: 0
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/courses');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCourses(data);

                // Calculate stats
                const total = data.length;
                const labCourses = data.filter(c => c.lab_hours > 0).length;
                const totalCredits = data.reduce((acc, c) => acc + (parseInt(c.credit_hours) || 0), 0);
                const avgCredits = total > 0 ? (totalCredits / total).toFixed(1) : 0;

                setStats({ total, labCourses, totalCredits, avgCredits });
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const payload = { title, code, credit_hours: creditHours, lab_hours: labHours };
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `http://localhost:5000/api/courses/${editingCourseId}` : 'http://localhost:5000/api/courses';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setOpen(false);
                fetchCourses();
                resetForm();
                toast.success(isEditing ? "Course technical data updated" : "Course successfully ingested");
            } else {
                toast.error("Operation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network synchronization error");
        }
    };

    const resetForm = () => {
        setTitle('');
        setCode('');
        setCreditHours(3);
        setLabHours(0);
        setIsEditing(false);
        setEditingCourseId(null);
    };

    const openEdit = (course) => {
        setIsEditing(true);
        setEditingCourseId(course.id);
        setTitle(course.title);
        setCode(course.code);
        setCreditHours(course.credit_hours);
        setLabHours(course.lab_hours);
        setOpen(true);
    };

    const initiateDelete = (course) => {
        setDeleteContext({ id: course.id, title: course.code });
        setDeleteAlertOpen(true);
    };

    const executeDelete = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/courses/${deleteContext.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(`${deleteContext.title} purged from catalog`);
                fetchCourses();
            } else {
                toast.error("Purge failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error during purge");
        } finally {
            setDeleteAlertOpen(false);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = "code,title,credit_hours,lab_hours\nCSC-101,Programming Fundamentals,3,3\nCSC-201,Data Structures,3,3";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'courses_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                if (data.length === 0) {
                    toast.error("CSV file is empty");
                    return;
                }

                let hasErrors = false;
                const sanitized = data.map(item => {
                    const isValid = item.code && item.title && item.credit_hours;
                    if (!isValid) hasErrors = true;

                    return {
                        ...item,
                        credit_hours: parseInt(item.credit_hours) || 3,
                        lab_hours: parseInt(item.lab_hours) || 0,
                        isValid
                    };
                });

                setValidationErrors(hasErrors);
                setParsedData(sanitized);
                setPreviewOpen(true);
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
            error: (err) => toast.error("CSV Parse Error", { description: err.message })
        });
    };

    const confirmImport = async () => {
        setImporting(true);
        try {
            const payload = parsedData.map(({ isValid, ...rest }) => rest);
            const res = await fetch('http://localhost:5000/api/courses/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courses: payload })
            });
            const result = await res.json();

            if (res.ok) {
                toast.success(`Imported ${result.length} course definitions`);
                setPreviewOpen(false);
                fetchCourses();
            } else {
                toast.error("Bulk ingestion failed", { description: result.error });
            }
        } catch (err) {
            toast.error("Sync Error", { description: err.message });
        } finally {
            setImporting(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statCards = [
        { label: 'Total Catalog', value: stats.total, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Lab Sessions', value: stats.labCourses, icon: FlaskConical, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Total Credits', value: stats.totalCredits, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Avg workload', value: stats.avgCredits, icon: LayoutGrid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Course Repository</h1>
                    <p className="text-sm text-slate-500 font-medium">Institutional master catalog for OBE-compliant curriculum.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white border-slate-200 shadow-sm" onClick={handleDownloadTemplate}>
                        <Download size={16} className="mr-2" /> Template
                    </Button>
                    <Button variant="outline" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white border-slate-200 shadow-sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} className="mr-2" /> Import CSV
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <Button className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all" onClick={() => { setIsEditing(false); resetForm(); setOpen(true); }}>
                        <Plus size={18} className="mr-2" /> Add Course
                    </Button>
                </div>
            </div>

            {/* Metrics dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <Card key={idx} className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                        <CardContent className="p-8 flex items-center gap-5">
                            <div className={cn("p-4 rounded-3xl transition-colors duration-500", stat.bg)}>
                                <stat.icon size={28} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <Input
                        placeholder="Filter by code or title..."
                        className="h-14 pl-12 rounded-[1.5rem] border-slate-100 bg-white ring-0 focus-visible:ring-0 shadow-sm text-slate-700 font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <Button
                        variant={viewMode === 'GRID' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('GRID')}
                        className={cn("h-10 w-10 rounded-xl", viewMode === 'GRID' ? "bg-white shadow-sm" : "")}
                    >
                        <LayoutGrid size={18} />
                    </Button>
                    <Button
                        variant={viewMode === 'LIST' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('LIST')}
                        className={cn("h-10 w-10 rounded-xl", viewMode === 'LIST' ? "bg-white shadow-sm" : "")}
                    >
                        <List size={18} />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />)}
                </div>
            ) : filteredCourses.length > 0 ? (
                viewMode === 'GRID' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map(course => (
                            <Card key={course.id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white">
                                <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between bg-slate-50/50">
                                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-blue-600 text-xl border border-slate-100 uppercase">
                                        {course.code.slice(0, 2)}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-white shadow-sm">
                                                <MoreHorizontal size={20} className="text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-2xl border-slate-100">
                                            <DropdownMenuItem onClick={() => openEdit(course)} className="rounded-xl h-11 font-bold text-slate-700">
                                                <Pencil size={16} className="mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => initiateDelete(course)} className="rounded-xl h-11 font-bold text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50">
                                                <Trash2 size={16} className="mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 leading-tight tracking-tight line-clamp-2 min-h-[3rem]">{course.title}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 rounded-full px-3 py-1 font-black tracking-tighter uppercase text-[10px]">{course.code}</Badge>
                                                {course.lab_hours > 0 && <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-0 rounded-full px-3 py-1 font-black tracking-tighter uppercase text-[10px]">Applied Lab</Badge>}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                    <Clock size={12} className="text-slate-300" /> {course.credit_hours} Cr
                                                </div>
                                                {course.lab_hours > 0 && (
                                                    <div className="flex items-center gap-1.5 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                        <FlaskConical size={12} className="text-slate-300" /> {course.lab_hours} Lab
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-b border-slate-100 hover:bg-transparent h-16">
                                    <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course Definition</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hours (L+P)</TableHead>
                                    <TableHead className="pr-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCourses.map(course => (
                                    <TableRow key={course.id} className="hover:bg-blue-50/20 border-b border-slate-50 transition-colors h-20 group">
                                        <TableCell className="pl-10 font-black text-blue-600">{course.code}</TableCell>
                                        <TableCell className="font-bold text-slate-800">{course.title}</TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {course.credit_hours} Theory + {course.lab_hours} Lab
                                            </span>
                                        </TableCell>
                                        <TableCell className="pr-10 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white shadow-sm" onClick={() => openEdit(course)}>
                                                    <Pencil size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-500 shadow-sm" onClick={() => initiateDelete(course)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )
            ) : (
                <div className="py-32 text-center space-y-4 bg-white rounded-[3rem] shadow-sm border border-slate-50">
                    <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                        <Search size={32} className="text-slate-300" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-1">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Catalog is Empty</h3>
                        <p className="text-sm text-slate-500 font-medium">Use add course or import CSV to start your repository.</p>
                    </div>
                </div>
            )}

            {/* MODALS */}

            {/* 1. Manual Entry / Modulation Dialog */}
            <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
                <DialogContent className="max-w-lg rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                            {isEditing ? 'Edit Course' : 'Add Course'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">Enter course details for institutional records.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-6 mt-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Serial Code</Label>
                                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CSC-101" required className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Canonical Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Structures & Algorithms" required className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Theory Credits</Label>
                                    <Input type="number" value={creditHours} onChange={(e) => setCreditHours(e.target.value)} required className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lab Credits</Label>
                                    <Input type="number" value={labHours} onChange={(e) => setLabHours(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold" />
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all">
                            {isEditing ? 'SAVE' : 'ADD'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 2. Bulk Preview Interface */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden">
                    <div className="p-10 pb-6 border-b bg-slate-50/50">
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Bulk Import Preview</DialogTitle>
                        <DialogDescription className="mt-2">
                            {validationErrors ?
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest border border-red-100 mt-2">
                                    <AlertCircle size={14} /> Validation Breach: Review red cells
                                </span> :
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest border border-green-100 mt-2">
                                    <CheckSquare size={14} /> Integrity Pass: {parsedData.length} course definitions ready
                                </span>
                            }
                        </DialogDescription>
                    </div>
                    <div className="flex-1 overflow-auto p-10 pt-6">
                        <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-100 h-14 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course Definition</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cr (Theo+Lab)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, i) => (
                                        <TableRow key={i} className={cn("hover:bg-slate-50/20 border-b border-slate-50", !row.isValid ? "bg-red-50/50" : "")}>
                                            <TableCell className="font-black text-slate-700">{row.code || 'NULL'}</TableCell>
                                            <TableCell className="font-bold text-slate-700">{row.title || 'NULL'}</TableCell>
                                            <TableCell className="font-bold text-slate-500">{row.credit_hours} + {row.lab_hours}</TableCell>
                                            <TableCell>
                                                {row.isValid ?
                                                    <span className="text-[9px] font-black uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">Valid</span> :
                                                    <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">Invalid</span>
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div className="p-10 pt-6 border-t bg-slate-50/50 flex justify-end gap-3 px-10">
                        <Button variant="ghost" className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest" onClick={() => setPreviewOpen(false)}>Cancel</Button>
                        <Button onClick={confirmImport} disabled={importing || validationErrors} className="rounded-2xl h-12 px-10 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10">
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 3. Delete Mitigation Protocol */}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            Confirm the permanent removal of <strong>{deleteContext.title}</strong> from the institutional repository.
                            This action will break references in all existing Study Plans and Academic Allocations.
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
        </div>
    );
}
