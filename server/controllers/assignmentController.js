const supabaseAdmin = require('../config/supabase');

// --- Assignments ---

// --- Semester Assignments ---

const getAssignments = async (req, res) => {
    const { programId, semesterId } = req.query;
    try {
        let query = supabaseAdmin
            .from('semester_assignments')
            .select('*, course:courses(*), teacher:profiles(*)');

        if (programId) query = query.eq('program_id', programId);
        if (semesterId) query = query.eq('semester_id', semesterId);

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createAssignment = async (req, res) => {
    const { course_id, teacher_id, program_id, semester_id, semester_number } = req.body;
    try {
        // Just insert - the database's UNIQUE constraint on (course_id, teacher_id, program_id, semester_id) 
        // will automatically prevent assigning the SAME teacher twice, but allows DIFFERENT teachers!
        const { data, error } = await supabaseAdmin
            .from('semester_assignments')
            .insert([{ course_id, teacher_id, program_id, semester_id, semester_number }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: "This teacher is already assigned to this exact course in this session." });
            }
            throw error;
        }
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getTeacherAssignments = async (req, res) => {
    const { teacherId } = req.params;
    const { semesterId } = req.query; // Academic Session (Working Semester)
    try {
        let query = supabaseAdmin
            .from('semester_assignments')
            .select(`
                *,
                course:courses(*),
                program:programs(*)
            `)
            .eq('teacher_id', teacherId);

        if (semesterId) {
            query = query.eq('semester_id', semesterId);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllAssignments = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('semester_assignments')
            .select('*, course:courses(*), teacher:profiles(*), program:programs(*), semester:semesters(*)');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteAssignment = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('semester_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAssignments,
    createAssignment,
    getTeacherAssignments,
    getAllAssignments,
    deleteAssignment
};
