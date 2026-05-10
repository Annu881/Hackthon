const Resource = require('../models/Resource');

exports.getResources = async (req, res) => {
    try {
        const { type, domain, search } = req.query;
        const query = {};
        if (type) query.type = type;
        if (domain) query.domain = domain;
        if (search) query.name = { $regex: search, $options: 'i' };
        const resources = await Resource.find(query).populate('owner', 'name email');
        res.json({ success: true, count: resources.length, resources });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id).populate('owner', 'name email');
        if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
        res.json({ success: true, resource });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createResource = async (req, res) => {
    try {
        const resource = await Resource.create({ ...req.body, owner: req.user._id });
        res.status(201).json({ success: true, resource });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'UON already exists' });
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
        res.json({ success: true, resource });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
        res.json({ success: true, message: 'Resource deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
