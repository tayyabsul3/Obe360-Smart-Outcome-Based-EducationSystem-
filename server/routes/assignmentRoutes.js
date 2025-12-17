const express = require('express');
const { getAssignments, createAssignment } = require('../controllers/assignmentController');

const router = express.Router();

router.get('/class/:classId', getAssignments);
router.post('/', createAssignment);

module.exports = router;
