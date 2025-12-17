const supabaseAdmin = require('../config/supabase');

// --- Programs ---

const getPrograms = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('programs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProgram = async (req, res) => {
    const { title, code, duration_years } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('programs')
            .insert([{ title, code, duration_years }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createProgramsBulk = async (req, res) => {
    const { programs } = req.body; // Expects array of { title, code, duration_years }
    try {
        if (!programs || !Array.isArray(programs) || programs.length === 0) {
            return res.status(400).json({ error: "Invalid data. Expected array of programs." });
        }

        const { data, error } = await supabaseAdmin
            .from('programs')
            .insert(programs)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- PLOs ---

const getPLOs = async (req, res) => {
    const { programId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('plos')
            .select('*')
            .eq('program_id', programId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPLO = async (req, res) => {
    const { program_id, title, description } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('plos')
            .insert([{ program_id, title, description }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getPrograms,
    createProgram,
    createProgramsBulk,
    getPLOs,
    createPLO
};
