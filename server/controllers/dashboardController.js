const supabaseAdmin = require('../config/supabase');

const getDashboardStats = async (req, res) => {
    try {
        const adminId = req.adminId;

        // 1. Total Programs
        let progQuery = supabaseAdmin.from('programs').select('*', { count: 'exact', head: true });
        if (adminId) progQuery = progQuery.eq('admin_id', adminId);
        const { count: programsCount, error: progError } = await progQuery;
        if (progError) throw progError;

        // 2. Total Courses
        let courseQuery = supabaseAdmin.from('courses').select('*', { count: 'exact', head: true });
        if (adminId) courseQuery = courseQuery.eq('admin_id', adminId);
        const { count: coursesCount, error: courseError } = await courseQuery;
        if (courseError) throw courseError;

        // Get admin's program IDs for safe downstream counting
        let progIds = [];
        if (adminId) {
            const { data: adminProgs, error: pErr } = await supabaseAdmin
                .from('programs')
                .select('id')
                .eq('admin_id', adminId);
            if (pErr) throw pErr;
            progIds = adminProgs?.map(p => p.id) || [];
        }

        // 3. Active Classes count (safely filter by admin's program IDs)
        let classesCount = 0;
        if (adminId) {
            if (progIds.length > 0) {
                const { count, error: classError } = await supabaseAdmin
                    .from('classes')
                    .select('*', { count: 'exact', head: true })
                    .in('program_id', progIds);
                if (classError) throw classError;
                classesCount = count || 0;
            }
        } else {
            const { count, error: classError } = await supabaseAdmin
                .from('classes')
                .select('*', { count: 'exact', head: true });
            if (classError) throw classError;
            classesCount = count || 0;
        }

        // 4. Faculty Members
        let teacherQuery = supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
        if (adminId) teacherQuery = teacherQuery.eq('admin_id', adminId);
        const { count: teachersCount, error: teacherError } = await teacherQuery;
        if (teacherError) throw teacherError;

        // 5. Chart Data: Classes per Program (safely query to avoid PostgREST relationship issues)
        let classesData = [];
        if (adminId) {
            if (progIds.length > 0) {
                const { data, error: chartError } = await supabaseAdmin
                    .from('classes')
                    .select('program_id, programs(code)')
                    .in('program_id', progIds);
                if (chartError) throw chartError;
                classesData = data || [];
            }
        } else {
            const { data, error: chartError } = await supabaseAdmin
                .from('classes')
                .select('program_id, programs(code)');
            if (chartError) throw chartError;
            classesData = data || [];
        }

        const programDistribution = {};
        classesData.forEach(c => {
            const code = c.programs?.code || 'Unknown';
            programDistribution[code] = (programDistribution[code] || 0) + 1;
        });

        const chartData = Object.keys(programDistribution).map(key => ({
            name: key,
            value: programDistribution[key]
        }));

        res.json({
            stats: {
                programs: programsCount || 0,
                courses: coursesCount || 0,
                classes: classesCount || 0,
                teachers: teachersCount || 0
            },
            chartData
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getDashboardStats };
