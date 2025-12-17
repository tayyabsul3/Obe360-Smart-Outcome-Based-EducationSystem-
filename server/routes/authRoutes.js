const express = require('express');
const { inviteTeacher, register, login, updatePassword, getTeachers } = require('../controllers/authController');

const router = express.Router();

router.post('/invite', inviteTeacher);
router.post('/register', register);
router.post('/login', login);
router.post('/update-password', updatePassword);
router.get('/teachers', getTeachers);

module.exports = router;
