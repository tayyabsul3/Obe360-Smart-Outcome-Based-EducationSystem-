const supabaseAdmin = require('../config/supabase');

const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Programs
        const { count: programsCount, error: progError } = await supabaseAdmin
            .from('programs')
            .select('*', { count: 'exact', head: true });
        if (progError) throw progError;

        // 2. Total Courses
        const { count: coursesCount, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('*', { count: 'exact', head: true });
        if (courseError) throw courseError;

        // 3. Active Classes
        const { count: classesCount, error: classError } = await supabaseAdmin
            .from('classes')
            .select('*', { count: 'exact', head: true });
        if (classError) throw classError;

        // 4. Faculty Members
        const { count: teachersCount, error: teacherError } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'teacher');
        if (teacherError) throw teacherError;

        // 5. Chart Data: Classes per Program
        // Complex aggregation is hard with Supabase Client directly for joins/groups without Views or RCP.
        // We will fetch all classes with program_id and aggregate in JS for simplicity (assuming small scale for now).
        // For production, use a Database View or RPC.
        const { data: classesData, error: chartError } = await supabaseAdmin
            .from('classes')
            .select('program_id, programs(code)');

        if (chartError) throw chartError;

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
