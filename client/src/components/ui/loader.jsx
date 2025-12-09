import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Loader = ({ size = 'medium', className, fullScreen = false, text }) => {

    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
            {text && <p className="text-sm text-gray-500 font-medium animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
};
