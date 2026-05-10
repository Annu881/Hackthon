const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Policy = require('../models/Policy');
const Resource = require('../models/Resource');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
};

const seed = async () => {
    await connectDB();

    // Clear existing
    await User.deleteMany();
    await Policy.deleteMany();
    await Resource.deleteMany();
    console.log('Cleared existing data');

    // Create users
    const admin = await User.create({
        name: 'Admin User', email: 'admin@abac.com', password: 'password123',
        role: 'admin', department: 'security', location: 'india',
        groups: ['admins', 'security-team'], employeeId: 'EMP-ADMIN001'
    });

    const manager = await User.create({
        name: 'Priya Sharma', email: 'priya@abac.com', password: 'password123',
        role: 'manager', department: 'engineering', location: 'india',
        groups: ['engineering-leads', 'querybuilder-development'], employeeId: 'EMP-MGR001'
    });

    const analyst = await User.create({
        name: 'Rahul Verma', email: 'rahul@abac.com', password: 'password123',
        role: 'analyst', department: 'data', location: 'india',
        groups: ['data-analysts', 'report-readers'], employeeId: 'EMP-ANL001'
    });

    const developer = await User.create({
        name: 'Sneha Patel', email: 'sneha@abac.com', password: 'password123',
        role: 'developer', department: 'engineering', location: 'india',
        groups: ['developers', 'querybuilder-development'], employeeId: 'EMP-DEV001'
    });

    const viewer = await User.create({
        name: 'Amit Kumar', email: 'amit@abac.com', password: 'password123',
        role: 'viewer', department: 'sales', location: 'usa',
        groups: ['viewers'], employeeId: 'EMP-VWR001'
    });

    console.log('✅ Users created');

    // Create resources
    await Resource.create([
        {
            name: 'Sales Report API', uon: 'uon://reports/production/report/sales',
            type: 'report', domain: 'reports', environment: 'production',
            sensitivity: 'confidential', owner: manager._id,
            attributes: new Map([['region', 'india'], ['category', 'sales']])
        },
        {
            name: 'User Data Table', uon: 'uon://orders.mysql.storage/production/table/users',
            type: 'database', domain: 'orders.mysql.storage', environment: 'production',
            sensitivity: 'restricted', owner: admin._id,
            attributes: new Map([['db', 'mysql'], ['pii', 'true']])
        },
        {
            name: 'Payment Service RPC', uon: 'uon://service-payment/production/rpc/payment/processPayment',
            type: 'endpoint', domain: 'service-payment', environment: 'production',
            sensitivity: 'restricted', owner: admin._id,
            attributes: new Map([['paymentType', 'credit card'], ['paymentLocation', 'india']])
        },
        {
            name: 'Analytics Kafka Topic', uon: 'uon://topics.kafka/production/topic/analytics-events',
            type: 'kafka_topic', domain: 'topics.kafka', environment: 'production',
            sensitivity: 'internal', owner: manager._id,
            attributes: new Map([['uOwnDevelopGroups', 'engineering-leads,developers'], ['team', 'data']])
        },
        {
            name: 'Query Builder Reports', uon: 'uon://reports/production/report/querybuilder',
            type: 'report', domain: 'reports', environment: 'production',
            sensitivity: 'internal', owner: manager._id,
            attributes: new Map([['category', 'querybuilder']])
        },
        {
            name: 'Employee Profile Service', uon: 'uon://service-hr/production/rpc/employee/profile',
            type: 'endpoint', domain: 'service-hr', environment: 'production',
            sensitivity: 'confidential', owner: admin._id,
            attributes: new Map([['employeeId', 'dynamic']])
        },
        {
            name: 'Admin Dashboard', uon: 'uon://service-admin/production/rpc/admin/dashboard',
            type: 'endpoint', domain: 'service-admin', environment: 'production',
            sensitivity: 'restricted', owner: admin._id,
            attributes: new Map([])
        }
    ]);

    console.log('✅ Resources created');

    // Create policies
    await Policy.create([
        {
            name: 'Admin Full Access',
            description: 'Admins have full access to all resources',
            domain: 'global',
            actorMatcher: { type: 'role', value: 'admin' },
            permissions: [{
                resourceMatcher: 'uon://*/*/*/*',
                actions: ['create', 'read', 'update', 'delete', 'admin', 'execute'],
                effect: 'allow'
            }],
            priority: 100,
            isActive: true,
            createdBy: admin._id,
            tags: ['admin', 'global']
        },
        {
            name: 'Engineering Read Reports',
            description: 'Engineers in querybuilder-development group can read and write reports',
            domain: 'reports',
            actorMatcher: { type: 'group', value: 'querybuilder-development' },
            permissions: [{
                resourceMatcher: 'uon://reports/production/report/*',
                actions: ['read', 'update'],
                effect: 'allow'
            }],
            priority: 50,
            isActive: true,
            createdBy: admin._id,
            tags: ['engineering', 'reports']
        },
        {
            name: 'Kafka Topic Owner Manage',
            description: 'Users with Develop role on a Kafka topic (via uOwn) can manage it',
            domain: 'topics.kafka',
            actorMatcher: { type: 'any' },
            permissions: [{
                resourceMatcher: 'uon://topics.kafka/production/topic/*',
                actions: ['publish', 'subscribe'],
                condition: {
                    expression: 'actor.department == "engineering" || actor.department == "data"',
                    description: 'Only engineering and data teams can use Kafka'
                },
                effect: 'allow'
            }],
            priority: 40,
            isActive: true,
            createdBy: admin._id,
            tags: ['kafka', 'ownership']
        },
        {
            name: 'Payment India Access',
            description: 'Support reps can access payment info only for India region customers',
            domain: 'service-payment',
            actorMatcher: { type: 'role', value: 'manager' },
            permissions: [{
                resourceMatcher: 'uon://service-payment/production/rpc/payment/*',
                actions: ['read'],
                condition: {
                    expression: 'actor.location == "india"',
                    description: 'Manager must be located in India to access payment data'
                },
                effect: 'allow'
            }],
            priority: 30,
            isActive: true,
            createdBy: admin._id,
            tags: ['payment', 'regional']
        },
        {
            name: 'Analyst Read Reports Only',
            description: 'Data analysts can only read reports',
            domain: 'reports',
            actorMatcher: { type: 'role', value: 'analyst' },
            permissions: [{
                resourceMatcher: 'uon://reports/production/report/*',
                actions: ['read'],
                effect: 'allow'
            }],
            priority: 20,
            isActive: true,
            createdBy: admin._id,
            tags: ['analyst', 'reports']
        },
        {
            name: 'Deny Viewer Sensitive Data',
            description: 'Viewers cannot access restricted or confidential resources',
            domain: 'global',
            actorMatcher: { type: 'role', value: 'viewer' },
            permissions: [{
                resourceMatcher: 'uon://orders.mysql.storage/production/table/*',
                actions: ['read', 'create', 'update', 'delete'],
                effect: 'deny'
            }],
            priority: 60,
            isActive: true,
            createdBy: admin._id,
            tags: ['viewer', 'deny', 'database']
        }
    ]);

    console.log('✅ Policies created');
    console.log('\n🎉 Seed complete! Login credentials:');
    console.log('  Admin:     admin@abac.com / password123');
    console.log('  Manager:   priya@abac.com / password123');
    console.log('  Analyst:   rahul@abac.com / password123');
    console.log('  Developer: sneha@abac.com / password123');
    console.log('  Viewer:    amit@abac.com  / password123');

    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
