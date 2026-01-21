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
            .eq('program_id', programId)
            .order('plo_number', { ascending: true }); // Order by number

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPLOsByCourse = async (req, res) => {
    const { courseId } = req.params;
    try {
        // 1. Get Program ID from program_courses (Many-to-Many but usually 1-to-1 in simple OBE)
        // We'll take the first one if multiple exist, or fetch all PLOs for all programs.
        // For now, let's assume specific context or just fetch unique PLOs from all assigned programs.

        const { data: links, error: lError } = await supabaseAdmin
            .from('program_courses')
            .select('program_id')
            .eq('course_id', courseId);

        if (lError) throw lError;
        if (!links || links.length === 0) return res.json([]); // No program assigned

        const programIds = links.map(l => l.program_id);

        // 2. Get PLOs
        const { data, error } = await supabaseAdmin
            .from('plos')
            .select('*')
            .in('program_id', programIds)
            .order('plo_number', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPLO = async (req, res) => {
    const { program_id, title, description } = req.body;
    try {
        // 1. Get current max number
        const { data: maxData, error: maxError } = await supabaseAdmin
            .from('plos')
            .select('plo_number')
            .eq('program_id', program_id)
            .order('plo_number', { ascending: false })
            .limit(1);

        const nextNumber = (maxData && maxData.length > 0) ? (maxData[0].plo_number + 1) : 1;

        const { data, error } = await supabaseAdmin
            .from('plos')
            .insert([{
                program_id,
                title,
                description,
                plo_number: nextNumber
            }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createPLOsBulk = async (req, res) => {
    const { program_id, plos } = req.body; // Expects { program_id, plos: [{ title, description }] }
    try {
        if (!plos || !Array.isArray(plos) || plos.length === 0) {
            return res.status(400).json({ error: "Invalid data." });
        }

        // 1. Get current max number
        const { data: maxData } = await supabaseAdmin
            .from('plos')
            .select('plo_number')
            .eq('program_id', program_id)
            .order('plo_number', { ascending: false })
            .limit(1);

        let nextNumber = (maxData && maxData.length > 0) ? (maxData[0].plo_number + 1) : 1;

        // 2. Assign numbers
        const plosWithNumbers = plos.map(p => ({
            program_id,
            title: p.title,
            description: p.description,
            plo_number: nextNumber++
        }));

        const { data, error } = await supabaseAdmin
            .from('plos')
            .insert(plosWithNumbers)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Programs (Edit/Delete) ---

const updateProgram = async (req, res) => {
    const { id } = req.params;
    const { title, code, duration_years } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('programs')
            .update({ title, code, duration_years })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteProgram = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('programs')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "Program deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- PLOs (Edit/Delete) ---

const updatePLO = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('plos')
            .update({ title, description })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deletePLO = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('plos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "PLO deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getPrograms,
    createProgram,
    createProgramsBulk,
    updateProgram,
    deleteProgram,
    getPLOs,
    getPLOsByCourse,
    createPLO,
    createPLOsBulk,
    updatePLO,
    deletePLO
};
