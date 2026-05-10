/**
 * Add Time-Based Policy to existing database
 * Run: node src/utils/addTimePolicies.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Policy = require('../models/Policy');
const Resource = require('../models/Resource');

async function addTimePolicies() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/abac_system');
    console.log('Connected to MongoDB');

    // 1. Fix Admin Full Access — must be role:admin only (not 'any')
    const adminFix = await Policy.updateOne(
        { name: 'Admin Full Access' },
        { $set: { 'actorMatcher.type': 'role', 'actorMatcher.value': 'admin' } }
    );
    console.log('✅ Admin Full Access fixed — actor: role:admin |', adminFix.modifiedCount, 'updated');

    // 2. Add Time-Based Policy — PRD Example 3
    const existing = await Policy.findOne({ name: 'Working Hours Report Access' });
    if (!existing) {
        await Policy.create({
            name: 'Working Hours Report Access',
            description: 'Analysts can only access reports during working hours (9AM–6PM, Mon–Fri).',
            domain: 'reports',
            actorMatcher: { type: 'role', value: 'analyst' },
            permissions: [{
                resourceMatcher: 'uon://reports/production/report/*',
                actions: ['read'],
                condition: {
                    expression: 'env.hour >= 9 && env.hour <= 18',
                    description: 'Only allowed during business hours 9AM to 6PM'
                },
                effect: 'allow'
            }],
            priority: 25,
            isActive: true,
            tags: ['time-based', 'working-hours']
        });
        console.log('✅ Time-Based Policy created: Working Hours Report Access');
    } else {
        console.log('ℹ️  Working Hours policy already exists — skipping');
    }

    // 3. Authorization latency < 50ms
    const existingWeekend = await Policy.findOne({ name: 'No Weekend Database Access' });
    if (!existingWeekend) {
        await Policy.create({
            name: 'No Weekend Database Access',
            description: 'Nobody can access database resources on weekends (Saturday/Sunday).',
            domain: 'orders.mysql.storage',
            actorMatcher: { type: 'any' },
            permissions: [{
                resourceMatcher: 'uon://orders.mysql.storage/production/table/*',
                actions: ['read', 'create', 'update', 'delete'],
                condition: {
                    expression: 'env.isWeekend == false',
                    description: 'Block access on weekends — env.isWeekend is auto-set by engine'
                },
                effect: 'allow'
            }],
            priority: 35,
            isActive: true,
            tags: ['time-based', 'weekend-block', 'database']
        });
        console.log('✅ Weekend Restriction Policy created: No Weekend Database Access');
    } else {
        console.log('ℹ️  Weekend policy already exists — skipping');
    }

    // 4. Add resources if missing
    const reportRes = await Resource.findOne({ uon: 'uon://reports/production/report/sales' });
    if (!reportRes) {
        await Resource.create({
            name: 'Sales Report API',
            uon: 'uon://reports/production/report/sales',
            type: 'report', domain: 'reports', environment: 'production',
            sensitivity: 'confidential',
            attributes: new Map([['region', 'india'], ['category', 'sales']])
        });
        console.log('✅ Sales Report resource created');
    }

    // Show all current policies
    const all = await Policy.find({}).select('name actorMatcher.type actorMatcher.value priority isActive');
    console.log('\n=== All Policies After Fix ===');
    all.forEach(p => {
        console.log(`  "${p.name}" | actor: ${p.actorMatcher.type}:${p.actorMatcher.value || 'any'} | priority:${p.priority} | active:${p.isActive}`);
    });

    console.log('\n🎉 Done! Restart your backend server: npm run dev');
    process.exit(0);
}

addTimePolicies().catch(err => { console.error(err); process.exit(1); });
