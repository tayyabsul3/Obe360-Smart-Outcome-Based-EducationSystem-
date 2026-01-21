const supabaseAdmin = require('../config/supabase');

const getCLOs = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .select('*')
            .eq('course_id', courseId)
            .order('code', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCLO = async (req, res) => {
    const { course_id, code, description, title, type, level, plo_id } = req.body;
    try {
        // 1. Create CLO
        const { data: clo, error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .insert([{ course_id, code, description, title, type, level }])
            .select()
            .single();

        if (error) throw error;

        // 2. Map to PLO (if provided)
        if (plo_id && plo_id !== 'none') {
            const { error: mapError } = await supabaseAdmin
                .from('clo_plo_mapping')
                .insert([{
                    clo_id: clo.id,
                    plo_id: plo_id,
                    level_of_emphasis: 'Medium' // Default or passed from frontend? User said "level/type configuration there as well" - maybe emphasis?
                    // User said: "Map to Existing PLO and level and type configuration" - Assuming 'level' meant Bloom's level on CLO.
                    // But mapping also has emphasis. Let's stick to simple mapping for now.
                }]);

            if (mapError) console.error("Mapping Error:", mapError);
        }

        res.json(clo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateCLO = async (req, res) => {
    const { id } = req.params;
    const { code, description, title, type, level, plo_id } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .update({ code, description, title, type, level })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update mapping if plo_id is present (Upsert logic is complex, maybe delete & insert?)
        // For simplicity, let's delete old mapping and insert new one if plo_id is provided
        if (plo_id) {
            await supabaseAdmin.from('clo_plo_mapping').delete().eq('clo_id', id);
            if (plo_id !== 'none') {
                await supabaseAdmin.from('clo_plo_mapping').insert([{ clo_id: id, plo_id }]);
            }
        }

        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteCLO = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: "CLO deleted" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCLOs,
    createCLO,
    updateCLO,
    deleteCLO
};
