const mongoose = require('mongoose');

const ConditionSchema = new mongoose.Schema({
    expression: { type: String, required: true }, // e.g. "actor.department == resource.department"
    description: { type: String }
}, { _id: false });

const PermissionSchema = new mongoose.Schema({
    resourceMatcher: { type: String, required: true }, // e.g. "uon://reports/production/report/*"
    actions: [{ type: String, enum: ['create', 'read', 'update', 'delete', 'publish', 'subscribe', 'admin', 'execute'] }],
    condition: { type: ConditionSchema, default: null },
    effect: { type: String, enum: ['allow', 'deny'], default: 'allow' }
}, { _id: false });

const PolicySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    domain: { type: String, required: true }, // policy domain / namespace
    actorMatcher: {
        type: { type: String, enum: ['user', 'group', 'service', 'role', 'any'], default: 'user' },
        value: { type: String } // e.g. user ID, group name, service name, role
    },
    permissions: [PermissionSchema],
    priority: { type: Number, default: 0 }, // Higher = evaluated first
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

PolicySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Policy', PolicySchema);
