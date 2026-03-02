const express = require('express');
const router = express.Router();
const controller = require('../controllers/assessmentController');

// Assessments
router.get('/:courseId', controller.getAssessments);
router.post('/', controller.createAssessment);
router.put('/:id', controller.updateAssessment);
router.delete('/:id', controller.deleteAssessment);
router.delete('/course/:courseId', controller.deleteAllAssessments);

// Questions (Nested under assessment ID usually, but sticking to flat resource style or nested? Let's do /:id/questions)
router.get('/:assessmentId/questions', controller.getQuestions);
router.post('/:assessmentId/questions', controller.createQuestions);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Marks
router.get('/:assessmentId/marks', controller.getMarks);
router.post('/marks', controller.saveMarks);
router.post('/:assessmentId/import', upload.single('file'), controller.importOutcomes);
router.post('/course/:courseId/import-advanced', upload.single('file'), controller.importAdvancedOutcomes);
router.post('/course/:courseId/import-definitions', upload.single('file'), controller.importAssessments);
router.get('/course/:courseId/export-all', controller.exportOutcomes);

module.exports = router;
