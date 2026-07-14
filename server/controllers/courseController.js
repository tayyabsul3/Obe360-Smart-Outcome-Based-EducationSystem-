const supabaseAdmin = require('../config/supabase');

// --- Courses ---

const getCourses = async (req, res) => {
    try {
        let query = supabaseAdmin.from('courses').select('*');
        
        if (req.adminId) {
            query = query.eq('admin_id', req.adminId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(404).json({ error: "Course not found" });
    }
};

const createCourse = async (req, res) => {
    const { title, code, credit_hours, lab_hours } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('courses')
            .insert([{ title, code, credit_hours, lab_hours, admin_id: req.adminId }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const createCoursesBulk = async (req, res) => {
    const { courses } = req.body;
    try {
        if (!courses || !Array.isArray(courses) || courses.length === 0) {
            return res.status(400).json({ error: "Invalid data. Expected array of courses." });
        }

        const mappedCourses = courses.map(c => ({
            ...c,
            admin_id: req.adminId
        }));

        const { data, error } = await supabaseAdmin
            .from('courses')
            .upsert(mappedCourses, { onConflict: 'admin_id, code' })
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Courses Edit/Delete ---

const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { title, code, credit_hours, lab_hours } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('courses')
            .update({ title, code, credit_hours, lab_hours })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Check for dependencies
        // Check Study Plan (program_courses)
        const { count: studyPlanCount } = await supabaseAdmin
            .from('program_courses')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', id);

        if (studyPlanCount > 0) {
            return res.status(400).json({ error: "Cannot delete course. It is currently mapped in a Study Plan." });
        }

        // Check Sections
        const { count: sectionCount } = await supabaseAdmin
            .from('sections')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', id);

        if (sectionCount > 0) {
            return res.status(400).json({ error: "Cannot delete course. It has active sections or assignments." });
        }

        // Check CLOs
        const { count: cloCount } = await supabaseAdmin
            .from('course_learning_outcomes')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', id);

        if (cloCount > 0) {
            return res.status(400).json({ error: "Cannot delete course. It has defined Course Learning Outcomes (CLOs)." });
        }

        // Check Enrollments
        const { count: enrollmentCount } = await supabaseAdmin
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', id);

        if (enrollmentCount > 0) {
            return res.status(400).json({ error: "Cannot delete course. Students are currently enrolled in it." });
        }

        // 2. Perform deletion if no dependencies
        const { error } = await supabaseAdmin
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Study Plan (Program Courses) ---

const getProgramCourses = async (req, res) => {
    const { programId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('program_courses')
            .select('*, course:courses(*)') // Join with courses table
            .eq('program_id', programId)
            .order('semester', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addCourseToProgram = async (req, res) => {
    const { program_id, course_id, semester, course_type, is_lab_embedded, programId, courseId } = req.body;

    const finalProgramId = program_id || programId;
    const finalCourseId = course_id || courseId;

    try {
        const { data, error } = await supabaseAdmin
            .from('program_courses')
            .insert([{ program_id: finalProgramId, course_id: finalCourseId, semester, course_type: course_type || 'Core', is_lab_embedded: is_lab_embedded || false }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const removeCourseFromProgram = async (req, res) => {
    const { mappingId } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('program_courses')
            .delete()
            .eq('id', mappingId);

        if (error) throw error;
        res.json({ message: "Course removed from study plan successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const addCoursesToStudyPlanBulk = async (req, res) => {
    const { items } = req.body; // Expects array of { program_code, course_code, semester }
    const adminId = req.adminId;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid data. Expected array of items." });
    }

    try {
        // 1. Fetch Programs and Courses scoped by this admin to map Codes to IDs
        let progQuery = supabaseAdmin.from('programs').select('id, code');
        if (adminId) progQuery = progQuery.eq('admin_id', adminId);
        const { data: programs, error: progError } = await progQuery;
        if (progError) throw progError;

        let courseQuery = supabaseAdmin.from('courses').select('id, code');
        if (adminId) courseQuery = courseQuery.eq('admin_id', adminId);
        const { data: courses, error: courseError } = await courseQuery;
        if (courseError) throw courseError;

        const programMap = new Map(programs.map(p => [p.code, p.id]));
        const courseMap = new Map(courses.map(c => [c.code, c.id]));

        const toInsert = [];
        const errors = [];

        for (const item of items) {
            const programId = programMap.get(item.program_code);
            const courseId = courseMap.get(item.course_code);

            if (programId && courseId) {
                toInsert.push({
                    program_id: programId,
                    course_id: courseId,
                    semester: parseInt(item.semester),
                    course_type: 'Core', // Defaulting to Core for now
                    is_lab_embedded: false,
                    admin_id: adminId // Store admin_id if table has it
                });
            } else {
                errors.push(`Could not map: ${item.program_code} - ${item.course_code}`);
            }
        }

        if (toInsert.length > 0) {
            // Use upsert to ignore duplicates instead of throwing database unique constraint errors
            const { data, error } = await supabaseAdmin
                .from('program_courses')
                .upsert(toInsert, { onConflict: 'program_id, course_id, semester', ignoreDuplicates: true })
                .select();

            if (error) throw error;
            res.json({ success: true, inserted: data ? data.length : 0, data, errors });
        } else {
            res.json({ success: false, inserted: 0, errors });
        }

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    createCoursesBulk,
    getProgramCourses,
    addCourseToProgram,
    removeCourseFromProgram,
    addCoursesToStudyPlanBulk,
    updateCourse,
    deleteCourse
};
