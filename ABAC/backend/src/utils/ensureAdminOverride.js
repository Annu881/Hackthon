/**
 * Ensure Admin Superuser Override Policy
 * This ensures that Admins have a high-priority policy that matches everything
 * and skips conditional analyst/manager policies.
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Policy = require('../models/Policy');
const User = require('../models/User');

async function run() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/abac_system');
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
        console.error('❌ Admin user not found in DB. Seed first!');
        process.exit(1);
    }

    // 1. Create or Update Superuser Override
    // Priority 1000 ensures it is evaluated BEFORE anything else
    // uon://** matches everything recursive
    const policyData = {
        name: 'Admin Superuser Override',
        description: 'ABAC Master Policy: Admins have unrestricted 24/7 access to all UONs. Priority 1000.',
        domain: 'global',
        actorMatcher: { type: 'role', value: 'admin' },
        permissions: [{
            resourceMatcher: 'uon://**',
            actions: ['create', 'read', 'update', 'delete', 'admin', 'execute', 'publish', 'subscribe'],
            condition: null,
            effect: 'allow'
        }],
        priority: 1000,
        isActive: true,
        createdBy: adminUser._id,
        tags: ['master', 'admin', 'override']
    };

    const result = await Policy.findOneAndUpdate(
        { name: 'Admin Superuser Override' },
        policyData,
        { upsert: true, new: true }
    );

    console.log(`✅ ${result.name} established with priority ${result.priority}`);
    console.log('Actor Matcher:', JSON.stringify(result.actorMatcher));
    console.log('Resource Matcher:', result.permissions[0].resourceMatcher);

    // 2. Ensure the old lower priority policy is also correct or can be deleted
    // We'll keep it as a backup but disable it to avoid confusion
    await Policy.updateOne(
        { name: 'Admin Full Access' },
        { $set: { isActive: false } }
    );
    console.log('ℹ️  Old "Admin Full Access" policy disabled (replaced by superuser override)');

    console.log('\n🎉 Admin 24/7 access guaranteed. Clearing Redis cache...');

    // Attempt local redis flush if possible via script loop
    try {
        const { createClient } = require('redis');
        const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        await client.connect();
        await client.flushAll();
        console.log('⚡ Redis cache flushed successfully.');
        await client.disconnect();
    } catch (e) {
        console.log('⚠️  Redis flush failed or not available. Restarting the backend will also work.');
    }

    process.exit(0);
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
