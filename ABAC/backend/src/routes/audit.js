const express = require('express');
const router = express.Router();
const { getLogs, getStats } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs list
 */

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics
 */

router.use(protect);
router.get('/', authorize('admin', 'manager'), getLogs);
router.get('/stats', getStats);

module.exports = router;
