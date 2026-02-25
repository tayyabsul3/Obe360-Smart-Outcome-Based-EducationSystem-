import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Plus, Users, Search, Loader2, X, Filter, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import useLoaderStore from '@/store/loaderStore';
import { cn } from '@/lib/utils';

export default function Students() {
    const { courseId } = useParams();
    const { showLoader, hideLoader } = useLoaderStore();

    // State
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Import Modal State
    const [importOpen, setImportOpen] = useState(false);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [batchStudents, setBatchStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [fetchingBatch, setFetchingBatch] = useState(false);

    // Modal Filters
    const [modalFilters, setModalFilters] = useState({
        reg_no: '',
        section: '',
        name: '',
        father_name: '',
        current_city: '',
        email: ''
    });

    useEffect(() => {
        if (courseId) fetchEnrolledStudents();
    }, [courseId]);

    useEffect(() => {
        if (importOpen) fetchBatches();
    }, [importOpen]);

    useEffect(() => {
        if (selectedBatch) fetchBatchStudents(selectedBatch);
    }, [selectedBatch]);

    const fetchEnrolledStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/students/${courseId}`);
            if (res.ok) setEnrolledStudents(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/students/meta/batches');
            if (res.ok) setBatches(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const fetchBatchStudents = async (batch) => {
        setFetchingBatch(true);
        setBatchStudents([]);
        setSelectedStudents([]);
        try {
            const res = await fetch(`http://localhost:5000/api/students?batch=${encodeURIComponent(batch)}`);
            if (res.ok) setBatchStudents(await res.json());
        } catch (error) {
            toast.error("Failed to load batch students");
        } finally {
            setFetchingBatch(false);
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = filteredBatchStudents.map(s => s.id);
            setSelectedStudents(allIds);
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id, checked) => {
        if (checked) {
            setSelectedStudents(prev => [...prev, id]);
        } else {
            setSelectedStudents(prev => prev.filter(sid => sid !== id));
        }
    };

    const handleImport = async () => {
        if (selectedStudents.length === 0) return toast.warning("Select students to import");

        showLoader();
        try {
            const res = await fetch(`http://localhost:5000/api/students/${courseId}/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentIds: selectedStudents })
            });

            if (res.ok) {
                toast.success(`Enrolled ${selectedStudents.length} students`);
                setImportOpen(false);
                fetchEnrolledStudents();
                setSelectedBatch('');
                setBatchStudents([]);
            } else {
                throw new Error("Enrollment failed");
            }
        } catch (error) {
            toast.error("Failed to enroll students");
        } finally {
            hideLoader();
        }
    };

    const filteredBatchStudents = batchStudents.filter(s => {
        return Object.keys(modalFilters).every(key => {
            if (!modalFilters[key]) return true;
            return String(s[key] || '').toLowerCase().includes(modalFilters[key].toLowerCase());
        });
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Main Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none">Class Roll</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Course Enrolments</p>
                    </div>
                </div>
                <Button onClick={() => setImportOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold">
                    <Plus size={18} /> Select Students
                </Button>
            </div>

            {/* Main List */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <GraduationCap size={16} /> Enrolled Students ({enrolledStudents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    ) : enrolledStudents.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700 pl-6">REG NO</TableHead>
                                    <TableHead className="font-bold text-slate-700">NAME</TableHead>
                                    <TableHead className="font-bold text-slate-700">BATCH</TableHead>
                                    <TableHead className="font-bold text-slate-700">SECTION</TableHead>
                                    <TableHead className="font-bold text-slate-700 pr-6">EMAIL</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrolledStudents.map(student => (
                                    <TableRow key={student.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-mono font-bold text-blue-600 pl-6">{student.reg_no}</TableCell>
                                        <TableCell className="font-medium text-slate-800">{student.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-md font-bold text-[10px] uppercase bg-slate-50 border-slate-200 text-slate-600">
                                                {student.batch || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-black text-xs text-blue-500 uppercase">{student.section || 'A'}</span>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs pr-6">{student.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-20">
                            <Users className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Course is currently empty</p>
                            <Button variant="link" className="text-blue-600 mt-2" onClick={() => setImportOpen(true)}>Enroll students now</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Redesigned Large Selection Modal */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                    <DialogHeader className="p-6 bg-white border-b shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Select Students</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Bulk Enrolment Workspace</DialogDescription>
                        </div>
                        <div className="flex items-center gap-4 mr-8">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-500 uppercase">Select Batch:</span>
                                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                    <SelectTrigger className="w-[180px] h-10 rounded-xl bg-slate-100 border-0 font-bold">
                                        <SelectValue placeholder="Choose Batch..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {batches.map(b => (
                                            <SelectItem key={b} value={b} className="font-medium">Batch {b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleImport}
                                disabled={selectedStudents.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 h-10 px-8 rounded-xl font-black shadow-lg shadow-blue-200"
                            >
                                ADD SELECTED ({selectedStudents.length})
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                        {!selectedBatch ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <Filter size={48} className="mb-4 opacity-20" />
                                <p className="font-black uppercase tracking-widest text-sm">Please select an academic batch to continue</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden relative">
                                {fetchingBatch && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
                                    </div>
                                )}

                                <div className="p-4 bg-white/80 border-b flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Filtered Results: {filteredBatchStudents.length}</span>
                                    <span>Total Available: {batchStudents.length}</span>
                                </div>

                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <Table className="relative">
                                        <TableHeader className="sticky top-0 bg-white z-40 shadow-sm">
                                            <TableRow className="border-b-2 border-slate-100">
                                                <TableHead className="w-[60px] text-center pl-4">
                                                    <Checkbox
                                                        checked={selectedStudents.length === filteredBatchStudents.length && filteredBatchStudents.length > 0}
                                                        onCheckedChange={handleSelectAll}
                                                        className="h-5 w-5 rounded-md"
                                                    />
                                                </TableHead>
                                                <TableHead className="w-[80px] font-black text-[10px] text-slate-400 uppercase text-center pb-2">Sr.No</TableHead>
                                                <TableHead className="w-[180px] font-black text-[10px] text-slate-400 uppercase pb-2">Registration No</TableHead>
                                                <TableHead className="w-[100px] font-black text-[10px] text-slate-400 uppercase text-center pb-2">Section</TableHead>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase pb-2">Name</TableHead>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase pb-2">Father Name</TableHead>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase pb-2">Current City</TableHead>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase pb-2 pr-4">Email</TableHead>
                                            </TableRow>
                                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                <TableCell />
                                                <TableCell />
                                                <TableCell className="py-2">
                                                    <Input
                                                        placeholder="Reg No..."
                                                        className="h-8 text-[11px] font-mono rounded-lg bg-white border-slate-200"
                                                        value={modalFilters.reg_no}
                                                        onChange={e => setModalFilters(prev => ({ ...prev, reg_no: e.target.value }))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Input
                                                        placeholder="Sec..."
                                                        className="h-8 text-[11px] font-bold text-center rounded-lg bg-white border-slate-200"
                                                        value={modalFilters.section}
                                                        onChange={e => setModalFilters(prev => ({ ...prev, section: e.target.value }))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Input
                                                        placeholder="Name..."
                                                        className="h-8 text-[11px] font-bold rounded-lg bg-white border-slate-200"
                                                        value={modalFilters.name}
                                                        onChange={e => setModalFilters(prev => ({ ...prev, name: e.target.value }))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Input
                                                        placeholder="Father Name..."
                                                        className="h-8 text-[11px] font-bold rounded-lg bg-white border-slate-200"
                                                        value={modalFilters.father_name}
                                                        onChange={e => setModalFilters(prev => ({ ...prev, father_name: e.target.value }))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Input
                                                        placeholder="City..."
                                                        className="h-8 text-[11px] font-bold rounded-lg bg-white border-slate-200"
                                                        value={modalFilters.current_city}
                                                        onChange={e => setModalFilters(prev => ({ ...prev, current_city: e.target.value }))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2 pr-4">
                                                    <Input
                                                        placeholder="Email..."
                                                        className="h-8 text-[11px] font-bold rounded-lg bg-white border-slate-200"
                                                        value={modalFilters.email}
                                                        onChange={e => setModalFilters(prev => ({ ...prev, email: e.target.value }))}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-white">
                                            {filteredBatchStudents.map((student, idx) => (
                                                <TableRow key={student.id} className="hover:bg-blue-50/30 group transition-colors">
                                                    <TableCell className="text-center pl-4">
                                                        <Checkbox
                                                            checked={selectedStudents.includes(student.id)}
                                                            onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                            className="h-5 w-5 rounded-md"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center font-black text-slate-300 text-xs">
                                                        {String(idx + 1).padStart(2, '0')}.
                                                    </TableCell>
                                                    <TableCell className="font-mono font-black text-xs text-blue-700">
                                                        {student.reg_no}
                                                    </TableCell>
                                                    <TableCell className="text-center font-black text-xs text-slate-800 uppercase">
                                                        {student.section || 'A'}
                                                    </TableCell>
                                                    <TableCell className="font-black text-slate-800 text-xs uppercase">
                                                        {student.name}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-500 text-xs uppercase">
                                                        {student.father_name || '---'}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-500 text-xs uppercase">
                                                        {student.current_city || '---'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-slate-400 font-medium pr-4">
                                                        {student.email}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {filteredBatchStudents.length === 0 && !fetchingBatch && (
                                        <div className="p-20 text-center">
                                            <Search className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                                            <p className="font-black uppercase tracking-widest text-slate-400">No students match your filters</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-white border-t shrink-0 flex items-center justify-between sm:justify-between px-8">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                {selectedStudents.length} Students Selected for Enrolment
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setImportOpen(false)} className="font-black text-xs uppercase h-10 px-6">Close</Button>
                            <Button onClick={handleImport} disabled={selectedStudents.length === 0} className="bg-blue-600 font-black text-xs uppercase h-10 px-10 rounded-xl">Add to course</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
