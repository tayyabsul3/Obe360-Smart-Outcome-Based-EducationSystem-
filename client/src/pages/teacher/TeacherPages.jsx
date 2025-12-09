import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const MyCourses = () => (
    <Card>
        <CardHeader><CardTitle>My Courses</CardTitle></CardHeader>
        <CardContent>List of assigned courses.</CardContent>
    </Card>
);

export const OBEMapping = () => (
    <Card>
        <CardHeader><CardTitle>OBE Mapping</CardTitle></CardHeader>
        <CardContent>CLO-PLO Matrix mapping interface.</CardContent>
    </Card>
);

export const Assessments = () => (
    <Card>
        <CardHeader><CardTitle>Assessments</CardTitle></CardHeader>
        <CardContent>Create Quizzes, Mids, and Finals.</CardContent>
    </Card>
);

export const Gradebook = () => (
    <Card>
        <CardHeader><CardTitle>Gradebook</CardTitle></CardHeader>
        <CardContent>Enter student marks here.</CardContent>
    </Card>
);

export const Analytics = () => (
    <Card>
        <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
        <CardContent>Performance insights and graphs.</CardContent>
    </Card>
);

export const Gamification = () => (
    <Card>
        <CardHeader><CardTitle>Gamification</CardTitle></CardHeader>
        <CardContent>Leaderboards and badges.</CardContent>
    </Card>
);

export const Feedback = () => (
    <Card>
        <CardHeader><CardTitle>Feedback</CardTitle></CardHeader>
        <CardContent>Student course surveys.</CardContent>
    </Card>
);
