import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        (<input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props} />)
    );
})
Input.displayName = "Input"

export { Input }
