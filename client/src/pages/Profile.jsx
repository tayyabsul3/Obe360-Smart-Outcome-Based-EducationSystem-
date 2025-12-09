import useAuthStore from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
// import { Avatar } from '@/components/ui/avatar'; // Will add Avatar component briefly

export default function Profile() {
    const { user, role } = useAuthStore();

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <Card className="col-span-1">
                    <CardHeader className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl mb-4 border-4 border-white shadow-lg">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <CardTitle className="text-xl">{user?.user_metadata?.full_name}</CardTitle>
                        <p className="text-sm text-gray-500 capitalize">{role}</p>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-xs text-gray-400">User ID: {user.id.slice(0, 8)}...</p>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input type="email" id="email" value={user.email} disabled className="bg-gray-50" />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="fullname">Full Name</Label>
                            <Input type="text" id="fullname" value={user?.user_metadata?.full_name} disabled className="bg-gray-50" />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="role">System Role</Label>
                            <Input type="text" id="role" value={role} disabled className="capitalize bg-gray-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
