import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Search, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [search, setSearch] = useState('');

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
            const res = await fetch('http://localhost:5000/api/teachers');
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
            const res = await fetch('http://localhost:5000/api/invite-teacher', {
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
            toast.error("Error", { description: error.message });
        } finally {
            setInviting(false);
        }
    };

    const filteredTeachers = teachers.filter(t =>
        (t.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (t.email?.toLowerCase() || '').includes(search.toLowerCase())
    );

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

            <Card>
                <CardHeader>
                    <CardTitle>All Teachers</CardTitle>
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
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTeachers.map((teacher) => (
                                    <TableRow key={teacher.id}>
                                        <TableCell className="font-medium">{teacher.full_name || 'N/A'}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            {teacher.email || 'N/A'}
                                        </TableCell>
                                        <TableCell className="capitalize">{teacher.role}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(teacher.updated_at || Date.now()).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                                {filteredTeachers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                                            No teachers found. Invite some!
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
