const AuditLog = require('../models/AuditLog');

exports.getLogs = async (req, res) => {
    try {
        const { decision, actorEmail, resourceDomain, limit = 50, page = 1 } = req.query;
        const query = {};
        if (decision) query.decision = decision;
        if (actorEmail) query['actor.email'] = { $regex: actorEmail, $options: 'i' };
        if (resourceDomain) query['resource.domain'] = resourceDomain;

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({ success: true, total, page: parseInt(page), logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await AuditLog.countDocuments();
        const allowed = await AuditLog.countDocuments({ decision: 'allow' });
        const denied = await AuditLog.countDocuments({ decision: 'deny' });

        const byAction = await AuditLog.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const byDomain = await AuditLog.aggregate([
            { $group: { _id: '$resource.domain', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const recentActivity = await AuditLog.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    allow: { $sum: { $cond: [{ $eq: ['$decision', 'allow'] }, 1, 0] } },
                    deny: { $sum: { $cond: [{ $eq: ['$decision', 'deny'] }, 1, 0] } }
                }
            },
            { $sort: { '_id': -1 } },
            { $limit: 7 }
        ]);

        res.json({ success: true, stats: { total, allowed, denied, byAction, byDomain, recentActivity } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
