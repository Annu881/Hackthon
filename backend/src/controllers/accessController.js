const { evaluate } = require('../services/abacEngine');

exports.checkAccess = async (req, res) => {
    try {
        const { resourceUon, action, context } = req.body;
        if (!resourceUon || !action) {
            return res.status(400).json({ success: false, message: 'resourceUon and action are required' });
        }

        const result = await evaluate({
            actor: req.user,
            action,
            resourceUon,
            context: context || {},
            requestIp: req.ip
        });

        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.simulateAccess = async (req, res) => {
    try {
        const { actorId, actorAttributes, resourceUon, action, context } = req.body;
        const User = require('../models/User');

        let actor;
        if (actorId) {
            actor = await User.findById(actorId);
            if (!actor) return res.status(404).json({ success: false, message: 'Actor not found' });
        } else {
            actor = { ...actorAttributes, _id: null };
        }

        const result = await evaluate({
            actor,
            action,
            resourceUon,
            context: context || {},
            requestIp: req.ip
        });

        res.json({ success: true, simulation: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
