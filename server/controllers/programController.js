const supabaseAdmin = require('../config/supabase');

// --- Programs ---

const getPrograms = async (req, res) => {
    try {
        let query = supabaseAdmin.from('programs').select('*');
        
        if (req.adminId) {
            query = query.eq('admin_id', req.adminId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProgram = async (req, res) => {
    let { title, code, duration_years } = req.body;
    duration_years = parseInt(duration_years, 10) || 4; // Crucial fix for false-positive RLS error
    try {
        const { data, error } = await supabaseAdmin
            .from('programs')
            .insert([{ title, code, duration_years, admin_id: req.adminId }])
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

        // Add admin_id to all bulk programs
        const mappedPrograms = programs.map(p => ({
            ...p,
            admin_id: req.adminId
        }));

        const { data, error } = await supabaseAdmin
            .from('programs')
            .insert(mappedPrograms)
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

const getAllPLOsCount = async (req, res) => {
    try {
        let query = supabaseAdmin
            .from('plos')
            .select('*, program:programs!inner(admin_id)', { count: 'exact', head: true });

        if (req.adminId) {
            query = query.eq('program.admin_id', req.adminId);
        }

        const { count, error } = await query;

        if (error) throw error;
        res.json({ count: count || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPLO = async (req, res) => {
    const { program_id, title, description } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: "Title is required." });
    }

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

        const isValid = plos.every(p => p.title);
        if (!isValid) {
            return res.status(400).json({ error: "Title is required for all PLOs." });
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
        // 1. Find all courses in this program's study plan
        const { data: programCourses, error: pcError } = await supabaseAdmin
            .from('program_courses')
            .select('course_id')
            .eq('program_id', id);

        if (pcError) throw pcError;
        const courseIds = programCourses ? programCourses.map(pc => pc.course_id) : [];

        // 2. Delete associated PLOs
        await supabaseAdmin.from('plos').delete().eq('program_id', id);

        // 3. Delete the program itself (this cascades to program_courses, semester_assignments)
        const { error: deleteError } = await supabaseAdmin
            .from('programs')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // 4. Clean up courses that are no longer used by any other program
        if (courseIds.length > 0) {
            const { data: activeCourses, error: activeErr } = await supabaseAdmin
                .from('program_courses')
                .select('course_id')
                .in('course_id', courseIds);

            if (!activeErr) {
                const activeCourseIds = new Set(activeCourses ? activeCourses.map(ac => ac.course_id) : []);
                const orphanCourseIds = courseIds.filter(cid => !activeCourseIds.has(cid));

                if (orphanCourseIds.length > 0) {
                    // Delete orphan courses (cascades to course_learning_outcomes, assessments, enrollments, etc.)
                    await supabaseAdmin
                        .from('courses')
                        .delete()
                        .in('id', orphanCourseIds);
                    console.log(`[CASCADE CLEANUP] Deleted orphan courses: ${orphanCourseIds.join(', ')}`);
                }
            }
        }

        res.json({ message: "Program and associated data deleted successfully" });
    } catch (error) {
        console.error("Delete Program error:", error);
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
    getAllPLOsCount,
    createPLO,
    createPLOsBulk,
    updatePLO,
    deletePLO
};
