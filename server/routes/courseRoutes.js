const express = require('express');
const { getCourses, getCourseById, createCourse, createCoursesBulk, getProgramCourses, addCourseToProgram, addCoursesToStudyPlanBulk } = require('../controllers/courseController');

const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);
router.post('/bulk', createCoursesBulk);
router.get('/program/:programId', getProgramCourses);
router.post('/program', addCourseToProgram);
router.post('/study-plan/bulk', addCoursesToStudyPlanBulk);

module.exports = router;
