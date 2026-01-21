import React from 'react';
import useLoaderStore from '@/store/loaderStore';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

const GlobalLoader = () => {
    const { isLoading } = useLoaderStore();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                {/* Custom Brand Loader */}
                <div className="relative flex items-center justify-center h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
                    <BookOpen className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="text-sm font-medium text-slate-600 animate-pulse">
                    OBE360
                </div>
            </div>
        </div>
    );
};

export default GlobalLoader;
