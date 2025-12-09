import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function Dashboard() {
    const { user, role, logout } = useAuthStore();
    const navigate = useNavigate();

    // Invite Form State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteStatus, setInviteStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setInviteStatus('');

        try {
            const response = await fetch('http://localhost:5000/api/invite-teacher', { // Ensure port matches backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: inviteEmail, fullName: inviteName })
            });

            const data = await response.json();

            if (response.ok) {
                setInviteStatus(`Success: ${data.message}`);
                setInviteEmail('');
                setInviteName('');
            } else {
                setInviteStatus(`Error: ${data.error}`);
            }
        } catch (error) {
            setInviteStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome, {user?.email} ({role})</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>

            {role === 'admin' ? (
                <div className="max-w-md">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invite Teacher</CardTitle>
                            <CardDescription>Send an invitation email with credentials to a new teacher.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="i-name">Full Name</Label>
                                    <Input
                                        id="i-name"
                                        placeholder="Teacher Name"
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="i-email">Email Address</Label>
                                    <Input
                                        id="i-email"
                                        type="email"
                                        placeholder="teacher@school.edu"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {inviteStatus && (
                                    <p className={`text-sm ${inviteStatus.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                                        {inviteStatus}
                                    </p>
                                )}
                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? 'Sending Invite...' : 'Send Invitation'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Teacher Portal</CardTitle>
                            <CardDescription>Access your courses and students here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content for teachers goes here...</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
