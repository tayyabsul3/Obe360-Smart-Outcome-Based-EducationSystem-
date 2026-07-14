const express = require('express');
const { inviteTeacher, register, login, resendOTP, verify2FA, updateProfile, updatePassword, getTeachers, deleteTeacher, toggleTeacherStatus } = require('../controllers/authController');

const router = express.Router();

router.post('/invite', inviteTeacher);
router.post('/register', register);
router.post('/login', login);
router.post('/resend-otp', resendOTP);
router.post('/verify-2fa', verify2FA);
router.post('/update-profile', updateProfile);
router.post('/update-password', updatePassword);
router.get('/teachers', getTeachers);
router.delete('/teachers/:id', deleteTeacher);
router.put('/teachers/:id/status', toggleTeacherStatus);

module.exports = router;
