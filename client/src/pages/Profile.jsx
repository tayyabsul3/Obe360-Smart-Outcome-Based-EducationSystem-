import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Profile() {
    const { user, role, updateProfile, updatePassword } = useAuthStore();
    
    const [fullName, setFullName] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
        }
    }, [user]);

    if (!user) return <div>Loading...</div>;

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        const res = await updateProfile(user.id, fullName);
        setIsSavingProfile(false);
        if (res.success) {
            toast.success("Profile updated successfully!");
            setIsEditingProfile(false);
        } else {
            toast.error("Failed to update profile", { description: res.error });
        }
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setIsSavingPassword(true);
        const res = await updatePassword(user.id, newPassword, oldPassword, user.email);
        setIsSavingPassword(false);
        if (res.success) {
            toast.success("Password updated successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast.error("Failed to update password", { description: res.error });
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
                <p className="text-slate-500 font-medium">Manage your personal information and security settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <Card className="col-span-1 rounded-3xl shadow-sm border-slate-100 h-fit bg-white p-6">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl mb-4 border-4 border-white shadow-lg shadow-blue-500/20">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight text-center">{user?.user_metadata?.full_name}</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{role}</p>
                        
                        <div className="mt-8 w-full bg-slate-50 rounded-2xl p-4 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">User ID</p>
                            <p className="text-xs text-slate-700 font-mono font-medium truncate">{user.id}</p>
                        </div>
                    </div>
                </Card>

                {/* Details & Settings */}
                <div className="col-span-1 lg:col-span-2 space-y-8">
                    
                    {/* Personal Information */}
                    <Card className="rounded-3xl shadow-sm border-slate-100 bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Personal Information</CardTitle>
                            {!isEditingProfile && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="rounded-full text-xs font-bold px-4">
                                    Edit Profile
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</Label>
                                        <Input type="email" value={user.email} disabled className="bg-slate-50 h-12 rounded-xl font-medium border-slate-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Role</Label>
                                        <Input type="text" value={role} disabled className="bg-slate-50 h-12 rounded-xl font-medium border-slate-200 capitalize" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</Label>
                                        <Input 
                                            type="text" 
                                            value={fullName} 
                                            onChange={(e) => setFullName(e.target.value)} 
                                            disabled={!isEditingProfile} 
                                            className={`h-12 rounded-xl font-medium ${!isEditingProfile ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-200 focus-visible:ring-blue-500/20'}`} 
                                            required
                                        />
                                    </div>
                                </div>
                                {isEditingProfile && (
                                    <div className="flex gap-3 justify-end pt-4">
                                        <Button type="button" variant="ghost" onClick={() => { setIsEditingProfile(false); setFullName(user.user_metadata?.full_name || ''); }} className="rounded-xl font-bold">Cancel</Button>
                                        <Button type="submit" disabled={isSavingProfile} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 px-6">
                                            {isSavingProfile ? <Loader2 size={16} className="animate-spin mr-2" /> : null} Save Changes
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card className="rounded-3xl shadow-sm border-slate-100 bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                            <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Security Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSavePassword} className="space-y-6">
                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Password</Label>
                                        <Input 
                                            type="password" 
                                            value={oldPassword} 
                                            onChange={(e) => setOldPassword(e.target.value)} 
                                            required 
                                            className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500/20" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Password</Label>
                                        <Input 
                                            type="password" 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)} 
                                            required 
                                            minLength={6}
                                            className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500/20" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirm New Password</Label>
                                        <Input 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                            required 
                                            minLength={6}
                                            className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500/20" 
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isSavingPassword || !oldPassword || !newPassword || !confirmPassword} className="rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white px-8">
                                    {isSavingPassword ? <Loader2 size={16} className="animate-spin mr-2" /> : null} Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
