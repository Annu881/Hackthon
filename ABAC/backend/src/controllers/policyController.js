const Policy = require('../models/Policy');
const { invalidatePolicyCache } = require('../services/cacheService');

exports.getPolicies = async (req, res) => {
    try {
        const { domain, isActive, search } = req.query;
        const query = {};
        if (domain) query.domain = domain;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) query.name = { $regex: search, $options: 'i' };
        const policies = await Policy.find(query).populate('createdBy', 'name email').sort({ priority: -1, createdAt: -1 });
        res.json({ success: true, count: policies.length, policies });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPolicy = async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id).populate('createdBy', 'name email');
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.json({ success: true, policy });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createPolicy = async (req, res) => {
    try {
        const policy = await Policy.create({ ...req.body, createdBy: req.user._id });
        await invalidatePolicyCache(); // Clear cache — new policy added
        res.status(201).json({ success: true, policy });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'Policy name already exists' });
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updatePolicy = async (req, res) => {
    try {
        const policy = await Policy.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        await invalidatePolicyCache(); // Clear cache — policy updated
        res.json({ success: true, policy });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deletePolicy = async (req, res) => {
    try {
        const policy = await Policy.findByIdAndDelete(req.params.id);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        await invalidatePolicyCache(); // Clear cache — policy deleted
        res.json({ success: true, message: 'Policy deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.togglePolicy = async (req, res) => {
    try {
        const policy = await Policy.findById(req.params.id);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        policy.isActive = !policy.isActive;
        await policy.save();
        await invalidatePolicyCache(); // Clear cache — policy toggled
        res.json({ success: true, policy, message: `Policy ${policy.isActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
