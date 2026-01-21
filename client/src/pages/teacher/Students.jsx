import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Users, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import useLoaderStore from '@/store/loaderStore';

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
            // Filter out already enrolled? Maybe not needed as backend handles upsert properly or ignores.
            // Let's select all IDs from batchStudents
            const allIds = batchStudents.map(s => s.id);
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Students</h1>
                    <p className="text-slate-500">Manage enrolled students.</p>
                </div>
                <Button onClick={() => setImportOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Users size={16} /> Import from Batch
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Enrolled Students ({enrolledStudents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : enrolledStudents.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reg No</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrolledStudents.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-mono text-xs">{student.reg_no}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            No students enrolled yet.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Import Dialog */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Import Students from Batch</DialogTitle>
                        <DialogDescription>Select a batch and choose students to enroll.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium whitespace-nowrap">Select Batch:</span>
                            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose Batch..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map(b => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedBatch && (
                            <div className="flex-1 border rounded-md overflow-auto relative">
                                {fetchingBatch ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                        <Loader2 className="animate-spin text-blue-600" />
                                    </div>
                                ) : batchStudents.length > 0 ? (
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead className="w-[50px]">
                                                    <Checkbox
                                                        checked={selectedStudents.length === batchStudents.length && batchStudents.length > 0}
                                                        onCheckedChange={handleSelectAll}
                                                    />
                                                </TableHead>
                                                <TableHead>Reg No</TableHead>
                                                <TableHead>Name</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {batchStudents.map(student => (
                                                <TableRow key={student.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedStudents.includes(student.id)}
                                                            onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{student.reg_no}</TableCell>
                                                    <TableCell>{student.name}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-10 text-center text-muted-foreground">No students in this batch.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-muted-foreground">
                                {selectedStudents.length} selected
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                                <Button onClick={handleImport} disabled={selectedStudents.length === 0}>
                                    Enroll Selected
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
