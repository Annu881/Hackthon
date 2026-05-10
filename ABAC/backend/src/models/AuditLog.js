const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    actor: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        email: { type: String, default: '' },
        role: { type: String, default: '' },
        department: { type: String, default: '' },
        location: { type: String, default: '' }
    },
    action: { type: String, required: true },
    resource: {
        uon: { type: String, default: '' },
        type: { type: String, default: '' },
        domain: { type: String, default: '' }
    },
    decision: { type: String, enum: ['allow', 'deny'], required: true },
    matchedPolicy: { type: String, default: '' },
    conditionEvaluated: { type: String, default: '' },
    conditionResult: { type: Boolean },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    reason: { type: String, default: '' },
    latencyMs: { type: Number, default: 0 },  // PRD: latency < 50ms
    ip: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
