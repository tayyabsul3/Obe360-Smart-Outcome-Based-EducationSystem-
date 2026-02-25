const supabaseAdmin = require('../config/supabase');

// --- Assessments ---

const getAssessments = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('assessments')
            .select('*')
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createAssessment = async (req, res) => {
    const { course_id, title, type, description, drive_link } = req.body;
    console.log("Create Assessment Request:", { course_id, title, type, description, drive_link });
    try {
        const { data, error } = await supabaseAdmin
            .from('assessments')
            .insert([{ course_id, title, type, description, drive_link }])
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }
        res.json(data);
    } catch (error) {
        console.error("Create Assessment Exception:", error);
        res.status(400).json({ error: error.message });
    }
};

const deleteAssessment = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('assessments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Questions ---

const getQuestions = async (req, res) => {
    const { assessmentId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('assessment_questions')
            .select(`
        *,
        course_learning_outcomes (
            code,
            title
        )
      `)
            .eq('assessment_id', assessmentId)
            .order('question_number', { ascending: true }); // Simplistic sorting

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createQuestions = async (req, res) => {
    const { assessmentId } = req.params;
    const { questions } = req.body; // Array of { question_number, max_marks, clo_id }

    try {
        // 1. Prepare data
        const rows = questions.map(q => ({
            assessment_id: assessmentId,
            question_number: q.question_number,
            max_marks: parseInt(q.max_marks),
            clo_id: q.clo_id || null
        }));

        // 2. Insert
        const { data, error } = await supabaseAdmin
            .from('assessment_questions')
            .insert(rows)
            .select();

        if (error) throw error;

        // 3. Update total marks on parent assessment (Optional but good for UI)
        // We could do a sum query here or trigger. For now, let's keep it simple.

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Marks ---

const getMarks = async (req, res) => {
    const { assessmentId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('student_marks')
            .select(`
                *,
                assessment_questions!inner(assessment_id)
            `)
            .eq('assessment_questions.assessment_id', assessmentId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const saveMarks = async (req, res) => {
    const { updates } = req.body; // Array of { student_id, question_id, obtained_marks }

    try {
        // Upsert marks
        const { data, error } = await supabaseAdmin
            .from('student_marks')
            .upsert(updates, { onConflict: 'student_id, question_id' })
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAssessments,
    createAssessment,
    deleteAssessment,
    getQuestions,
    createQuestions,
    getMarks,
    saveMarks
};
