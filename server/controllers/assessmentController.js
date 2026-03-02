const supabaseAdmin = require('../config/supabase');

// --- Assessments ---

const getAssessments = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('assessments')
            .select(`
                *,
                assessment_questions (
                    id, question_number, max_marks, clo_id, obe_weight, complexity, not_for_obe, question_guideline, answer_guideline
                )
            `)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createAssessment = async (req, res) => {
    const {
        course_id, title, type, description, drive_link,
        date, gpa_weight, is_complex_engineering_problem, include_in_gpa,
        show_result, allow_student_upload, upload_start_date, upload_end_date,
        subActivities // Array of sub-activity objects
    } = req.body;

    try {
        // 1. Create the parent Assessment
        const { data: assessment, error: assessmentError } = await supabaseAdmin
            .from('assessments')
            .insert([{
                course_id, title, type, description, drive_link,
                date, gpa_weight, is_complex_engineering_problem, include_in_gpa,
                show_result, allow_student_upload, upload_start_date, upload_end_date
            }])
            .select()
            .single();

        if (assessmentError) throw assessmentError;

        // 2. If there are sub-activities, insert them
        if (subActivities && subActivities.length > 0) {
            const questionsToInsert = subActivities.map(sub => ({
                assessment_id: assessment.id,
                question_number: sub.question_number,
                max_marks: sub.max_marks || 0,
                clo_id: sub.clo_id || null,
                obe_weight: sub.obe_weight || 0,
                complexity: sub.complexity,
                not_for_obe: sub.not_for_obe || false,
                question_guideline: sub.question_guideline,
                answer_guideline: sub.answer_guideline
            }));

            const { error: questionsError } = await supabaseAdmin
                .from('assessment_questions')
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;
        }

        res.json(assessment);
    } catch (error) {
        console.error("Create Assessment Exception:", error);
        res.status(400).json({ error: error.message });
    }
};

