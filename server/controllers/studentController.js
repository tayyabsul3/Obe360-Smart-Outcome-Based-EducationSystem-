const supabaseAdmin = require('../config/supabase');

const getCourseStudents = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .select(`
                student_id,
                students (
                    id,
                    name,
                    reg_no,
                    email
                )
            `)
            .eq('course_id', courseId);

        if (error) throw error;

        // Flatten structure
        const students = data.map(item => item.students);
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CRUD ---

const getStudents = async (req, res) => {
    const { batch } = req.query;
    try {
        let query = supabaseAdmin
            .from('students')
            .select('*')
            .order('reg_no', { ascending: true });

        if (batch) {
            query = query.eq('batch', batch);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createStudent = async (req, res) => {
    const { name, reg_no, email, batch } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('students')
            .insert([{ name, reg_no, email, batch }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message }); // Unique constraint violation likely
    }
};

const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { name, reg_no, email, batch } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('students')
            .update({ name, reg_no, email, batch })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin.from('students').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: "Student deleted" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getBatches = async (req, res) => {
    try {
        // Distinct batches (Using a workaround as supabase-js distinct is tricky, usually .rpc or just raw sql is better, but let's try .select)
        // Or just fetch all and unique them in JS (not scalable but ok for now)
        const { data, error } = await supabaseAdmin.from('students').select('batch');
        if (error) throw error;

        const batches = [...new Set(data.map(s => s.batch).filter(Boolean))].sort();
        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Operations ---

const enrollStudents = async (req, res) => {
    const { courseId } = req.params;
    const { studentIds } = req.body; // Array of UUIDs

    try {
        const enrollments = studentIds.map(sid => ({
            course_id: courseId,
            student_id: sid
        }));

        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .upsert(enrollments, { onConflict: 'course_id, student_id' })
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const seedStudents = async (req, res) => {
    const { courseId } = req.params;
    try {
        // 1. Create Dummy Students with Batch
        const dummyStudents = [
            { name: "Ali Khan", reg_no: "2021-CS-001", email: "ali@example.com", batch: "2021 CS" },
            { name: "Sara Ahmed", reg_no: "2021-CS-002", email: "sara@example.com", batch: "2021 CS" },
            { name: "Bilal Raza", reg_no: "2021-CS-003", email: "bilal@example.com", batch: "2021 CS" },
            { name: "Zainab Bibi", reg_no: "2021-CS-004", email: "zainab@example.com", batch: "2021 CS" },
            { name: "Usman Ghani", reg_no: "2021-CS-005", email: "usman@example.com", batch: "2021 CS" }
        ];

        const { data: createdStudents, error: sError } = await supabaseAdmin
            .from('students')
            .upsert(dummyStudents, { onConflict: 'reg_no' })
            .select();

        if (sError) throw sError;

        // 2. Enroll them in the course
        const enrollments = createdStudents.map(s => ({
            course_id: courseId,
            student_id: s.id
        }));

        const { error: eError } = await supabaseAdmin
            .from('enrollments')
            .upsert(enrollments, { onConflict: 'course_id, student_id' });

        if (eError) throw eError;

        res.json({ message: "Seeded 5 students successfully", students: createdStudents });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCourseStudents,
    getStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getBatches,
    enrollStudents,
    seedStudents
};
