const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');

// Semesters
router.get('/', semesterController.getSemesters);
router.post('/', semesterController.createSemester);

// Sections
router.get('/sections/:teacherId/:semesterId', semesterController.getTeacherSections);
router.post('/sections', semesterController.createSection);

module.exports = router;