const updateAssessment = async (req, res) => {
    const { id } = req.params;
    const {
        title, type, description, drive_link,
        date, gpa_weight, is_complex_engineering_problem, include_in_gpa,
        show_result, allow_student_upload, upload_start_date, upload_end_date,
        subActivities
    } = req.body;

    try {
        // 1. Update master assessment
        const { data: assessment, error: assessmentError } = await supabaseAdmin
            .from('assessments')
            .update({
                title, type, description, drive_link,
                date, gpa_weight, is_complex_engineering_problem, include_in_gpa,
                show_result, allow_student_upload, upload_start_date, upload_end_date
            })
            .eq('id', id)
            .select()
            .single();

        if (assessmentError) throw assessmentError;

        // 2. Synchronize Questions
        // Get existing question IDs
        const { data: existingQuestions } = await supabaseAdmin
            .from('assessment_questions')
            .select('id')
            .eq('assessment_id', id);

        const existingIds = existingQuestions.map(q => q.id);
        const incomingIds = subActivities.filter(sa => sa.id).map(sa => sa.id);

        // Deletions
        const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
        if (toDelete.length > 0) {
            await supabaseAdmin.from('assessment_questions').delete().in('id', toDelete);
        }

        // Upsert incoming
        if (subActivities && subActivities.length > 0) {
            const questionsToUpsert = subActivities.map(sub => ({
                id: sub.id || undefined, // gen_random_uuid if missing
                assessment_id: id,
                question_number: sub.question_number,
                max_marks: sub.max_marks || 0,
                clo_id: sub.clo_id === 'none' ? null : sub.clo_id,
                obe_weight: sub.obe_weight || 0,
                complexity: sub.complexity,
                not_for_obe: sub.not_for_obe || false,
                question_guideline: sub.question_guideline,
                answer_guideline: sub.answer_guideline
            }));

            const { error: questionsError } = await supabaseAdmin
                .from('assessment_questions')
                .upsert(questionsToUpsert, { onConflict: 'id' });

            if (questionsError) throw questionsError;
        }

        res.json(assessment);
    } catch (error) {
        console.error("Update Assessment Exception:", error);
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

const deleteAllAssessments = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('assessments')
            .delete()
            .eq('course_id', courseId);

        if (error) throw error;
        res.json({ message: 'All assessments deleted successfully' });
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
    const { updates } = req.body; // Array of { student_id, question_id, obtained_marks, is_absent }

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

const xlsx = require('xlsx');

const importOutcomes = async (req, res) => {
    const { assessmentId } = req.params;

    console.log(`[IMPORT START] Assessment ID: ${assessmentId}`);

    if (!req.file) {
        console.error("[IMPORT ERROR] No file uploaded.");
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        console.log(`[IMPORT FILE] Parsing uploaded file: ${req.file.originalname}, Size: ${req.file.size} bytes`);
        // Parse the Excel file from buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        console.log(`[IMPORT FILE] Reading sheet: ${sheetName}`);
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }); // Rows as objects

        if (rows.length === 0) {
            console.error("[IMPORT ERROR] Uploaded file is empty or formatted incorrectly.");
            return res.status(400).json({ error: "Uploaded file is empty" });
        }

        console.log(`[IMPORT PARSER] Successfully parsed ${rows.length} rows from Excel sheet. Preview first row:`, rows[0]);

        // 1. Fetch Assessment Questions to map column headers (Q1, Q2) to question_id
        console.log("[IMPORT DB] Fetching Assessment Questions...");
        const { data: questions, error: qError } = await supabaseAdmin
            .from('assessment_questions')
            .select('id, question_number, max_marks')
            .eq('assessment_id', assessmentId);

        if (qError) throw qError;
        console.log(`[IMPORT DB] Found ${questions.length} questions for assessment.`);

        // 2. Fetch Students enrolled in the course to map "Reg No" to student_id
        console.log("[IMPORT DB] Fetching Course ID for assessment...");
        const { data: assessment, error: aError } = await supabaseAdmin
            .from('assessments')
            .select('course_id')
            .eq('id', assessmentId)
            .single();

        if (aError) throw aError;

        const courseId = assessment.course_id;
        console.log(`[IMPORT DB] Course ID is ${courseId}. Fetching Enrollments...`);

        const { data: enrollments, error: eError } = await supabaseAdmin
            .from('enrollments')
            .select(`
                student_id,
                students ( id, reg_no )
            `)
            .eq('course_id', courseId);

        if (eError) throw eError;

        // Build a map of reg_no to student_id
        const studentMap = {};
        enrollments.forEach(e => {
            if (e.students && e.students.reg_no) {
                studentMap[e.students.reg_no] = e.students.id;
            }
        });

        console.log(`[IMPORT MAP] Built student map with ${Object.keys(studentMap).length} student registrations.`);

        // 3. Process rows
        const updates = [];
        const errors = [];

        console.log("[IMPORT PROCESSING] Scanning rows for marks mapping...");
        rows.forEach((row, index) => {
            // Find student by checking any column that looks like Registration No
            const regNoKey = Object.keys(row).find(k => k.toLowerCase().includes('reg no') || k.toLowerCase().includes('registration'));
            if (!regNoKey) {
                console.warn(`[IMPORT SCAN] Row ${index + 2}: No "Registration No" header found. Row fields:`, Object.keys(row));
                return; // Skip if no reg no column
            }

            const regNo = String(row[regNoKey]).trim();
            const studentId = studentMap[regNo];

            if (!studentId) {
                console.warn(`[IMPORT SCAN] Row ${index + 2}: Student ${regNo} NOT ENROLLED.`);
                errors.push(`Row ${index + 2}: Student with Reg No ${regNo} not enrolled in this course.`);
                return;
            }

            // Loop through questions and find matching columns
            questions.forEach(q => {
                // Find a column key that exactly matches the question number (e.g., "Q1" or "Q1 (10)")
                const qKey = Object.keys(row).find(k => {
                    const cleanHeader = k.split('(')[0].trim().toUpperCase(); // Extract "Q1" from "Q1 (10)"
                    return cleanHeader === q.question_number.toUpperCase();
                });

                if (qKey && row[qKey] !== "") {
                    let markStr = String(row[qKey]).trim().toUpperCase();
                    let isAbsent = false;
                    let obtainedMarks = 0;

                    if (markStr === 'A' || markStr === 'AB' || markStr === 'ABSENT') {
                        isAbsent = true;
                    } else {
                        obtainedMarks = parseFloat(markStr);
                        if (isNaN(obtainedMarks)) obtainedMarks = 0;
                        if (obtainedMarks > q.max_marks) obtainedMarks = q.max_marks;
                        if (obtainedMarks < 0) obtainedMarks = 0;
                    }

                    updates.push({
                        assessment_id: assessmentId,
                        student_id: studentId,
                        question_id: q.id,
                        obtained_marks: obtainedMarks,
                        is_absent: isAbsent
                    });
                }
            });
        });

        if (updates.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from('student_marks')
                .upsert(updates, { onConflict: 'student_id, question_id' });

            if (upsertError) throw upsertError;
        }

        res.json({
            message: `Successfully processed ${updates.length} mark entries.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ error: "Failed to parse and import data. Ensure valid Excel template is used." });
    }
};

const importAdvancedOutcomes = async (req, res) => {
    const { courseId } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use header: 1 to get array of arrays for precise control
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (rows.length < 3) {
            return res.status(400).json({ error: "Uploaded file is too small or missing header rows" });
        }

        const header1 = rows[0]; // Assessment Titles
        const header2 = rows[1]; // Question/CLO details
        const dataRows = rows.slice(2);

        // 1. Identify Mappings with forward-fill for merges in header1
        const mappings = [];
        let lastTitle = "";

        for (let c = 2; c < header2.length; c++) {
            let title = header1[c] ? String(header1[c]).trim() : lastTitle;
            if (header1[c]) lastTitle = title;

            const detail = String(header2[c] || "").trim();
            // Regex to match "Q1 (max_marks)\nCLO-#" or just "Q1 (max_marks)"
            const match = detail.match(/^([^(]+)\s*\((\d+)\)/i);

            if (title && match) {
                mappings.push({
                    colIndex: c,
                    assessmentTitle: title,
                    questionNumber: match[1].trim(),
                    maxMarks: parseInt(match[2])
                });
            }
        }

        if (mappings.length === 0) {
            return res.status(400).json({ error: "No valid assessment columns found in header rows (Columns 3+ should have Assessment and Question info)" });
        }

        // 2. Ensure Assessments exist
        const assessmentIdMap = {};
        const uniqueAssessmentTitles = [...new Set(mappings.map(m => m.assessmentTitle))];

        for (const title of uniqueAssessmentTitles) {
            let { data: assessment } = await supabaseAdmin
                .from('assessments')
                .select('id')
                .eq('course_id', courseId)
                .eq('title', title)
                .single();

            if (!assessment) {
                const { data: newAssessment, error: createError } = await supabaseAdmin
                    .from('assessments')
                    .insert([{ course_id: courseId, title, type: 'Assignment' }])
                    .select()
                    .single();
                if (createError) throw createError;
                assessment = newAssessment;
            }
            assessmentIdMap[title] = assessment.id;
        }

        // 3. Ensure Questions exist
        const questionIdMap = {}; // colIndex -> questionId
        for (const m of mappings) {
            const assessmentId = assessmentIdMap[m.assessmentTitle];
            let { data: question } = await supabaseAdmin
                .from('assessment_questions')
                .select('id')
                .eq('assessment_id', assessmentId)
                .eq('question_number', m.questionNumber)
                .single();

            if (!question) {
                const { data: newQuestion, error: createError } = await supabaseAdmin
                    .from('assessment_questions')
                    .insert([{
                        assessment_id: assessmentId,
                        question_number: m.questionNumber,
                        max_marks: m.maxMarks
                    }])
                    .select()
                    .single();
                if (createError) throw createError;
                question = newQuestion;
            }
            questionIdMap[m.colIndex] = question.id;
        }

        // 4. Map Students
        const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select('student_id, students ( id, reg_no )')
            .eq('course_id', courseId);

        const studentMap = {};
        enrollments.forEach(e => {
            if (e.students && e.students.reg_no) {
                studentMap[e.students.reg_no.toUpperCase()] = e.students.id;
            }
        });

        // 5. Process Rows
        const updates = [];
        const errors = [];

        dataRows.forEach((row, idx) => {
            const regNo = String(row[0] || "").trim().toUpperCase();
            if (!regNo) return;

            const studentId = studentMap[regNo];
            if (!studentId) {
                errors.push(`Row ${idx + 3}: Student ${regNo} not found in this course`);
                return;
            }

            mappings.forEach(m => {
                const qId = questionIdMap[m.colIndex];
                const val = row[m.colIndex];
                if (val !== undefined && val !== "") {
                    let markStr = String(val).trim().toUpperCase();
                    let isAbsent = (markStr === 'A' || markStr === 'AB' || markStr === 'ABSENT');
                    let marks = isAbsent ? 0 : (parseFloat(markStr) || 0);

                    updates.push({
                        student_id: studentId,
                        question_id: qId,
                        assessment_id: assessmentIdMap[m.assessmentTitle],
                        obtained_marks: Math.min(marks, m.maxMarks),
                        is_absent: isAbsent
                    });
                }
            });
        });

        if (updates.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from('student_marks')
                .upsert(updates, { onConflict: 'student_id, question_id' });

            if (upsertError) throw upsertError;
        }

        res.json({
            message: `Advanced Import Successful. Processed ${updates.length} entries.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("[ADVANCED IMPORT ERROR]:", error);
        res.status(500).json({ error: error.message });
    }
};

const importAssessments = async (req, res) => {
    const { courseId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        // Group rows by Assessment Title
        const assessmentsMap = {};
        rows.forEach(row => {
            const title = row['Table'] || row['Title'] || row['Assessment'];
            if (!title) return;
            if (!assessmentsMap[title]) {
                assessmentsMap[title] = {
                    title,
                    type: row['Type'] || 'Assignment',
                    date: row['Date'] || new Date().toISOString().split('T')[0],
                    questions: []
                };
            }
            assessmentsMap[title].questions.push({
                question_number: row['Question'] || row['Q#'],
                max_marks: parseFloat(row['Max Marks']) || 0,
                clo_code: row['CLO']
            });
        });

        const created = [];
        for (const title in assessmentsMap) {
            const a = assessmentsMap[title];

            // 1. Upsert Assessment
            let { data: assessment, error: aError } = await supabaseAdmin
                .from('assessments')
                .select('id')
                .eq('course_id', courseId)
                .eq('title', title)
                .single();

            if (!assessment) {
                const { data: neu, error: cError } = await supabaseAdmin
                    .from('assessments')
                    .insert([{ course_id: courseId, title: a.title, type: a.type, date: a.date }])
                    .select().single();
                if (cError) throw cError;
                assessment = neu;
            }

            // 2. Fetch CLOs for mapping
            const { data: clos } = await supabaseAdmin.from('clos').select('id, code').eq('course_id', courseId);
            const cloMap = {};
            clos.forEach(c => cloMap[c.code] = c.id);

            // 3. Upsert Questions
            for (const q of a.questions) {
                const { error: qError } = await supabaseAdmin
                    .from('assessment_questions')
                    .upsert([{
                        assessment_id: assessment.id,
                        question_number: q.question_number,
                        max_marks: q.max_marks,
                        clo_id: cloMap[q.clo_code] || null
                    }], { onConflict: 'assessment_id, question_number' });
                if (qError) throw qError;
            }
            created.push(title);
        }

        res.json({ message: `Successfully imported/updated ${created.length} assessments.`, titles: created });
    } catch (error) {
        console.error("Import Definitions Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const exportOutcomes = async (req, res) => {
    const { courseId } = req.params;
    try {
        const { data: assessments, error: aError } = await supabaseAdmin
            .from('assessments')
            .select('*, assessment_questions(*)')
            .eq('course_id', courseId);

        if (aError) throw aError;

        const { data: marks, error: mError } = await supabaseAdmin
            .from('student_marks')
            .select('*')
            .in('assessment_id', assessments.map(a => a.id));

        if (mError) throw mError;

        const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select('student_id, students ( id, reg_no, name )')
            .eq('course_id', courseId);

        res.json({ assessments, marks, enrollments });
    } catch (error) {
        console.error("Export Outcomes Error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    deleteAllAssessments,
    getQuestions,
    createQuestions,
    getMarks,
    saveMarks,
    importOutcomes,
    importAdvancedOutcomes,
    importAssessments,
    exportOutcomes
};
