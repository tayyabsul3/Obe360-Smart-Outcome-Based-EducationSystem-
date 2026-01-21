const { getAssignments, createAssignment, getTeacherAssignments } = require('../controllers/assignmentController');
const express = require('express');
const router = express.Router();

router.get('/class/:classId', getAssignments);
router.post('/', createAssignment);
router.get('/teacher/:teacherId', getTeacherAssignments);

module.exports = router;
