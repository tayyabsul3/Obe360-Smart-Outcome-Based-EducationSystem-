const supabaseAdmin = require('../config/supabase');

// --- Classes ---

const getClasses = async (req, res) => {
    const { programId } = req.query;
    try {
        let query = supabaseAdmin.from('classes').select('*, program:programs(code)');

        if (programId) {
            query = query.eq('program_id', programId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createClass = async (req, res) => {
    const { program_id, name, semester, section, academic_session } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('classes')
            .insert([{ program_id, name, semester, section, academic_session }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getClasses,
    createClass
};
