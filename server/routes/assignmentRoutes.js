const { getAssignments, createAssignment, getTeacherAssignments, getAllAssignments, deleteAssignment } = require('../controllers/assignmentController');
const express = require('express');
const router = express.Router();

router.get('/', getAllAssignments);
router.get('/filter', getAssignments);
router.post('/', createAssignment);
router.get('/teacher/:teacherId', getTeacherAssignments);
router.delete('/:id', deleteAssignment);

module.exports = router;
