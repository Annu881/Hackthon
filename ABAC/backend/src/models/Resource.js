const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    uon: { type: String, required: true, unique: true }, // uon://domain/env/type/id
    type: { type: String, enum: ['endpoint', 'database', 'report', 'document', 'kafka_topic', 'service', 'dataset'], required: true },
    domain: { type: String, required: true },
    environment: { type: String, enum: ['production', 'staging', 'development'], default: 'production' },
    attributes: { type: Map, of: String, default: {} },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sensitivity: { type: String, enum: ['public', 'internal', 'confidential', 'restricted'], default: 'internal' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', ResourceSchema);
