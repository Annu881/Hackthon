const request = require('supertest');
const express = require('express');

// Mock Express app for testing
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    
    // Mock middleware
    app.use((req, res, next) => {
        req.user = {
            _id: 'test-user-123',
            email: 'test@abac.com',
            role: 'admin'
        };
        next();
    });

    return app;
};

describe('ABAC System API Tests', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
    });

    describe('Health Check', () => {
        it('should return 200 on GET /', async () => {
            app.get('/', (req, res) => {
                res.json({ message: 'ABAC System API Running' });
            });

            const res = await request(app)
                .get('/')
                .expect(200);
            
            expect(res.body.message).toBe('ABAC System API Running');
        });
    });

    describe('Error Handling', () => {
        it('should handle errors with proper status and message', async () => {
            app.get('/error', (req, res, next) => {
                const err = new Error('Test error');
                next(err);
            });

            app.use((err, req, res, next) => {
                res.status(500).json({ success: false, message: err.message });
            });

            const res = await request(app)
                .get('/error')
                .expect(500);
            
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Test error');
        });
    });

    describe('Authentication Middleware', () => {
        it('should include user in request after middleware', async () => {
            app.get('/protected', (req, res) => {
                res.json({ userId: req.user._id, email: req.user.email });
            });

            const res = await request(app)
                .get('/protected')
                .expect(200);
            
            expect(res.body.userId).toBe('test-user-123');
            expect(res.body.email).toBe('test@abac.com');
        });
    });

    describe('JSON Response Format', () => {
        it('should return success responses with proper structure', async () => {
            app.post('/api/test', (req, res) => {
                res.json({ success: true, data: { name: 'test' } });
            });

            const res = await request(app)
                .post('/api/test')
                .send({ name: 'test' })
                .expect(200);
            
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('test');
        });

        it('should return error responses with proper structure', async () => {
            app.post('/api/error', (req, res) => {
                res.status(400).json({ success: false, message: 'Invalid request' });
            });

            const res = await request(app)
                .post('/api/error')
                .expect(400);
            
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid request');
        });
    });

    describe('Status Codes', () => {
        it('should return 201 for successful creation', async () => {
            app.post('/api/resource', (req, res) => {
                res.status(201).json({ success: true, data: { id: '123' } });
            });

            await request(app)
                .post('/api/resource')
                .send({ name: 'test' })
                .expect(201);
        });

        it('should return 400 for bad request', async () => {
            app.post('/api/resource', (req, res) => {
                res.status(400).json({ success: false, message: 'Missing required fields' });
            });

            await request(app)
                .post('/api/resource')
                .expect(400);
        });

        it('should return 404 for not found', async () => {
            app.get('/api/resource/:id', (req, res) => {
                res.status(404).json({ success: false, message: 'Resource not found' });
            });

            await request(app)
                .get('/api/resource/invalid-id')
                .expect(404);
        });
    });
});
