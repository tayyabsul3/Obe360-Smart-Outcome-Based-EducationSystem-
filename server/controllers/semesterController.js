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
    const id = req.params.id.trim();
    console.log('Activating semester ID:', id);
    try {
        // 1. Deactivate any currently active semesters
        const { error: deactivateError } = await supabaseAdmin
            .from('semesters')
            .update({ is_active: false })
            .eq('is_active', true);

        if (deactivateError) {
            console.error('Deactivation error:', deactivateError);
            throw deactivateError;
        }

        // 2. Activate the target semester
        const { data, error } = await supabaseAdmin
            .from('semesters')
            .update({ is_active: true })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Activation error:', error);
            throw error;
        }
        
        console.log('Update result data:', data);
        
        // Return the first (and only) updated row, or 404 if not found
        if (!data || data.length === 0) {
            console.warn('No semester found with ID:', id);
            return res.status(404).json({ 
                error: "Semester not found",
                message: `No semester matches the provided ID: ${id}`
            });
        }
        
        res.json(data[0]);
    } catch (error) {
        console.error('Catch block error:', error);
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
