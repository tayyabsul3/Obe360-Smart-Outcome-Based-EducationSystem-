import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import useSemesterStore from '@/store/semesterStore';

export default function AdminRootLayout() {
    const { fetchSemesters, fetchPrograms } = useSemesterStore();

    useEffect(() => {
        fetchSemesters();
        fetchPrograms();
    }, [fetchSemesters, fetchPrograms]);

    return (
        <div className="flex h-[100dvh] w-full bg-[#F4F7F9] overflow-hidden font-sans">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader />

                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
