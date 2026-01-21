import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';

export default function TeacherRootLayout() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <Outlet />
            </div>
        </div>
    );
}
