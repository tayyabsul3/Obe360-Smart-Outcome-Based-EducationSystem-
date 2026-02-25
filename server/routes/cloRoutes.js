const express = require('express');
const { getCLOs, getCLOMappings, createCLO, updateCLO, deleteCLO } = require('../controllers/cloController');

const router = express.Router();

router.get('/:courseId', getCLOs);
router.post('/', createCLO);
router.put('/:id', updateCLO);
router.delete('/:id', deleteCLO);
router.get('/:id/mapping', getCLOMappings);

module.exports = router;
