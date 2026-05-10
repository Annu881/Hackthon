const express = require('express');
const router = express.Router();
const AccessRequest = require('../models/AccessRequest');
const Policy = require('../models/Policy');
const { protect, authorize } = require('../middleware/auth');
const cache = require('../services/cacheService');

// @route   POST /api/requests
// @desc    Submit a new access request
router.post('/', protect, async (req, res) => {
    try {
        const { resourceUon, action, reason, requestedDuration } = req.body;

        const accessRequest = await AccessRequest.create({
            actorId: req.user._id,
            actorEmail: req.user.email,
            resourceUon,
            action,
            reason,
            requestedDuration: requestedDuration || 2
        });

        res.status(201).json(accessRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/requests/pending-count
// @desc    Get count of pending requests (Admin only)
router.get('/pending-count', protect, authorize('admin'), async (req, res) => {
    try {
        const count = await AccessRequest.countDocuments({ status: 'pending' });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/requests
// @desc    Get all requests (Admin) or user's own requests
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.actorId = req.user._id;
        }

        const requests = await AccessRequest.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/requests/:id
// @desc    Approve or Deny a request
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const request = await AccessRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        if (status === 'denied') {
            request.status = 'denied';
            await request.save();
            return res.json(request);
        }

        if (status === 'approved') {
            const duration = Number(request.requestedDuration) || 2;
            const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
            const expiresUnix = Math.floor(expiresAt.getTime() / 1000);

            // Create temporary policy
            const policy = await Policy.create({
                name: `JIT-Access-${request._id}`,
                description: `Temporary access for ${request.actorEmail} to ${request.resourceUon}. Reason: ${request.reason}`,
                domain: 'global',
                actorMatcher: { type: 'user', value: request.actorEmail },
                permissions: [{
                    resourceMatcher: request.resourceUon,
                    actions: [request.action],
                    condition: {
                        expression: `env.time_unix < ${expiresUnix}`,
                        description: `Expires at ${expiresAt.toLocaleString()}`
                    },
                    effect: 'allow'
                }],
                priority: 900, // High priority
                isActive: true,
                createdBy: req.user._id,
                tags: ['jit', 'temporary']
            });

            request.status = 'approved';
            request.approvedBy = req.user._id;
            request.expiresAt = expiresAt;
            request.attachedPolicyId = policy._id;
            await request.save();

            // Clear policy cache
            await cache.invalidatePolicyCache();

            return res.json(request);
        }

        res.status(400).json({ message: 'Invalid status' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
