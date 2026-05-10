const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ABAC System API',
      version: '1.0.0',
      description: 'Attribute-Based Access Control System - Complete API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@abac.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'manager', 'analyst', 'developer', 'viewer'] },
            department: { type: 'string' },
            location: { type: 'string' },
            attributes: { type: 'object' }
          }
        },
        Policy: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            domain: { type: 'string' },
            actorMatcher: { type: 'object' },
            permissions: { type: 'array' },
            priority: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        },
        Resource: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            uon: { type: 'string' },
            type: { type: 'string' },
            domain: { type: 'string' },
            sensitivity: { type: 'string' },
            attributes: { type: 'object' }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            actor: { type: 'object' },
            action: { type: 'string' },
            resource: { type: 'object' },
            decision: { type: 'string', enum: ['allow', 'deny'] },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
