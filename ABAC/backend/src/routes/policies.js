const express = require('express');
const router = express.Router();
const { getPolicies, getPolicy, createPolicy, updatePolicy, deletePolicy, togglePolicy } = require('../controllers/policyController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/policies:
 *   get:
 *     summary: Get all policies
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: domain
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of policies
 */

/**
 * @swagger
 * /api/policies/{id}:
 *   get:
 *     summary: Get policy by ID
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy details
 */

/**
 * @swagger
 * /api/policies:
 *   post:
 *     summary: Create new policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               domain: { type: string }
 *               actorMatcher: { type: object }
 *               resources: { type: array }
 *               permissions: { type: array }
 *               conditions: { type: array }
 *               priority: { type: number }
 *     responses:
 *       201:
 *         description: Policy created
 */

/**
 * @swagger
 * /api/policies/{id}:
 *   put:
 *     summary: Update policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy updated
 */

/**
 * @swagger
 * /api/policies/{id}/toggle:
 *   patch:
 *     summary: Toggle policy active status
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy status toggled
 */

/**
 * @swagger
 * /api/policies/{id}:
 *   delete:
 *     summary: Delete policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy deleted
 */

router.use(protect);
router.get('/', getPolicies);
router.get('/:id', getPolicy);
router.post('/', authorize('admin', 'manager'), createPolicy);
router.put('/:id', authorize('admin', 'manager'), updatePolicy);
router.patch('/:id/toggle', authorize('admin', 'manager'), togglePolicy);
router.delete('/:id', authorize('admin'), deletePolicy);

module.exports = router;
