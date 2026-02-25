const supabaseAdmin = require('../config/supabase');

// --- Semesters ---

const getSemesters = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('semesters')
            .select('*')
            .order('name', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createSemester = async (req, res) => {
    const { name, is_active } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('semesters')
            .insert([{ name, is_active }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Sections ---

const getTeacherSections = async (req, res) => {
    const { teacherId, semesterId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('sections')
            .select('*, course:courses(id, title, code)')
            .eq('teacher_id', teacherId)
            .eq('semester_id', semesterId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createSection = async (req, res) => {
    const { course_id, semester_id, teacher_id, name } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('sections')
            .insert([{ course_id, semester_id, teacher_id, name }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getSemesters,
    createSemester,
    getTeacherSections,
    createSection
};
