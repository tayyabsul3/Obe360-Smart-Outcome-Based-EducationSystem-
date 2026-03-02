import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
    return (
        <div className="flex h-screen bg-[#F4F7F9] overflow-hidden font-sans">
            {/* Sidebar (Includes both Primary & Secondary) */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header (Includes both Main & Nav Bar) */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>

                {/* Footer / Status Bar (Optional) */}
                <footer className="h-6 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>OBE 360 v2.0 - Outcome Based Education System</span>
                    <span>System Time: {new Date().toLocaleTimeString()}</span>
                </footer>
            </div>
        </div>
    );
}
