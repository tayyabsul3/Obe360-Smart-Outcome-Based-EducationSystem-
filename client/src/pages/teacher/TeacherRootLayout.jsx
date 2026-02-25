import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import TeacherSidebar from './TeacherSidebar';

export default function TeacherRootLayout() {
    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
            <Header />
            <div className="flex-1 flex overflow-hidden">
                <TeacherSidebar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
