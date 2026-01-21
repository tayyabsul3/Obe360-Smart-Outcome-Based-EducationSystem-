import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaseUpper } from "lucide-react";
import useUIStore from "@/store/uiStore";

export default function TextResizer() {
    const { fontScale, setFontScale } = useUIStore();

    const scales = {
        small: 'Text: Small',
        medium: 'Text: Medium',
        large: 'Text: Large'
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Adjust Text Size">
                    <CaseUpper className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Adjust Text Size</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFontScale('small')} className={fontScale === 'small' ? 'bg-accent' : ''}>
                    Small
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontScale('medium')} className={fontScale === 'medium' ? 'bg-accent' : ''}>
                    Medium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontScale('large')} className={fontScale === 'large' ? 'bg-accent' : ''}>
                    Large
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
