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
import { Loader } from '@/components/ui/loader';
import { Skeleton } from '@/components/ui/skeleton';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

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
            } else {
                console.error("Expected array but got:", data);
                setCourses([]);
                toast.error("Failed to load courses");
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, code, credit_hours: creditHours, lab_hours: labHours }),
            });
            if (res.ok) {
                setOpen(false);
                fetchCourses();
                setTitle('');
                setCode('');
                toast.success("Course created successfully");
            } else {
                toast.error("Failed to create course");
            }
        } catch (error) {
            console.error('Error creating course:', error);
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

                // Sanitize and Validate
                const sanitized = data.map(item => {
                    const isValid = item.code && item.title && item.credit_hours;
                    if (!isValid) hasErrors = true;

                    return {
                        code: item.code,
                        title: item.title,
                        credit_hours: parseInt(item.credit_hours) || 3,
                        lab_hours: parseInt(item.lab_hours) || 0,
                        isValid
                    };
                });

                setValidationErrors(hasErrors);
                setParsedData(sanitized);
                setPreviewOpen(true);

                // Reset input so same file can be selected again if needed
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
            const payload = parsedData.map(({ isValid, ...rest }) => rest);

            const res = await fetch('http://localhost:5000/api/courses/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courses: payload })
            });
            const result = await res.json();

            if (res.ok) {
                toast.success(`Imported ${result.length} courses successfully.`);
                setPreviewOpen(false);
                fetchCourses();
            } else {
                toast.error("Failed to import", { description: result.error });
            }
        } catch (err) {
            toast.error("Import Error", { description: err.message });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Courses</h1>
                    <p className="text-muted-foreground">Manage the course catalog.</p>
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
                            <Upload className="mr-2 h-4 w-4" /> Import CSV
                        </Button>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Add Course
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Course</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Course Code</Label>
                                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CSC-101" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Course Title</Label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Programming Fundamentals" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Credit Hours</Label>
                                        <Input type="number" value={creditHours} onChange={(e) => setCreditHours(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Lab Hours</Label>
                                        <Input type="number" value={labHours} onChange={(e) => setLabHours(e.target.value)} />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Create Course</Button>
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
                                <span className="text-red-500 flex items-center gap-2"><AlertCircle size={16} /> Missing required fields. Please fix data.</span> :
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
                                    <TableHead>Cr. Hr</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.map((row, i) => (
                                    <TableRow key={i} className={!row.isValid ? "bg-red-50" : ""}>
                                        <TableCell>{row.code || <span className="text-red-500 text-xs italic">Required</span>}</TableCell>
                                        <TableCell>{row.title || <span className="text-red-500 text-xs italic">Required</span>}</TableCell>
                                        <TableCell>{row.credit_hours || <span className="text-red-500 text-xs italic">Required</span>}</TableCell>
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
                    <CardTitle>Course Catalog</CardTitle>
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
                                    <TableHead>Cr. Hours</TableHead>
                                    <TableHead>Lab Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-medium">{course.code}</TableCell>
                                        <TableCell>{course.title}</TableCell>
                                        <TableCell>{course.credit_hours}</TableCell>
                                        <TableCell>{course.lab_hours}</TableCell>
                                    </TableRow>
                                ))}
                                {courses.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground p-8">
                                            No courses found. Use "Import CSV" or "Add Course" to get started.
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
