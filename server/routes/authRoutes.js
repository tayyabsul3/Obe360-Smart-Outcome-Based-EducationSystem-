const express = require('express');
const { inviteTeacher, register, login, updatePassword } = require('../controllers/authController');

const router = express.Router();

router.post('/invite', inviteTeacher);
router.post('/register', register);
router.post('/login', login);
router.post('/update-password', updatePassword);

module.exports = router;
