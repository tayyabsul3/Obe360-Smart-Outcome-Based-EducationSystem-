import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Trash2,
    Database,
    Loader2
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Students() {
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    // Filters
    const [selectedBatch, setSelectedBatch] = useState('ALL');
    const [selectedSection, setSelectedSection] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStudents();
        fetchBatches();
    }, [selectedBatch, selectedSection]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let url = 'http://localhost:5000/api/students';
            const params = new URLSearchParams();
            if (selectedBatch !== 'ALL') params.append('batch', selectedBatch);
            if (selectedSection !== 'ALL') params.append('section', selectedSection);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/students/meta/batches');
            const data = await res.json();
            setBatches(data);
        } catch (err) { console.error(err); }
    };

    const handleSeedData = async () => {
        setSeeding(true);
        try {
            const res = await fetch('http://localhost:5000/api/students/seed-global', { method: 'POST' });
            if (res.ok) {
                toast.success("Dummy students seeded successfully!");
                fetchStudents();
                fetchBatches();
            } else {
                toast.error("Failed to seed data");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        } finally {
            setSeeding(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.reg_no.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 shrink-0">
                        <Users size={32} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Student Directory</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage and organize students by academic batch and section.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSeedData}
                        disabled={seeding}
                        className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 font-bold gap-2 hover:bg-slate-50"
                    >
                        {seeding ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                        Seed Dummy Data
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-200">
                        <UserPlus size={18} /> Add Student
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <Input
                        placeholder="Search by name or registration number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 pl-12 rounded-2xl bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/20 font-medium"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                        <SelectTrigger className="h-12 w-[180px] rounded-2xl bg-slate-50 border-0 shadow-none font-bold text-slate-700">
                            <SelectValue placeholder="Batch" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            <SelectItem value="ALL" className="font-bold">All Batches</SelectItem>
                            {batches.map(b => (
                                <SelectItem key={b} value={b} className="font-bold">Batch {b}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger className="h-12 w-[140px] rounded-2xl bg-slate-50 border-0 shadow-none font-bold text-slate-700">
                            <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            <SelectItem value="ALL" className="font-bold">All Sections</SelectItem>
                            <SelectItem value="A" className="font-bold">Section A</SelectItem>
                            <SelectItem value="B" className="font-bold">Section B</SelectItem>
                            <SelectItem value="C" className="font-bold">Section C</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Students Table */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[100px] font-black text-slate-400 uppercase tracking-widest text-[10px] pl-8">#</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Student Info</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Registration No</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Organization</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-right pr-8">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="p-4"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student, idx) => (
                                <TableRow key={student.id} className="group hover:bg-blue-50/30 border-slate-50 transition-colors">
                                    <TableCell className="font-black text-slate-300 pl-8">{String(idx + 1).padStart(2, '0')}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800">{student.name}</span>
                                                <span className="text-xs text-slate-400 font-medium">{student.email || 'No email provided'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-lg font-mono font-bold text-[11px] bg-slate-50 border-slate-200 text-slate-600 px-3 py-1">
                                            {student.reg_no}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 tracking-tight">Batch {student.batch || 'N/A'}</span>
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Section {student.section || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md hover:text-red-600 transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center">
                                    <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Users size={32} className="text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">No Students Found</h3>
                                    <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">No student records match your current filters. Try adjusting your search or seeting dummy data.</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
