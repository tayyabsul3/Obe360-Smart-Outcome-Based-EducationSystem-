const express = require('express');
const { getCLOs, getCLOMappings, createCLO, updateCLO, deleteCLO, mapCLOtoPLO, bulkCreateCLOs } = require('../controllers/cloController');

const router = express.Router();

router.get('/:courseId', getCLOs);
router.post('/', createCLO);
router.put('/:id', updateCLO);
router.delete('/:id', deleteCLO);
router.get('/:id/mapping', getCLOMappings);
router.post('/map', mapCLOtoPLO);
router.post('/bulk', bulkCreateCLOs);

module.exports = router;
