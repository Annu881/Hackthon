const mongoose = require('mongoose');

// Define schema directly since we are in a standalone script
const PolicySchema = new mongoose.Schema({
    name: String,
    actorMatcher: { type: { type: String }, value: String },
    permissions: [{
        resourceMatcher: String,
        actions: [String],
        condition: { expression: String },
        effect: String
    }],
    priority: Number,
    isActive: Boolean,
    domain: String
});

// Avoid OverwriteModelError if running multiple times
const Policy = mongoose.models.Policy || mongoose.model('Policy', PolicySchema);

async function fix() {
    const MONGO_URI = 'mongodb://127.0.0.1:27017/abac_system';
    console.log('Attempting to connect to MongoDB at', MONGO_URI);

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('Connected successfully');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }

    const all = await Policy.find({});
    console.log('\n=== ALL POLICIES BEFORE FIX ===');
    all.forEach(p => {
        console.log(`\n"${p.name}"`);
        console.log(`  actor: type=${p.actorMatcher?.type || 'any'} value=${p.actorMatcher?.value || '(empty)'}`);
        console.log(`  priority: ${p.priority}`);
        if (p.permissions) {
            p.permissions.forEach((perm, i) => {
                console.log(`  perm[${i}]: ${perm.effect} [${perm.actions.join(',')}] on ${perm.resourceMatcher}`);
                if (perm.condition?.expression) console.log(`    condition: ${perm.condition.expression}`);
            });
        }
    });

    // Fix 1: Admin Full Access — only for role:admin
    const r1 = await Policy.updateOne(
        { name: 'Admin Full Access' },
        { $set: { 'actorMatcher.type': 'role', 'actorMatcher.value': 'admin' } }
    );
    console.log('\nFix 1 - Admin Full Access actor→role:admin:', r1.modifiedCount, 'modified');

    // Fix 2: Remove delete from India Seller policy if present
    const sellerPolicy = await Policy.findOne({ name: { $regex: /seller/i } });
    if (sellerPolicy) {
        sellerPolicy.permissions = sellerPolicy.permissions.map(p => {
            const pObj = p.toObject ? p.toObject() : p;
            return {
                ...pObj,
                actions: (pObj.actions || []).filter(a => a !== 'delete' && a !== 'admin' && a !== 'subscribe' && a !== 'publish')
            };
        });
        await sellerPolicy.save();
        console.log('Fix 2 - Seller policy sensitive actions removed');
    }

    const after = await Policy.find({});
    console.log('\n=== ALL POLICIES AFTER FIX ===');
    after.forEach(p => {
        console.log(`\n"${p.name}" actor=${p.actorMatcher?.type || 'any'}:${p.actorMatcher?.value || 'any'}`);
        if (p.permissions) {
            p.permissions.forEach((perm, i) => {
                console.log(`  perm[${i}]: ${perm.effect} [${perm.actions.join(',')}] on ${perm.resourceMatcher}`);
            });
        }
    });

    console.log('\nFix completed successfully.');
    process.exit(0);
}

fix().catch(e => { console.error('Script error:', e); process.exit(1); });
