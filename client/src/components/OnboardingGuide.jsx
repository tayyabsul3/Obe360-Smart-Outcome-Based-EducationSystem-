import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, ChevronLeft, ChevronRight, CheckSquare, GitMerge, FileSpreadsheet, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnboardingGuide({ open, onOpenChange, role }) {
    const [currentStep, setCurrentStep] = useState(0);

    const adminSteps = [
        {
            title: "Welcome to OBE360 Admin Workspace",
            description: "Here is a quick walkthrough to get your university setup with our smart Outcome-Based Education system.",
            icon: GraduationCap,
            color: "text-blue-600 bg-blue-50 border-blue-100",
            bullets: [
                "Establish departments and academic degree programs.",
                "Populate the catalog with course definitions.",
                "Map student records and teacher allocations.",
                "All data is fully isolated under your organization context."
            ]
        },
        {
            title: "Step 1: Set Up Programs & Roadmap",
            description: "First, head to the Programs section on the sidebar.",
            icon: GitMerge,
            color: "text-purple-600 bg-purple-50 border-purple-100",
            bullets: [
                "Add your programs (e.g. BSCS, BSSE) with durations.",
                "Define Program Learning Outcomes (PLOs).",
                "Open the Program roadmap to assign courses to each semester."
            ]
        },
        {
            title: "Step 2: Load Courses Catalog",
            description: "Go to the Course Repository on the sidebar.",
            icon: FileSpreadsheet,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100",
            bullets: [
                "Load our 70-course predefined BSCS template to start instantly.",
                "Import your own course catalog list using a CSV template.",
                "Use bulk select checkboxes and action bar to manage courses easily."
            ]
        },
        {
            title: "Step 3: Setup Classes & Assignments",
            description: "Finalize the configuration.",
            icon: Users,
            color: "text-orange-600 bg-orange-50 border-orange-100",
            bullets: [
                "Create student Classes & academic sections.",
                "Assign teachers to specific courses for the current term in the Assignments tab.",
                "Teachers will automatically see their classes upon logging in."
            ]
        }
    ];

    const teacherSteps = [
        {
            title: "Welcome to OBE360 Teacher Workspace",
            description: "This guide will show you how to map outcomes, track student progress, and grade assessments.",
            icon: BookOpen,
            color: "text-blue-600 bg-blue-50 border-blue-100",
            bullets: [
                "View your active course assignments in My Courses.",
                "Manage Course Learning Outcomes (CLOs) for your courses.",
                "Map assessments to outcomes to automatically generate OBE metrics."
            ]
        },
        {
            title: "Step 1: Define CLOs & Maps",
            description: "Set the foundations for your assigned course.",
            icon: GitMerge,
            color: "text-purple-600 bg-purple-50 border-purple-100",
            bullets: [
                "Enter Course Learning Outcomes (CLOs) for your assigned courses.",
                "Map each CLO to the corresponding Program Learning Outcome (PLO).",
                "Establish grading weights and rubrics."
            ]
        },
        {
            title: "Step 2: Add Students & Sections",
            description: "Keep track of active enrollments.",
            icon: Users,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100",
            bullets: [
                "Create your active class sections.",
                "Import student records and enroll them into your section.",
                "Student logs will form the basis of CLO/PLO outcome graphs."
            ]
        },
        {
            title: "Step 3: Create Assessments & Gradebook",
            description: "Obtain attainment metrics.",
            icon: CheckSquare,
            color: "text-orange-600 bg-orange-50 border-orange-100",
            bullets: [
                "Create exams, quizzes, or assignments mapped to specific CLOs.",
                "Enter scores in the Gradebook to automatically calculate attainment rates.",
                "Check CLO Attainment graphs to identify learning gaps dynamically."
            ]
        }
    ];

    const steps = role === 'admin' ? adminSteps : teacherSteps;
    const activeStep = steps[currentStep] || steps[0];
    const StepIcon = activeStep.icon;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onOpenChange(false);
            setCurrentStep(0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) setCurrentStep(0); }}>
            <DialogContent className="max-w-xl rounded-[2rem] border-0 shadow-2xl p-10 bg-white">
                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className={cn("p-4 rounded-2xl border transition-all", activeStep.color)}>
                        <StepIcon size={32} />
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                        {activeStep.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500 max-w-sm">
                        {activeStep.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100/50 space-y-3">
                    {activeStep.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            <span className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                            <span className="text-xs text-slate-650 font-semibold leading-relaxed">{bullet}</span>
                        </div>
                    ))}
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center items-center gap-1.5 mt-8">
                    {steps.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={cn(
                                "h-2 rounded-full transition-all duration-300", 
                                currentStep === idx ? "w-6 bg-blue-600" : "w-2 bg-slate-200"
                            )}
                        />
                    ))}
                </div>

                <DialogFooter className="mt-8 flex items-center justify-between sm:justify-between w-full">
                    <Button 
                        variant="ghost" 
                        onClick={handleBack} 
                        disabled={currentStep === 0}
                        className="rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-widest text-slate-500"
                    >
                        <ChevronLeft size={16} className="mr-1" /> Back
                    </Button>
                    <Button 
                        onClick={handleNext}
                        className="rounded-xl h-12 px-8 bg-slate-900 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest transition-all"
                    >
                        {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight size={16} className="ml-1" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
