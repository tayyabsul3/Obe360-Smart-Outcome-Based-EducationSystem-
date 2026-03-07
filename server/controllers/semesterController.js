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

const setActiveSemester = async (req, res) => {
    const { id } = req.params;
    try {
        // Deactivate all
        await supabaseAdmin
            .from('semesters')
            .update({ is_active: false })
            .neq('id', 'placeholder_to_update_all'); // Small hack: neq 'null' or just passing a widespread truthy condition since Supabase needs a filter for bulk update if RLS is on, but service_role can bypass. Let's use `neq('id', 0)`.

        const { error: deactivateError } = await supabaseAdmin
            .from('semesters')
            .update({ is_active: false })
            .neq('id', id);

        if (deactivateError) throw deactivateError;

        // Activate the target
        const { data, error } = await supabaseAdmin
            .from('semesters')
            .update({ is_active: true })
            .eq('id', id)
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
    setActiveSemester,
    getTeacherSections,
    createSection
};
