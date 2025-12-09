import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/loader';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import ObeLogo from '@/components/Logo';

export default function ChangePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user, updatePassword } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);
        const result = await updatePassword(user?.id, password);
        setIsLoading(false);

        if (result.success) {
            await useAuthStore.getState().logout(); // Logout after update
            toast.success("Password updated successfully!", { description: "Please log in with your new password." });
            navigate('/login');
        } else {
            toast.error("Failed to update password", { description: result.error });
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8 space-y-6">
                <div className="text-center space-y-2 flex flex-col items-center">
                    <ObeLogo className="w-12 h-12 text-blue-600 mb-2" />
                    <h1 className="text-2xl font-bold text-gray-900">Security Update Required</h1>
                    <div className="flex items-center gap-2 justify-center text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-100 text-sm">
                        <ShieldAlert size={16} />
                        <span>Please set a new password to continue.</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-gray-50 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-gray-50 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span>Updating...</span>
                            </div>
                        ) : (
                            'Set New Password'
                        )}
                    </Button>
                </form>
            </div>

            <button
                onClick={async () => { await useAuthStore.getState().logout(); navigate('/login'); }}
                className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline"
            >
                Logout and return to Login
            </button>
        </div>
    );
}
