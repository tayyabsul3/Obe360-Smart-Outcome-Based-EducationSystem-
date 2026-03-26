import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Search, Mail, Loader2, MoreHorizontal, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Delete State
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Invitation Form State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/teachers');
            if (res.ok) {
                const data = await res.json();
                setTeachers(data);
            } else {
                toast.error("Failed to fetch teachers");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await fetch('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, fullName: inviteName }),
            });

            const result = await res.json();

            if (res.ok) {
                toast.success("Invitation Sent", { description: `Credentials sent to ${inviteEmail}` });
                setInviteOpen(false);
                setInviteEmail('');
                setInviteName('');
                fetchTeachers(); // Refresh list to show new user if auto-created or just wait
            } else {
                toast.error("Invitation Failed", { description: result.error || "Unknown error" });
            }
        } catch (error) {
            console.log(error)
            toast.error("Error", { description: error.message });
        } finally {
            setInviting(false);
        }
    };

    const handleDelete = async () => {
        if (!teacherToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/teachers/${teacherToDelete.id}`, {
                method: 'DELETE',
            });
            
            if (res.ok) {
                toast.success("Teacher deleted successfully");
                setTeachers(teachers.filter(t => t.id !== teacherToDelete.id));
                // Adjust pagination if needed
                if (paginatedTeachers.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1);
                }
            } else {
                const error = await res.json();
                toast.error("Deletion failed", { description: error.message || "Unknown error" });
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Network Error. Could not delete.");
        } finally {
            setDeleting(false);
            setDeleteAlertOpen(false);
            setTeacherToDelete(null);
        }
    };

    const confirmDelete = (teacher) => {
        setTeacherToDelete(teacher);
        setDeleteAlertOpen(true);
    };

    const filteredTeachers = teachers.filter(t =>
        (t.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (t.email?.toLowerCase() || '').includes(search.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Faculty Members</h1>
                    <p className="text-muted-foreground">Manage teachers and their assignments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search teachers..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Invite Teacher
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite New Teacher</DialogTitle>
                                <DialogDescription>
                                    Enter their details. They will receive an email with login credentials.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Dr. John Doe" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="john@university.edu" required />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={inviting}>
                                        {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {inviting ? 'Sending...' : 'Send Invitation'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] pl-8">Full Name</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Email</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Role</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Joined Date</TableHead>
                            <TableHead className="w-[100px] text-right font-black text-slate-400 uppercase tracking-widest text-[10px] pr-8">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3].map((i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} className="p-4"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell>
                                </TableRow>
                            ))
                        ) : paginatedTeachers.length > 0 ? (
                            paginatedTeachers.map((teacher) => (
                                <TableRow key={teacher.id} className="group hover:bg-blue-50/30 border-slate-50 transition-colors">
                                    <TableCell className="font-black text-slate-800 pl-8">{teacher.full_name || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                {teacher.email || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-lg font-mono font-bold text-[11px] bg-slate-50 border-slate-200 text-slate-600 px-3 py-1 capitalize">
                                                {teacher.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">
                                                Active
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-slate-600">{new Date(teacher.updated_at || Date.now()).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                                        onClick={() => confirmDelete(teacher)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20 text-center">
                                    <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <MoreHorizontal size={32} className="text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">No Teachers Found</h3>
                                    <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">There are no faculty members matching your criteria. Try adjusting the search or invite someone.</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                        
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-8 py-4 bg-slate-50/30">
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">
                                    Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredTeachers.length)}</span> of{' '}
                                    <span className="font-bold text-slate-800">{filteredTeachers.length}</span> faculty
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-l-md rounded-r-none h-10 border-slate-200"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-4 w-4 text-slate-600" aria-hidden="true" />
                                    </Button>
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <Button
                                            key={i}
                                            variant={currentPage === i + 1 ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn("rounded-none border-x-0 first:border-l last:border-r h-10 border-slate-200", currentPage === i + 1 ? "bg-blue-600 text-white" : "text-slate-600")}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="rounded-r-md rounded-l-none h-10 border-slate-200"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-4 w-4 text-slate-600" aria-hidden="true" />
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the account for <span className="font-bold text-slate-900">{teacherToDelete?.full_name}</span>. 
                            This action cannot be undone, and all their data will be wiped or anonymized.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            {deleting ? 'Deleting...' : 'Delete Permanently'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
