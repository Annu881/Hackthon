const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const cacheService = require('../services/cacheService');

// GET /api/cache/stats — Redis cache statistics
router.get('/stats', protect, async (req, res) => {
    try {
        const stats = await cacheService.getCacheStats();
        res.json({ success: true, cache: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/cache/flush — Invalidate all policy cache (admin only)
router.delete('/flush', protect, authorize('admin'), async (req, res) => {
    try {
        await cacheService.invalidatePolicyCache();
        res.json({ success: true, message: 'Policy cache cleared — next request will fetch fresh from MongoDB' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
