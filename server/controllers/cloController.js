const supabaseAdmin = require('../config/supabase');

const getCLOMappings = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('clo_plo_mapping')
            .select('*')
            .eq('clo_id', id);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCLOs = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .select(`
                *,
                clo_plo_mapping (
                    plo_id,
                    learning_type,
                    level,
                    emphasis_level
                )
            `)
            .eq('course_id', courseId)
            .order('code', { ascending: true });

        if (error) throw error;

        const flattenedData = data.map(c => {
            const mapping = c.clo_plo_mapping && c.clo_plo_mapping.length > 0 ? c.clo_plo_mapping[0] : null;
            return {
                ...c,
                plo_id: mapping ? mapping.plo_id : null,
                learning_type: mapping ? mapping.learning_type : c.type || 'Cognitive',
                mapping_level: mapping ? mapping.level : c.level || 'C1',
                emphasis_level: mapping ? mapping.emphasis_level : null
            };
        });

        res.json(flattenedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCLO = async (req, res) => {
    const { course_id, code, description, title, type, level, plo_id, is_active } = req.body;
    try {
        // 1. Create CLO
        const { data: clo, error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .insert([{
                course_id,
                code,
                description,
                title: title || description.substring(0, 50),
                type,
                level: req.body.level || 'C1',
                is_active: is_active ?? true
            }])
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
                    learning_type: req.body.learning_type || type || 'Cognitive',
                    level: req.body.level || 'C1',
                    emphasis_level: req.body.emphasis_level || 'Medium'
                }]);

            if (mapError) throw mapError;
        }

        res.json(clo);
    } catch (error) {
        console.error("CLO CREATE ERROR:", error);
        res.status(400).json({ error: error.message });
    }
};

const updateCLO = async (req, res) => {
    const { id } = req.params;
    const { code, description, title, type, level, plo_id, is_active } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .update({
                code,
                description,
                title: title || description.substring(0, 50),
                type,
                level: req.body.level || 'C1',
                is_active: is_active ?? true
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update mapping if plo_id is present in the request payload (including null or 'none')
        if (plo_id !== undefined) {
            await supabaseAdmin.from('clo_plo_mapping').delete().eq('clo_id', id);
            if (plo_id && plo_id !== 'none') {
                const { error: mapError } = await supabaseAdmin.from('clo_plo_mapping').insert([{
                    clo_id: id,
                    plo_id,
                    learning_type: req.body.learning_type || type || 'Cognitive',
                    level: req.body.level || 'C1',
                    emphasis_level: req.body.emphasis_level || 'Medium'
                }]);
                if (mapError) throw mapError;
            }
        }

        res.json(data);
    } catch (error) {
        console.error("CLO UPDATE ERROR:", error);
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

const mapCLOtoPLO = async (req, res) => {
    const { clo_id, plo_id, learning_type, level, emphasis_level } = req.body;
    try {
        // Delete existing mapping if any
        await supabaseAdmin.from('clo_plo_mapping').delete().eq('clo_id', clo_id);

        if (plo_id && plo_id !== 'none') {
            const { data, error } = await supabaseAdmin
                .from('clo_plo_mapping')
                .insert([{
                    clo_id,
                    plo_id,
                    learning_type: learning_type || 'Cognitive',
                    level: level || 'C1',
                    emphasis_level: emphasis_level || 'Medium'
                }])
                .select()
                .single();

            if (error) throw error;
            res.json(data);
        } else {
            res.json({ message: "Mapping removed" });
        }
    } catch (error) {
        console.error("CLO MAPPING ERROR:", error);
        res.status(400).json({ error: error.message });
    }
};

const bulkCreateCLOs = async (req, res) => {
    const { course_id, clos } = req.body; // Array of { code, description, type, title }
    try {
        if (!clos || !Array.isArray(clos)) throw new Error("Invalid CLO data");

        const formattedClos = clos.map(c => ({
            course_id,
            code: c.code,
            description: c.description,
            title: c.title || c.description.substring(0, 50),
            type: c.type || 'Cognitive',
            is_active: true
        }));

        const { data, error } = await supabaseAdmin
            .from('course_learning_outcomes')
            .insert(formattedClos)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("CLO BULK CREATE ERROR:", error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCLOs,
    getCLOMappings,
    createCLO,
    updateCLO,
    deleteCLO,
    mapCLOtoPLO,
    bulkCreateCLOs
};
