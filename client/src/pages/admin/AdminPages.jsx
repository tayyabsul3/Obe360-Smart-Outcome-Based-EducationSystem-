import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/loader';

export const UserManagement = () => {
    const [activeTab, setActiveTab] = useState("invite");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { inviteTeacher, user } = useAuthStore();

    // Mock Data for Table (Frontend only for now)
    const [invitations, setInvitations] = useState([
        { id: 1, email: 'dr.sarah@uni.edu', name: 'Dr. Sarah Connor', status: 'pending', date: '2025-12-09' },
        { id: 2, email: 'prof.x@uni.edu', name: 'Prof. Charles Xavier', status: 'accepted', date: '2025-12-08' },
    ]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // 1. Invite Teacher via Backend (SendGrid handles email now)
        const result = await inviteTeacher(inviteEmail, inviteName, user?.id);

        if (result.success) {
            toast.success("Invitation Sent Successfully", { description: `Email sent to ${inviteEmail} via SendGrid.` });

            // Add to local table
            setInvitations([{
                id: Date.now(),
                email: inviteEmail,
                name: inviteName,
                status: 'pending',
                date: new Date().toISOString().split('T')[0]
            }, ...invitations]);

            setInviteEmail("");
            setInviteName("");
        } else {
            toast.error("Invitation failed", { description: result.error });
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
                <p className="text-gray-500">Manage access and onboarding for faculty members.</p>
            </div>

            <Tabs defaultValue="invite" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-12 p-1 bg-slate-100/80 backdrop-blur">
                    <TabsTrigger value="invite" className="h-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
                        <UserPlus size={18} className="mr-2" /> Invite Teachers
                    </TabsTrigger>
                    <TabsTrigger value="students" className="h-full">
                        Students (Coming Soon)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invite" className="space-y-6">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left: Invite Form */}
                        <Card className="lg:col-span-1 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <Mail className="text-blue-600" size={20} />
                                    Send Invitation
                                </CardTitle>
                                <CardDescription>Create account & email credentials.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleInvite} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullname" className="text-slate-600">Full Name</Label>
                                        <Input
                                            id="fullname"
                                            placeholder="e.g. Dr. John Doe"
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                            required
                                            className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-600">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john.doe@university.edu"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                            className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 shadow-blue-200/50 shadow-lg transition-all" disabled={isLoading}>
                                        {isLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                <span>Sending...</span>
                                            </div>
                                        ) : (
                                            'Send Invitation'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Right: Info & Recent Invites Table */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Info Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
                                <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900">Secure Onboarding Pipeline</h3>
                                    <p className="text-sm text-blue-700/80 mt-1 leading-relaxed">
                                        Teachers receive a temporary password via email. The system enforces a
                                        <strong> Mandatory Password Change</strong> policy upon their first login to ensure account security.
                                    </p>
                                </div>
                            </div>

                            {/* Table Card */}
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                    <CardTitle className="text-base font-medium text-slate-700">Recent Invitations</CardTitle>
                                </CardHeader>
                                <div className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Teacher Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invitations.map((invite) => (
                                                <TableRow key={invite.id} className="hover:bg-slate-50/50">
                                                    <TableCell className="font-medium text-slate-700">{invite.name}</TableCell>
                                                    <TableCell className="text-slate-500">{invite.email}</TableCell>
                                                    <TableCell className="text-slate-400">{invite.date}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant={invite.status === 'accepted' ? 'default' : 'secondary'}
                                                            className={invite.status === 'accepted'
                                                                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100 shadow-none"
                                                                : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-none"
                                                            }
                                                        >
                                                            {invite.status === 'accepted' ? (
                                                                <span className="flex items-center gap-1"><CheckCircle size={10} /> Active</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1"><Clock size={10} /> Pending</span>
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="students">
                    <Card>
                        <CardHeader><CardTitle>Student Management</CardTitle></CardHeader>
                        <CardContent>Coming Soon...</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// ... exports for other components ...
export const AcademicPrograms = () => (
    <Card>
        <CardHeader><CardTitle>Academic Programs</CardTitle></CardHeader>
        <CardContent>Setup Departments, Batches, and PLOs.</CardContent>
    </Card>
);

export const CurriculumManager = () => (
    <Card>
        <CardHeader><CardTitle>Curriculum Manager</CardTitle></CardHeader>
        <CardContent>Create courses and structure hierarchy.</CardContent>
    </Card>
);

export const CourseAllocation = () => (
    <Card>
        <CardHeader><CardTitle>Course Allocation</CardTitle></CardHeader>
        <CardContent>Assign courses to teachers.</CardContent>
    </Card>
);

export const ReportsCenter = () => (
    <Card>
        <CardHeader><CardTitle>Reports Center</CardTitle></CardHeader>
        <CardContent>Generate Accreditation Reports.</CardContent>
    </Card>
);

export const AdminSettings = () => (
    <Card>
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent>System configuration.</CardContent>
    </Card>
);
