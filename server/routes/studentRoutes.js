const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentController');

// 1. Course specific
router.get('/:courseId', controller.getCourseStudents);
router.post('/:courseId/seed', controller.seedStudents);
router.post('/:courseId/enroll', controller.enrollStudents);

// 2. Student Management (Admin)
router.get('/', controller.getStudents); // ?batch=...
router.post('/', controller.createStudent);
router.put('/:id', controller.updateStudent);
router.delete('/:id', controller.deleteStudent);

// 3. Batches
router.get('/meta/batches', controller.getBatches); // changed path to avoid collision with :courseId if UUID-like, though :courseId is UUID so 'batches' is safe. Sticking to 'meta/batches' to be safe.

module.exports = router;
