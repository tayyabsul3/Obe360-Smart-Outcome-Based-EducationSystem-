const supabaseAdmin = require('../config/supabase');

// --- Assignments ---

const getAssignments = async (req, res) => {
    const { classId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('course_assignments')
            .select('*, course:courses(*), teacher:profiles(*)')
            .eq('class_id', classId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createAssignment = async (req, res) => {
    const { class_id, course_id, teacher_id } = req.body;
    try {
        // Check if assignment already exists
        const { data: existing } = await supabaseAdmin
            .from('course_assignments')
            .select('*')
            .match({ class_id, course_id })
            .single();

        if (existing) {
            // Update teacher if already exists
            const { data, error } = await supabaseAdmin
                .from('course_assignments')
                .update({ teacher_id })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            return res.json(data);
        }

        const { data, error } = await supabaseAdmin
            .from('course_assignments')
            .insert([{ class_id, course_id, teacher_id }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAssignments,
    createAssignment
};
