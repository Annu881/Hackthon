const express = require('express');
const router = express.Router();
const { getResources, getResource, createResource, updateResource, deleteResource } = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resources
 */

/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resource details
 */

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Create new resource
 *     tags: [Resources]
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
 *               uon: { type: string }
 *               type: { type: string }
 *               domain: { type: string }
 *               sensitivity: { type: string }
 *     responses:
 *       201:
 *         description: Resource created
 */

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     summary: Update resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resource updated
 */

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     summary: Delete resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resource deleted
 */

router.use(protect);
router.get('/', getResources);
router.get('/:id', getResource);
router.post('/', authorize('admin', 'manager'), createResource);
router.put('/:id', authorize('admin', 'manager'), updateResource);
router.delete('/:id', authorize('admin'), deleteResource);

module.exports = router;
