const express = require('express');
const { getCLOs, createCLO, updateCLO, deleteCLO } = require('../controllers/cloController');

const router = express.Router();

router.get('/:courseId', getCLOs);
router.post('/', createCLO);
router.put('/:id', updateCLO);
router.delete('/:id', deleteCLO);

module.exports = router;
