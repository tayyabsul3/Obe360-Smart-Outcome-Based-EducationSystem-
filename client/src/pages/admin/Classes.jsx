import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form State
    const [programId, setProgramId] = useState('');
    const [semester, setSemester] = useState('');
    const [section, setSection] = useState('');
    const [session, setSession] = useState('');

    useEffect(() => {
        fetchClasses();
        fetchPrograms();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/classes');
            const data = await res.json();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrograms = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/programs');
            const data = await res.json();
            setPrograms(data);
        } catch (err) { console.error(err) }
    }

    const handleCreate = async (e) => {
        e.preventDefault();
        // Auto-generate name e.g. "BSSE-1A"
        const selectedProgram = programs.find(p => p.id === programId);
        if (!selectedProgram) return;

        const name = `${selectedProgram.code}-${semester}${section}`;

        try {
            const res = await fetch('http://localhost:5000/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: programId,
                    name,
                    semester: parseInt(semester),
                    section,
                    academic_session: session
                }),
            });
            if (res.ok) {
                setOpen(false);
                fetchClasses();
                // Reset form
                setSemester('');
                setSection('');
                setSession('');
            } else {
                const d = await res.json();
                alert(d.error);
            }
        } catch (error) {
            console.error('Error creating class:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Classes</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Add Class</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Class</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Program</Label>
                                <Select onValueChange={setProgramId} value={programId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Semester</Label>
                                    <Input type="number" min="1" max="8" value={semester} onChange={(e) => setSemester(e.target.value)} required placeholder="e.g. 1" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Input value={section} onChange={(e) => setSection(e.target.value)} required placeholder="e.g. A" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Academic Session</Label>
                                <Input value={session} onChange={(e) => setSession(e.target.value)} required placeholder="e.g. Fall 2024" />
                            </div>

                            <Button type="submit" className="w-full">Create Class</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Classes</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class Name</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Semester</TableHead>
                                    <TableHead>Session</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((cls) => (
                                    <TableRow key={cls.id}>
                                        <TableCell className="font-medium">{cls.name}</TableCell>
                                        <TableCell>{cls.program?.code}</TableCell>
                                        <TableCell>{cls.semester}</TableCell>
                                        <TableCell>{cls.academic_session}</TableCell>
                                    </TableRow>
                                ))}
                                {classes.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No classes found.</TableCell>
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
