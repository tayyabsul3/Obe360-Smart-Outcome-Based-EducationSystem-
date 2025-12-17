import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Programs() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // CSV Import State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [parsedData, setParsedData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [validationErrors, setValidationErrors] = useState(false);
    const fileInputRef = useRef(null);
    const studyPlanInputRef = useRef(null); // New Ref

    // Form State
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [duration, setDuration] = useState(4);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/programs');
            const data = await res.json();
            setPrograms(data);
        } catch (error) {
            console.error('Error fetching programs:', error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/programs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, code, duration_years: duration }),
            });
            if (res.ok) {
                setOpen(false);
                fetchPrograms();
                setTitle('');
                setCode('');
                toast.success("Program Created Successfully");
            }
        } catch (error) {
            console.error('Error creating program:', error);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = "code,title,duration_years\nBSSE,Bachelor of Science in Software Engineering,4\nBSCS,Bachelor of Science in Computer Science,4";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'programs_template.csv');
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

                // Sanitize and Validate
                const sanitized = data.map(item => {
                    const isValid = item.code && item.title && item.duration_years;
                    if (!isValid) hasErrors = true;

                    return {
                        code: item.code,
                        title: item.title,
                        duration_years: parseInt(item.duration_years) || 4,
                        isValid // Flag for UI
                    };
                });

                setValidationErrors(hasErrors);
                setParsedData(sanitized);
                setPreviewOpen(true);

                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
            error: (err) => {
                toast.error("CSV Parse Error", { description: err.message });
            }
        });
    };

    const confirmImport = async () => {
        setImporting(true);
        try {
            // Filter output to remove UI flags
            const payload = parsedData.map(({ isValid, ...rest }) => rest);

            const res = await fetch('http://localhost:5000/api/programs/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programs: payload })
            });
            const result = await res.json();

            if (res.ok) {
                toast.success(`Imported ${result.length} programs successfully.`);
                setPreviewOpen(false);
                fetchPrograms();
            } else {
                toast.error("Failed to import", { description: result.error });
            }
        } catch (err) {
            toast.error("Import Error", { description: err.message });
        } finally {
            setImporting(false);
        }
    };



    const handleDownloadStudyPlanTemplate = () => {
        const csvContent = "program_code,course_code,semester\nBSSE,CSC-101,1\nBSSE,CSC-102,2";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'study_plan_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStudyPlanUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data;
                if (data.length === 0) {
                    toast.error("CSV file is empty");
                    return;
                }

                // Basic Validation
                const validItems = data.filter(item => item.program_code && item.course_code && item.semester);
                if (validItems.length < data.length) {
                    toast.warning(`Skipping ${data.length - validItems.length} invalid rows.`);
                }

                try {
                    setImporting(true);
                    const res = await fetch('http://localhost:5000/api/courses/study-plan/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: validItems })
                    });
                    const result = await res.json();

                    if (res.ok) {
                        toast.success(`Linked ${result.inserted} courses to programs.`);
                    } else {
                        toast.error("Import Failed", { description: result.error || "Unknown error" });
                    }
                } catch (e) {
                    toast.error("Error", { description: e.message });
                } finally {
                    setImporting(false);
                }

                if (studyPlanInputRef.current) studyPlanInputRef.current.value = "";
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Programs</h1>
                    <p className="text-muted-foreground">Manage academic degree programs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="mr-2 h-4 w-4" /> Template
                    </Button>

                    <div className="relative">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Import Programs
                        </Button>
                    </div>

                    {/* Study Plan Import */}
                    <div className="relative">
                        <input
                            type="file"
                            ref={studyPlanInputRef}
                            accept=".csv"
                            className="hidden"
                            onChange={handleStudyPlanUpload}
                        />
                        <Button variant="outline" onClick={() => studyPlanInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Import Study Plan
                        </Button>
                    </div>
                    {/* End Study Plan Import */}

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Add Program
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Program</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Program Title</Label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bachelor of Science in Software Engineering" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Program Code</Label>
                                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. BSSE" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Years)</Label>
                                    <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                                </div>
                                <Button type="submit" className="w-full">Create Program</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Import Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Import Preview</DialogTitle>
                        <DialogDescription>
                            {validationErrors ?
                                <span className="text-red-500 flex items-center gap-2"><AlertCircle size={16} /> Missing required fields (marked red). Please fix data.</span> :
                                `Review the data below before confirming the import. Found ${parsedData.length} records.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto border rounded-md my-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.map((row, i) => (
                                    <TableRow key={i} className={!row.isValid ? "bg-red-50" : ""}>
                                        <TableCell>{row.code || <span className="text-red-500 text-xs italic">Required</span>}</TableCell>
                                        <TableCell>{row.title || <span className="text-red-500 text-xs italic">Required</span>}</TableCell>
                                        <TableCell>{row.duration_years || <span className="text-red-500 text-xs italic">Required</span>}</TableCell>
                                        <TableCell>
                                            {row.isValid ? <span className="text-green-600 text-xs">Valid</span> : <span className="text-red-600 text-xs font-bold">Invalid</span>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
                        <Button onClick={confirmImport} disabled={importing || validationErrors}>
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {importing ? 'Importing...' : 'Confirm Import'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <Card>
                <CardHeader>
                    <CardTitle>All Programs</CardTitle>
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
                                    <TableHead>Code</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {programs.map((program) => (
                                    <TableRow key={program.id}>
                                        <TableCell className="font-medium">{program.code}</TableCell>
                                        <TableCell>{program.title}</TableCell>
                                        <TableCell>{program.duration_years} Years</TableCell>
                                        <TableCell>{new Date(program.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                                {programs.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground p-8">
                                            No programs found. Use "Import CSV" or "Add Program" to get started.
                                        </TableCell>
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
