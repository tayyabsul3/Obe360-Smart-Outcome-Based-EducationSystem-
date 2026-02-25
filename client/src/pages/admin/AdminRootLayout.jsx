import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminRootLayout() {
    return (
        <div className="flex h-screen bg-[#F4F7F9] overflow-hidden font-sans">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader />

                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>

                <footer className="h-6 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>Qobe Admin v2.0 - Management Console</span>
                    <span>System Time: {new Date().toLocaleTimeString()}</span>
                </footer>
            </div>
        </div>
    );
}
