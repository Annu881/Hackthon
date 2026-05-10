const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, aiController.chat);
router.post('/anomaly', protect, aiController.evaluateAnomaly);

module.exports = router;
