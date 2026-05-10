const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Attribute store definitions
const attributeStores = [
    {
        id: 'user-store',
        name: 'User Attribute Store',
        description: 'Fetches user attributes like department, role, location, groups',
        supportedAttributes: ['actor.department', 'actor.role', 'actor.location', 'actor.groups', 'actor.employeeId']
    },
    {
        id: 'resource-store',
        name: 'Resource Attribute Store',
        description: 'Fetches resource attributes like type, domain, sensitivity, owner',
        supportedAttributes: ['resource.type', 'resource.domain', 'resource.sensitivity', 'resource.owner']
    },
    {
        id: 'ownership-store',
        name: 'Ownership Attribute Store (uOwn)',
        description: 'Fetches ownership and role information for resources (like Kafka topics)',
        supportedAttributes: ['resource.uOwnDevelopGroups', 'resource.ownerEmail', 'resource.ownerDepartment']
    },
    {
        id: 'env-store',
        name: 'Environment Attribute Store',
        description: 'Time-based and environment-based attributes',
        supportedAttributes: ['env.time', 'env.hour', 'env.dayOfWeek', 'env.region']
    }
];

router.use(protect);

/**
 * @swagger
 * /api/attributes/stores:
 *   get:
 *     summary: Get attribute stores
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attribute stores
 */
router.get('/stores', (req, res) => {
    res.json({ success: true, stores: attributeStores });
});

/**
 * @swagger
 * /api/attributes/supported:
 *   get:
 *     summary: Get supported attributes
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of supported attributes
 */
router.get('/supported', (req, res) => {
    const allAttrs = attributeStores.flatMap(s => s.supportedAttributes);
    res.json({ success: true, attributes: allAttrs });
});

/**
 * @swagger
 * /api/attributes/validate-expression:
 *   post:
 *     summary: Validate policy expression
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expression: { type: string }
 *     responses:
 *       200:
 *         description: Expression validation result
 */
// Expression validator
router.post('/validate-expression', authorize('admin', 'manager'), (req, res) => {
    const { expression } = req.body;
    if (!expression) return res.status(400).json({ success: false, message: 'Expression required' });

    try {
        // Basic syntax check
        const testContext = {
            actor: { role: 'test', department: 'test', location: 'test' },
            resource: { type: 'test', domain: 'test', sensitivity: 'internal' }
        };

        let expr = expression
            .replace(/actor\.(\w+)/g, '"test"')
            .replace(/resource\.(\w+)/g, '"test"')
            .replace(/env\.(\w+)/g, '"test"');

        // eslint-disable-next-line no-new-func
        new Function(`"use strict"; return (${expr});`)();
        res.json({ success: true, valid: true, message: 'Expression syntax is valid' });
    } catch (err) {
        res.json({ success: true, valid: false, message: `Invalid expression: ${err.message}` });
    }
});

module.exports = router;
