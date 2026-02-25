import { Outlet } from 'react-router-dom';

export default function TeacherCourseLayout() {
    return (
        <div className="w-full">
            <Outlet />
        </div>
    );
}
