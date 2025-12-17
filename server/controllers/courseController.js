const supabaseAdmin = require('../config/supabase');

// --- Courses ---

const getCourses = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('courses')
            .select('*')
            .order('code', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCourse = async (req, res) => {
    const { title, code, credit_hours, lab_hours } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('courses')
            .insert([{ title, code, credit_hours, lab_hours }])
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

        const { data, error } = await supabaseAdmin
            .from('courses')
            .insert(courses)
            .select();

        if (error) throw error;
        res.json(data);
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
    const { program_id, course_id, semester, course_type, is_lab_embedded } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('program_courses')
            .insert([{ program_id, course_id, semester, course_type, is_lab_embedded }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const addCoursesToStudyPlanBulk = async (req, res) => {
    const { items } = req.body; // Expects array of { program_code, course_code, semester }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid data. Expected array of items." });
    }

    try {
        // 1. Fetch all Programs and Courses to map Codes to IDs
        // Optimization: In a real app, we might query only relevant ones, but for now fetch all is fine for small scale.
        const { data: programs, error: progError } = await supabaseAdmin.from('programs').select('id, code');
        if (progError) throw progError;

        const { data: courses, error: courseError } = await supabaseAdmin.from('courses').select('id, code');
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
                    is_lab_embedded: false
                });
            } else {
                errors.push(`Could not map: ${item.program_code} - ${item.course_code}`);
            }
        }

        if (toInsert.length > 0) {
            const { data, error } = await supabaseAdmin
                .from('program_courses')
                .insert(toInsert)
                .select();

            if (error) throw error;
            res.json({ success: true, inserted: data.length, data, errors });
        } else {
            res.json({ success: false, inserted: 0, errors });
        }

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCourses,
    createCourse,
    createCoursesBulk,
    getProgramCourses,
    addCourseToProgram,
    addCoursesToStudyPlanBulk
};
