import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, Clock, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import useSemesterStore from '@/store/semesterStore';

export default function Settings() {
    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSemesterName, setNewSemesterName] = useState('');
    const [creating, setCreating] = useState(false);
    const [activatingId, setActivatingId] = useState(null);
    const globalFetchSemesters = useSemesterStore(state => state.fetchSemesters);

    useEffect(() => {
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/semesters');
            if (res.ok) {
                const data = await res.json();
                setSemesters(data);
            }
        } catch (error) {
            console.error('Error fetching semesters:', error);
            toast.error("Failed to load academic sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSemester = async (e) => {
        e.preventDefault();
        if (!newSemesterName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/semesters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSemesterName, is_active: false })
            });

            if (res.ok) {
                toast.success("Semester Created");
                setNewSemesterName('');
                fetchSemesters();
                globalFetchSemesters(); // Refresh global store too
            } else {
                toast.error("Failed to create semester");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setCreating(false);
        }
    };

    const handleActivate = async (id) => {
        setActivatingId(id);
        try {
            const res = await fetch(`/api/semesters/${id}/activate`, {
                method: 'PUT'
            });

            if (res.ok) {
                toast.success("Active Session Updated");
                await fetchSemesters();
                await globalFetchSemesters(); // Update global store context
            } else {
                toast.error("Failed to activate session");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network Error");
        } finally {
            setActivatingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
                <p className="text-slate-500 font-medium">Global configuration and academic session routing.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Create Form */}
                <Card className="lg:col-span-1 rounded-3xl shadow-sm border-slate-100 flex flex-col items-center p-8 bg-white h-fit">
                     <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <CalendarDays size={32} />
                     </div>
                     <h3 className="text-xl font-black text-slate-800 tracking-tight text-center">New Academic Term</h3>
                     <p className="text-sm text-slate-500 font-medium text-center mt-2 mb-8">Define upcoming semesters (e.g. Fall 2026).</p>

                     <form onSubmit={handleCreateSemester} className="w-full space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Term Name</Label>
                            <Input
                                placeholder="Spring 2025"
                                value={newSemesterName}
                                onChange={(e) => setNewSemesterName(e.target.value)}
                                className="h-14 bg-slate-50 border-0 focus-visible:ring-blue-500/20 font-bold rounded-2xl text-slate-800"
                                required
                            />
                         </div>
                         <Button
                             type="submit"
                             disabled={creating}
                             className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl text-xs transition-colors shadow-xl"
                         >
                             {creating ? <Loader2 size={18} className="animate-spin" /> : <span className="flex items-center gap-2"><Plus size={16}/> Create Term</span>}
                         </Button>
                     </form>
                </Card>

                {/* Right: Existing Terms */}
                <Card className="lg:col-span-2 rounded-3xl shadow-sm border-slate-100 bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                        <CardTitle className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                           Academic Sessions
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium pt-1">
                            Set the global active session. Only one term can be active at a time to prevent grading collisions.
                        </CardDescription>
                    </CardHeader>
                    <div className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent h-14 border-slate-100">
                                    <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Semester Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={3} className="p-4"><Skeleton className="h-14 w-full rounded-xl" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : semesters.length > 0 ? (
                                    semesters.map(semester => (
                                        <TableRow key={semester.id} className="hover:bg-slate-50/50 h-20 group border-slate-50 transition-colors">
                                            <TableCell className="pl-8 font-black text-slate-800">{semester.name}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={semester.is_active
                                                        ? "bg-emerald-50 text-emerald-600 border-0 font-black uppercase tracking-widest text-[9px] px-3 py-1.5"
                                                        : "bg-slate-50 text-slate-400 border-0 font-bold uppercase tracking-widest text-[9px] px-3 py-1.5"
                                                    }
                                                >
                                                    {semester.is_active ? (
                                                        <span className="flex items-center gap-1.5"><CheckCircle2 size={12}/> Global Active</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5"><Clock size={12}/> Inactive</span>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                {!semester.is_active && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={activatingId === semester.id}
                                                        onClick={() => handleActivate(semester.id)}
                                                        className="rounded-xl font-bold text-xs h-10 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                    >
                                                        {activatingId === semester.id ? <Loader2 size={14} className="animate-spin" /> : 'Activate Session'}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-20 text-center">
                                            <p className="font-bold text-slate-500">No defined academic terms yet.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
