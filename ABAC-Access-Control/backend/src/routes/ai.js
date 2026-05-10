const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

router.post('/chat', protect, aiController.chat);

module.exports = router;
