const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const courseRoutes = require('./routes/courseRoutes');
const classRoutes = require('./routes/classRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Multi-Tenant Isolation Middleware
app.use((req, res, next) => {
    const adminId = req.headers['x-admin-id'];
    if (adminId) {
        req.adminId = adminId;
    }
    next();
});

// Routes
app.use('/api/semesters', require('./routes/semesterRoutes'));
app.use('/api', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/clos', require('./routes/cloRoutes'));
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health Check
app.get('/', (req, res) => {
    res.send('OBE360 Server is running');
});

// const setupStorage = require('./utils/setupStorage');

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // setupStorage();
});
