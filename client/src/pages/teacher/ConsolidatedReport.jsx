import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConsolidatedReport() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-full border-2 border-slate-100 flex items-center justify-center">
                        <FileText className="text-slate-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Consolidated Report</h2>
                        <p className="text-xs font-bold text-slate-400">Aggregated Performance Summary</p>
                    </div>
                </div>
                <Button variant="default" className="bg-blue-500 hover:bg-blue-600 font-bold h-8 px-3 rounded-md text-xs">
                    <Printer size={14} className="mr-1" /> Print Report
                </Button>
            </div>

            <Card className="border-0 shadow-sm rounded-xl bg-white overflow-hidden min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-2">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Consolidated Data Coming Soon</p>
                    <p className="text-xs text-slate-300">Generating comprehensive student assessment summary...</p>
                </div>
            </Card>
        </div>
    );
}
