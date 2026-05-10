const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorEmail: { type: String, required: true },
    resourceUon: { type: String, required: true },
    action: { type: String, required: true },
    reason: { type: String, required: true },
    requestedDuration: { type: Number, required: true, default: 2 }, // in hours
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
    attachedPolicyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

AccessRequestSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);
