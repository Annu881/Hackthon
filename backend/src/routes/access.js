const express = require('express');
const router = express.Router();
const { checkAccess, simulateAccess } = require('../controllers/accessController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/access/check:
 *   post:
 *     summary: Check access for resource
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resourceUon: { type: string }
 *               permission: { type: string }
 *     responses:
 *       200:
 *         description: Access decision result
 */

/**
 * @swagger
 * /api/access/simulate:
 *   post:
 *     summary: Simulate access check
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actor: { type: object }
 *               resourceUon: { type: string }
 *               permission: { type: string }
 *     responses:
 *       200:
 *         description: Simulated access decision
 */

router.use(protect);
router.post('/check', checkAccess);
router.post('/simulate', authorize('admin', 'manager'), simulateAccess);

module.exports = router;
