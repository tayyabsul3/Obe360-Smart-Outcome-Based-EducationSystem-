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
                    email,
                    father_name,
                    current_city,
                    batch,
                    section
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
    const { batch, section } = req.query;
    try {
        let query = supabaseAdmin
            .from('students')
            .select('*');

        if (req.adminId) {
            query = query.eq('admin_id', req.adminId);
        }

        if (batch) query = query.eq('batch', batch);
        if (section) query = query.eq('section', section);

        const { data, error } = await query
            .order('batch', { ascending: false })
            .order('section', { ascending: true })
            .order('reg_no', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createStudent = async (req, res) => {
    const { name, reg_no, email, batch, section, father_name, current_city } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('students')
            .insert([{ name, reg_no, email, batch, section, father_name, current_city, admin_id: req.adminId }])
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
    const { name, reg_no, email, batch, section, father_name, current_city } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('students')
            .update({ name, reg_no, email, batch, section, father_name, current_city })
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
        let query = supabaseAdmin.from('students').select('batch');
        if (req.adminId) query = query.eq('admin_id', req.adminId);

        const { data, error } = await query;
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
        // 1. Create Dummy Students with Batch and Section
        const dummyStudents = [
            { name: "Ali Khan", reg_no: "2021-CS-001", email: "ali@example.com", batch: "2021", section: "A", father_name: "Amjad Khan", current_city: "Lahore", admin_id: req.adminId },
            { name: "Sara Ahmed", reg_no: "2021-CS-002", email: "sara@example.com", batch: "2021", section: "A", father_name: "Ahmed Ali", current_city: "Karachi", admin_id: req.adminId },
            { name: "Bilal Raza", reg_no: "2021-CS-003", email: "bilal@example.com", batch: "2021", section: "B", father_name: "Raza Ullah", current_city: "Islamabad", admin_id: req.adminId },
            { name: "Zainab Bibi", reg_no: "2021-CS-004", email: "zainab@example.com", batch: "2021", section: "B", father_name: "Muhammad Ali", current_city: "Faisalabad", admin_id: req.adminId },
            { name: "Usman Ghani", reg_no: "2021-CS-005", email: "usman@example.com", batch: "2021", section: "A", father_name: "Ghani Khan", current_city: "Peshawar", admin_id: req.adminId }
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

const seedGlobalStudents = async (req, res) => {
    try {
        const dummyStudents = [];
        const batches = ["2024", "2025"];
        const sections = ["A", "B"];
        let count = 1;

        batches.forEach(batch => {
            sections.forEach(section => {
                for (let i = 1; i <= 5; i++) {
                    const regNo = `${batch}-CS-${String(count).padStart(3, '0')}`;
                    dummyStudents.push({
                        name: `Student ${count}`,
                        reg_no: regNo,
                        email: `student${count}@example.com`,
                        batch: batch,
                        section: section,
                        father_name: `Father ${count}`,
                        current_city: i % 2 === 0 ? "Lahore" : "Islamabad",
                        admin_id: req.adminId
                    });
                    count++;
                }
            });
        });

        const { data, error } = await supabaseAdmin
            .from('students')
            .upsert(dummyStudents, { onConflict: 'reg_no' })
            .select();

        if (error) throw error;
        res.json({ message: `Seeded ${data.length} global students`, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    seedStudents,
    seedGlobalStudents
};
