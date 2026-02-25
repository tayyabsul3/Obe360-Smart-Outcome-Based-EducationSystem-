const express = require('express');
const router = express.Router();
const controller = require('../controllers/assessmentController');

// Assessments
router.get('/:courseId', controller.getAssessments);
router.post('/', controller.createAssessment);
router.delete('/:id', controller.deleteAssessment);

// Questions (Nested under assessment ID usually, but sticking to flat resource style or nested? Let's do /:id/questions)
router.get('/:assessmentId/questions', controller.getQuestions);
router.post('/:assessmentId/questions', controller.createQuestions);

// Marks
router.get('/:assessmentId/marks', controller.getMarks);
router.post('/marks', controller.saveMarks);

module.exports = router;
