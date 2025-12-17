const express = require('express');
const { getPrograms, createProgram, createProgramsBulk, getPLOs, createPLO } = require('../controllers/programController');

const router = express.Router();

router.get('/', getPrograms);
router.post('/', createProgram);
router.post('/bulk', createProgramsBulk);
router.get('/:programId/plos', getPLOs);
router.post('/plos', createPLO);

module.exports = router;
