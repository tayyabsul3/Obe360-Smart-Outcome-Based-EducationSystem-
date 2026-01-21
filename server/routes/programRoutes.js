const express = require('express');
const {
    getPrograms, createProgram, createProgramsBulk, updateProgram, deleteProgram,
    getPLOs, createPLO, createPLOsBulk, updatePLO, deletePLO
} = require('../controllers/programController');

const router = express.Router();

router.get('/', getPrograms);
router.post('/', createProgram);
router.post('/bulk', createProgramsBulk);
router.get('/:programId/plos', getPLOs);
router.post('/plos', createPLO);
router.post('/plos/bulk', createPLOsBulk);
router.get('/plos/course/:courseId', require('../controllers/programController').getPLOsByCourse);

// Programs
router.delete('/:id', deleteProgram);
router.put('/:id', updateProgram);

// PLOs
router.delete('/plos/:id', deletePLO);
router.put('/plos/:id', updatePLO);

module.exports = router;
