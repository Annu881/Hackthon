const User = require('../models/User');
const Policy = require('../models/Policy');
const Resource = require('../models/Resource');
const AuditLog = require('../models/AuditLog');
const AccessRequest = require('../models/AccessRequest');

exports.getStats = async (req, res) => {
    try {
        const [users, policies, resources, logs, allowed, denied, pendingJit] = await Promise.all([
            User.countDocuments(),
            Policy.countDocuments(),
            Resource.countDocuments(),
            AuditLog.countDocuments(),
            AuditLog.countDocuments({ decision: 'allow' }),
            AuditLog.countDocuments({ decision: 'deny' }),
            AccessRequest.countDocuments({ status: 'pending' })
        ]);

        const activePolicies = await Policy.countDocuments({ isActive: true });
        const recentLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(10).lean();

        // 1. Calculate Health Score
        let healthScore = 100;
        if (pendingJit > 0) healthScore -= Math.min(pendingJit * 5, 30);
        if (denied > allowed) healthScore -= 10;
        const policyCoverage = resources > 0 ? Math.round((activePolicies / resources) * 100) : 100;
        if (policyCoverage < 50) healthScore -= 20;

        // 2. Denied Heatmap (Top 5 resources with most denials)
        const deniedHeatmap = await AuditLog.aggregate([
            { $match: { decision: 'deny' } },
            { $group: { _id: '$resource.uon', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            success: true,
            stats: {
                users, policies, activePolicies, resources, totalRequests: logs,
                allowed, denied, pendingJit, healthScore, policyCoverage
            },
            recentLogs,
            deniedHeatmap
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
