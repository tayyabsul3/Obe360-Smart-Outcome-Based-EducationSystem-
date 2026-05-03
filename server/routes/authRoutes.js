const express = require('express');
const { inviteTeacher, register, login, verify2FA, updateProfile, updatePassword, getTeachers, deleteTeacher } = require('../controllers/authController');

const router = express.Router();

router.post('/invite', inviteTeacher);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/update-profile', updateProfile);
router.post('/update-password', updatePassword);
router.get('/teachers', getTeachers);
router.delete('/teachers/:id', deleteTeacher);

module.exports = router;
