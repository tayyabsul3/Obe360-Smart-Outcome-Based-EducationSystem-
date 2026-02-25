const { getAssignments, createAssignment, getTeacherAssignments, getAllAssignments } = require('../controllers/assignmentController');
const express = require('express');
const router = express.Router();

router.get('/', getAllAssignments);
router.get('/filter', getAssignments);
router.post('/', createAssignment);
router.get('/teacher/:teacherId', getTeacherAssignments);

module.exports = router;
