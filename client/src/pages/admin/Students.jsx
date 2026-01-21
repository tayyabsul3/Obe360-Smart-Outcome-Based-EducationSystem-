import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, Pencil, Upload, Download, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('All');

    // Dialogs
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ id: null, name: '', reg_no: '', email: '', batch: '' });

    // CSV Import
    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchBatches();
        fetchStudents();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [selectedBatch]);

    const fetchBatches = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/students/meta/batches');
            if (res.ok) setBatches(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = 'http://localhost:5000/api/students';
            if (selectedBatch && selectedBatch !== 'All') {
                url += `?batch=${encodeURIComponent(selectedBatch)}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                setStudents(await res.json());
            }
        } catch (error) {
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.reg_no || !formData.batch) return toast.warning("Name, Reg No, and Batch are required");

        const url = isEdit
            ? `http://localhost:5000/api/students/${formData.id}`
            : 'http://localhost:5000/api/students';

        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(isEdit ? "Student Updated" : "Student Created");
                setIsCreateOpen(false);
                fetchStudents();
                fetchBatches(); // Refresh batches if new one added
            } else {
                const err = await res.json();
                toast.error(err.error || "Operation failed");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this student?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/students/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Student Deleted");
                fetchStudents();
            }
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    // CSV Import
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data;
                if (rows.length === 0) {
                    toast.error("Empty CSV");
                    setImporting(false);
                    return;
                }

                // Batch upload usually implies all students belong to ONE batch, or batch is in CSV
                // User said: "dropdown where we will have batch and if user selects batch 2020 SE then we will list all..."
                // User said: "upload from batch"
                // Assuming CSV might NOT have batch column, and we ask user to apply a batch?
                // Or CSV HAS batch column? 
                // Let's assume CSV can have 'batch' column. If missing, we could prompt, but let's stick to CSV data for now.
                // Actually, let's inject 'batch' from a prompt? 

                // Keep it simple: CSV must have name, reg_no, email, batch.

                let success = 0;
                for (const row of rows) {
                    if (!row.name || !row.reg_no || !row.batch) continue;

                    try {
                        await fetch('http://localhost:5000/api/students', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: row.name,
                                reg_no: row.reg_no,
                                email: row.email,
                                batch: row.batch
                            })
                        });
                        success++;
                    } catch (e) { console.error(e); }
                }

                toast.success(`Imported ${success} students`);
                setImporting(false);
                fetchStudents();
                fetchBatches();
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const downloadTemplate = () => {
        const csv = "name,reg_no,email,batch\nJohn Doe,2023-CS-001,john@example.com,2023 CS\nJane Smith,2023-CS-002,jane@example.com,2023 CS";
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "students_template.csv";
        a.click();
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.reg_no.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
                    <p className="text-muted-foreground">Manage student records and batches.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadTemplate} title="Download CSV Template">
                        <Download size={16} className="mr-2" /> Template
                    </Button>
                    <div className="relative">
                        <Button variant="outline" disabled={importing}>
                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Batch Upload
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".csv"
                            onChange={handleFileSelect}
                            disabled={importing}
                        />
                    </div>
                    <Button onClick={() => {
                        setFormData({ id: null, name: '', reg_no: '', email: '', batch: '' });
                        setIsEdit(false);
                        setIsCreateOpen(true);
                    }}>
                        <Plus size={16} className="mr-2" /> Add Student
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Batch:</span>
                        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Batches</SelectItem>
                                {batches.map(b => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or reg no..."
                            className="pl-8"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {filteredStudents.length} students
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Reg No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id} className="hover:bg-slate-50">
                                    <TableCell className="font-mono text-xs font-medium">{student.reg_no}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {student.batch}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            setFormData(student);
                                            setIsEdit(true);
                                            setIsCreateOpen(true);
                                        }}>
                                            <Pencil size={14} className="text-slate-500 hover:text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                                            <Trash2 size={14} className="text-slate-500 hover:text-red-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    No students found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                        <DialogDescription>Enter student details below.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Reg No</label>
                                <Input value={formData.reg_no} onChange={e => setFormData({ ...formData, reg_no: e.target.value })} placeholder="2023-CS-001" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Batch</label>
                                <Input value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} placeholder="2023 CS" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} type="email" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}><Save size={16} className="mr-2" /> Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
