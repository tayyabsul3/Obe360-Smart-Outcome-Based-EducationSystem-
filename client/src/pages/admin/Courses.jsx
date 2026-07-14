import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
    Download, Upload, FileSpreadsheet, Loader2, AlertCircle, Plus, Search, 
    MoreHorizontal, Pencil, Trash2, BookOpen, FlaskConical, Clock, 
    LayoutGrid, List, CheckSquare, ChevronLeft, ChevronRight, Filter, Database
} from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Predefined BSCS Template CSV Content (70 canonical courses)
const DEFAULT_BSCS_CSV = `code,title,credit_hours,lab_hours
CSC-100,Application of Information & Communication Technologies,3,3
CSC-101,Programming Fundamentals,4,3
CSC-110,Discrete Structures,3,0
MTH-101,Calculus and Analytic Geometry,3,0
ENG-102,Functional English,3,0
CSC-102,Object Oriented Programming,4,3
CSC-103,Database Systems,4,3
CSC-111,Digital Logic Design,3,3
MTH-102,Multivariable Calculus,3,0
STT-101,Probability & Statistics,3,0
CSC-201,Data Structures,4,3
CSC-202,Information Security,3,3
CSC-203,Artificial Intelligence,3,3
CSC-204,Computer Networks,3,3
CSC-205,Software Engineering,3,0
MTH-103,Linear Algebra,3,0
CSC-211,Computer Organization & Assembly Language,3,3
PHY-201,Applied Physics,3,3
ENG-201,Expository Writing,3,0
IS-201,Islamic Studies/Ethics,2,0
CSC-301,Operating Systems,3,3
CSC-302,Theory of Automata,3,0
CSC-303,Advance Database Management Systems,3,3
SSH-301,Introduction to Management,2,0
CSC-398,Internship,3,3
CSC-311,Computer Architecture,3,3
CSC-312,Compiler Construction,3,3
CSC-313,HCI & Computer Graphics,3,3
CSC-314,Parallel & Distributed Computing,3,3
CSC-498,Final Year Project – I,2,6
CSC-401,Analysis of Algorithms,3,0
MGT-351,Introduction to Marketing,3,0
ENG-401,Technical & Business Writing,3,0
SSH-401,Entrepreneurship,2,0
CSC-499,Final Year Project – II,4,12
SSH-402,Professional Practices,2,0
SSH-403,Civics and Community Engagement,2,0
SSH-404,Ideology and Constitution of Pakistan,2,0
CSC-251,Web Technologies,3,3
CSC-252,Advanced Programming,3,3
CSC-351,Web Engineering,3,3
CSC-352,Numerical Analysis,3,3
CSC-353,Mobile Application Development 1,3,3
CSC-354,Cyber Security,3,3
CSE-422,Software Testing & Quality Assurance,3,3
CSC-355,Cloud Computing,3,3
CSC-356,Computer Graphics,3,3
CSE-325,Object Oriented Analysis & Design,3,3
CSC-451,Mobile Application Development 2,3,3
CAI-261,Programming for AI,3,3
CAI-262,Machine Learning,3,3
CAI-361,Artificial Neural Networks & Deep Learning,3,3
CAI-362,Knowledge Representation & Reasoning,3,3
CAI-363,Computer Vision,3,3
CAI-364,Natural Language Processing,3,3
CAI-461,Reinforcement Learning,3,3
CAI-365,Fuzzy Systems,3,3
CAI-366,Swarm Intelligence,3,3
CAI-367,Agent Based Modeling,3,3
CAI-462,Speech Processing,3,3
MGT-322,Financial Accounting,3,0
FMPE-580,Precision Agriculture,3,1
LWCE-601,GIS & Remote Sensing,2,1
MTH-001,Pre-Calculus I,3,0
MTH-002,Pre-Calculus II,3,0
TOQ-101,Translation of Quran I,1,0
TOQ-102,Translation of Quran II,1,0
TOQ-201,Translation of Quran III,1,0
TOQ-301,Translation of Quran IV,1,0`;

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('GRID'); // GRID | LIST
    const [searchQuery, setSearchQuery] = useState('');
    
    // Checkbox selection state
    const [selectedIds, setSelectedIds] = useState([]);

    // Filter states
    const [creditFilter, setCreditFilter] = useState('ALL');
    const [labFilter, setLabFilter] = useState('ALL');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Dialog States
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false);
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
        setSelectedIds([]); // Clear selections on refresh
        try {
            const res = await fetch('/api/courses');
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
        const url = isEditing ? `/api/courses/${editingCourseId}` : '/api/courses';

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
                toast.success(isEditing ? "Course details updated" : "Course successfully ingested");
            } else {
                const errData = await res.json();
                toast.error("Operation failed", { description: errData.error || "Unknown error" });
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
            const res = await fetch(`/api/courses/${deleteContext.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${deleteContext.title} purged from catalog`);
                fetchCourses();
            } else {
                toast.error("Purge failed", { description: data.error });
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error during purge");
        } finally {
            setDeleteAlertOpen(false);
        }
    };

    // Bulk Delete Action Handler
    const executeBulkDelete = async () => {
        setBulkDeleteAlertOpen(false);
        setLoading(true);
        try {
            let successCount = 0;
            let failureCount = 0;
            let errors = [];

            for (const id of selectedIds) {
                const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                    successCount++;
                } else {
                    failureCount++;
                    errors.push(data.error || "Dependency check failed");
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully deleted ${successCount} courses`);
            }
            if (failureCount > 0) {
                toast.error(`Failed to delete ${failureCount} courses`, {
                    description: `Errors: ${[...new Set(errors)].join(', ')}`
                });
            }

            setSelectedIds([]);
            fetchCourses();
        } catch (error) {
            console.error(error);
            toast.error("Network error during bulk delete");
        } finally {
            setLoading(false);
        }
    };

    // Checkbox toggles
    const handleToggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (paginatedItems) => {
        const itemIds = paginatedItems.map(item => item.id);
        const allSelected = itemIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...itemIds])]);
        }
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([DEFAULT_BSCS_CSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'BSCS_curriculum_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info("BSCS Template CSV downloaded");
    };

    const handleLoadPredefinedTemplate = () => {
        Papa.parse(DEFAULT_BSCS_CSV, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const sanitized = data.map(item => ({
                    ...item,
                    credit_hours: parseInt(item.credit_hours) || 3,
                    lab_hours: parseInt(item.lab_hours) || 0,
                    isValid: true
                }));
                setValidationErrors(false);
                setParsedData(sanitized);
                setPreviewOpen(true);
            }
        });
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
            const res = await fetch('/api/courses/bulk', {
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

    // Filter Logic
    const filteredCourses = courses.filter(course => {
        const searchMatch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            course.code.toLowerCase().includes(searchQuery.toLowerCase());
        const creditMatch = creditFilter === 'ALL' || Number(course.credit_hours) === Number(creditFilter);
        const labMatch = labFilter === 'ALL' || 
                         (labFilter === 'LAB' && course.lab_hours > 0) || 
                         (labFilter === 'NO_LAB' && course.lab_hours === 0);
        return searchMatch && creditMatch && labMatch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, viewMode, creditFilter, labFilter]);

    const statCards = [
        { label: 'Total Catalog', value: stats.total, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Lab Sessions', value: stats.labCourses, icon: FlaskConical, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Total Credits', value: stats.totalCredits, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Avg workload', value: stats.avgCredits, icon: LayoutGrid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const allSelectedOnPage = paginatedCourses.length > 0 && paginatedCourses.every(item => selectedIds.includes(item.id));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Course Repository</h1>
                    <p className="text-sm text-slate-500 font-medium">Institutional master catalog for OBE-compliant curriculum.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end">
                    <Button variant="outline" className="h-12 px-5 rounded-2xl font-black uppercase text-[9px] tracking-widest bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-100/50 shadow-sm" onClick={handleLoadPredefinedTemplate}>
                        <Database size={16} className="mr-2" /> Load BSCS Template
                    </Button>
                    <Button variant="outline" className="h-12 px-5 rounded-2xl font-black uppercase text-[9px] tracking-widest bg-white border-slate-200 shadow-sm" onClick={handleDownloadTemplate}>
                        <Download size={16} className="mr-2" /> Download CSV
                    </Button>
                    <Button variant="outline" className="h-12 px-5 rounded-2xl font-black uppercase text-[9px] tracking-widest bg-white border-slate-200 shadow-sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} className="mr-2" /> Import CSV
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <Button className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all" onClick={() => { setIsEditing(false); resetForm(); setOpen(true); }}>
                        <Plus size={18} className="mr-2" /> Add Course
                    </Button>
                </div>
            </div>

            {/* Metrics dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <Card key={idx} className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl transition-colors duration-300", stat.bg)}>
                                <stat.icon size={20} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 leading-none">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-850 tracking-tight">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Action Bar & Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50">
                {/* Search Bar & Grid Select All */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {viewMode === 'GRID' && (
                        <div className="flex items-center gap-2 pr-4 border-r border-slate-100 shrink-0">
                            <Checkbox
                                id="grid-select-all"
                                checked={allSelectedOnPage}
                                onCheckedChange={() => handleSelectAll(paginatedCourses)}
                                className="h-5 w-5 rounded-md border-slate-300"
                            />
                            <label htmlFor="grid-select-all" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none">
                                Select All
                            </label>
                        </div>
                    )}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <Input
                            placeholder="Filter by code or title..."
                            className="h-12 pl-12 rounded-xl border-slate-100 bg-white ring-0 focus-visible:ring-0 shadow-sm text-slate-700 font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Theory:</span>
                        <Select value={creditFilter} onValueChange={setCreditFilter}>
                            <SelectTrigger className="h-10 w-28 rounded-xl border-slate-100 bg-slate-50 font-bold text-slate-700 text-xs">
                                <SelectValue placeholder="Credits" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="ALL">All Credits</SelectItem>
                                <SelectItem value="1">1 Cr Hr</SelectItem>
                                <SelectItem value="2">2 Cr Hrs</SelectItem>
                                <SelectItem value="3">3 Cr Hrs</SelectItem>
                                <SelectItem value="4">4 Cr Hrs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Practical:</span>
                        <Select value={labFilter} onValueChange={setLabFilter}>
                            <SelectTrigger className="h-10 w-32 rounded-xl border-slate-100 bg-slate-50 font-bold text-slate-700 text-xs">
                                <SelectValue placeholder="Lab Work" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="ALL">All Workload</SelectItem>
                                <SelectItem value="LAB">Has Practical Lab</SelectItem>
                                <SelectItem value="NO_LAB">Theory Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                        <Button
                            variant={viewMode === 'GRID' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('GRID')}
                            className={cn("h-8 w-8 rounded-lg", viewMode === 'GRID' ? "bg-white shadow-sm" : "")}
                        >
                            <LayoutGrid size={16} />
                        </Button>
                        <Button
                            variant={viewMode === 'LIST' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('LIST')}
                            className={cn("h-8 w-8 rounded-lg", viewMode === 'LIST' ? "bg-white shadow-sm" : "")}
                        >
                            <List size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
                </div>
            ) : filteredCourses.length > 0 ? (
                <>
                    {viewMode === 'GRID' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedCourses.map(course => {
                                const isSelected = selectedIds.includes(course.id);
                                return (
                                    <Card key={course.id} className={cn(
                                        "group border-2 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden bg-white relative",
                                        isSelected ? "border-blue-600 ring-2 ring-blue-500/10" : "border-slate-100"
                                    )}>
                                        {/* Card Selection Overlay Checkbox */}
                                        <div className="absolute top-6 left-6 z-10 flex items-center">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleSelect(course.id)}
                                                className="h-5 w-5 rounded-md border-slate-300 shadow-sm"
                                            />
                                        </div>

                                        <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between bg-slate-50/50 pl-16">
                                            <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-blue-600 text-lg border border-slate-100 uppercase">
                                                {course.code.slice(0, 3)}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-white shadow-sm">
                                                        <MoreHorizontal size={20} className="text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-2xl border-slate-100">
                                                    <DropdownMenuItem onClick={() => openEdit(course)} className="rounded-xl h-11 font-bold text-slate-700 cursor-pointer">
                                                        <Pencil size={16} className="mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => initiateDelete(course)} className="rounded-xl h-11 font-bold text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                                        <Trash2 size={16} className="mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-850 leading-tight tracking-tight line-clamp-2 min-h-[2.5rem]">{course.title}</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 rounded-full px-3 py-1 font-black tracking-tighter uppercase text-[9px]">{course.code}</Badge>
                                                        {course.lab_hours > 0 && <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-0 rounded-full px-3 py-1 font-black tracking-tighter uppercase text-[9px]">Applied Lab</Badge>}
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                                                            <Clock size={12} className="text-slate-300" /> {course.credit_hours} Cr Hrs
                                                        </div>
                                                        {course.lab_hours > 0 && (
                                                            <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                                                                <FlaskConical size={12} className="text-slate-300" /> {course.lab_hours} Lab Hrs
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-b border-slate-100 hover:bg-transparent h-16">
                                        <TableHead className="w-16 text-center">
                                            <Checkbox
                                                checked={allSelectedOnPage}
                                                onCheckedChange={() => handleSelectAll(paginatedCourses)}
                                                className="rounded-md border-slate-300"
                                            />
                                        </TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course Definition</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hours (L+P)</TableHead>
                                        <TableHead className="pr-10 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedCourses.map(course => {
                                        const isSelected = selectedIds.includes(course.id);
                                        return (
                                            <TableRow key={course.id} className={cn(
                                                "hover:bg-blue-50/10 border-b border-slate-50 transition-colors h-20 group",
                                                isSelected ? "bg-blue-50/20" : ""
                                            )}>
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggleSelect(course.id)}
                                                        className="rounded-md border-slate-300"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-black text-blue-600">{course.code}</TableCell>
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
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6 bg-white rounded-2xl shadow-sm mt-4">
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">
                                        Showing <span className="text-slate-700 font-extrabold">{startIndex + 1}</span> to <span className="text-slate-700 font-extrabold">{Math.min(startIndex + itemsPerPage, filteredCourses.length)}</span> of{' '}
                                        <span className="text-slate-700 font-extrabold">{filteredCourses.length}</span> courses
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="rounded-l-xl rounded-r-none h-10 border-slate-200"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <Button
                                                key={i}
                                                variant={currentPage === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(i + 1)}
                                                className="rounded-none border-x-0 border-slate-200 first:border-l last:border-r h-10 font-bold"
                                            >
                                                {i + 1}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="rounded-r-xl rounded-l-none h-10 border-slate-200"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="py-32 text-center space-y-4 bg-white rounded-[3rem] shadow-sm border border-slate-50">
                    <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                        <Search size={32} className="text-slate-300" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-1">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">No Courses Found</h3>
                        <p className="text-sm text-slate-500 font-medium">Try clearing filters or search terms. You can also load the BSCS template.</p>
                    </div>
                </div>
            )}

            {/* FLOATING ACTION BAR FOR BULK ACTIONS */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white rounded-3xl px-6 py-4 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                            {selectedIds.length} Selected
                        </span>
                    </div>
                    <div className="w-px h-6 bg-slate-800"></div>
                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest p-0 h-auto hover:bg-transparent"
                        onClick={() => setSelectedIds([])}
                    >
                        Deselect
                    </Button>
                    <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest"
                        onClick={() => setBulkDeleteAlertOpen(true)}
                    >
                        Delete Selected
                    </Button>
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
                                    <Input 
                                        type="number" 
                                        min="1"
                                        max="6"
                                        value={creditHours} 
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            if (val > 6) val = 6;
                                            setCreditHours(val);
                                        }} 
                                        required 
                                        className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lab Credits</Label>
                                    <Input 
                                        type="number" 
                                        min="0"
                                        max="6"
                                        value={labHours} 
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            if (val > 6) val = 6;
                                            setLabHours(val);
                                        }} 
                                        className="h-14 rounded-2xl bg-slate-50 border-0 focus:bg-white text-slate-800 font-bold" 
                                    />
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

            {/* 3. Single Delete Confirmation */}
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

            {/* 4. Bulk Delete Confirmation */}
            <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Confirm Bulk Delete</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            Confirm the permanent removal of <strong>{selectedIds.length}</strong> selected courses from the institutional repository.
                            Courses mapped to existing Study Plans, Sections, or student logs will be skipped automatically to maintain integrity constraints.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8">
                        <AlertDialogCancel className="rounded-2xl h-12 px-8 border-0 bg-slate-100 font-bold uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-600/20" onClick={executeBulkDelete}>
                            Wipe Selected
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
