const { evaluateExpression, matchResourcePattern, matchActor } = require('../services/abacEngine');

describe('ABAC Engine - Expression Evaluation', () => {
    
    // Test evaluateExpression function
    describe('evaluateExpression', () => {
        
        it('should evaluate simple string equality', () => {
            const context = { actor: { location: 'India' }, resource: {}, environment: {} };
            const expr = 'actor.location == "India"';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(true);
        });

        it('should evaluate location mismatch', () => {
            const context = { actor: { location: 'USA' }, resource: {}, environment: {} };
            const expr = 'actor.location == "India"';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(false);
        });

        it('should evaluate numeric comparison', () => {
            const context = { actor: {}, resource: {}, environment: { hour: 14 } };
            const expr = 'env.hour >= 9 && env.hour <= 17';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(true);
        });

        it('should evaluate outside working hours', () => {
            const context = { actor: {}, resource: {}, environment: { hour: 20 } };
            const expr = 'env.hour >= 9 && env.hour <= 17';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(false);
        });

        it('should evaluate role-based condition', () => {
            const context = { 
                actor: { role: 'manager' }, 
                resource: { sensitivity: 'restricted' }, 
                environment: {} 
            };
            const expr = 'actor.role == "manager" && resource.sensitivity == "restricted"';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(true);
        });

        it('should handle AND conditions', () => {
            const context = { 
                actor: { role: 'admin', location: 'India' }, 
                resource: {}, 
                environment: {} 
            };
            const expr = 'actor.role == "admin" && actor.location == "India"';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(true);
        });

        it('should handle OR conditions', () => {
            const context = { 
                actor: { role: 'admin' }, 
                resource: {}, 
                environment: {} 
            };
            const expr = 'actor.role == "admin" || actor.role == "manager"';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(true);
        });

        it('should handle IN array condition', () => {
            const context = { actor: { role: 'engineer' }, resource: {}, environment: {} };
            const expr = '"engineer" in ["engineer", "developer", "analyst"]';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(true);
        });

        it('should handle string contains', () => {
            const context = { actor: { email: 'john@company.com' }, resource: {}, environment: {} };
            const expr = '"john@company.com".contains("company")';
            const result = evaluateExpression(expr, context);
            expect(result.result).toBe(true);
        });

        it('should return error for invalid expression', () => {
            const context = { actor: {}, resource: {}, environment: {} };
            const expr = 'invalid syntax !!';
            const result = evaluateExpression(expr, context);
            expect(result.error).toBeTruthy();
            expect(result.result).toBe(false);
        });
    });

    describe('matchResourcePattern', () => {
        
        it('should match exact resource path', () => {
            const pattern = 'uon://reports/production/report/sales';
            const resourceUon = 'uon://reports/production/report/sales';
            const result = matchResourcePattern(pattern, resourceUon);
            expect(result).toBe(true);
        });

        it('should match wildcard at end', () => {
            const pattern = 'uon://reports/production/*';
            const resourceUon = 'uon://reports/production/report/sales';
            const result = matchResourcePattern(pattern, resourceUon);
            expect(result).toBe(true);
        });

        it('should match multiple wildcards', () => {
            const pattern = 'uon://reports/*/sales/*';
            const resourceUon = 'uon://reports/production/sales/q1';
            const result = matchResourcePattern(pattern, resourceUon);
            expect(result).toBe(true);
        });

        it('should not match different path', () => {
            const pattern = 'uon://reports/production/*';
            const resourceUon = 'uon://data/production/users';
            const result = matchResourcePattern(pattern, resourceUon);
            expect(result).toBe(false);
        });

        it('should match root wildcard', () => {
            const pattern = 'uon://*/*';
            const resourceUon = 'uon://reports/production';
            const result = matchResourcePattern(pattern, resourceUon);
            expect(result).toBe(true);
        });
    });

    describe('matchActor', () => {
        
        it('should match any actor type', () => {
            const actorMatcher = { type: 'any' };
            const actor = { role: 'viewer', userId: '123' };
            const result = matchActor(actorMatcher, actor);
            expect(result).toBe(true);
        });

        it('should match role', () => {
            const actorMatcher = { type: 'role', value: 'admin' };
            const actor = { role: 'admin' };
            const result = matchActor(actorMatcher, actor);
            expect(result).toBe(true);
        });

        it('should not match different role', () => {
            const actorMatcher = { type: 'role', value: 'admin' };
            const actor = { role: 'viewer' };
            const result = matchActor(actorMatcher, actor);
            expect(result).toBe(false);
        });

        it('should match user by ID', () => {
            const actorMatcher = { type: 'user', value: '123' };
            const actor = { userId: '123' };
            const result = matchActor(actorMatcher, actor);
            expect(result).toBe(true);
        });

        it('should match user by email', () => {
            const actorMatcher = { type: 'user', value: 'john@company.com' };
            const actor = { email: 'john@company.com' };
            const result = matchActor(actorMatcher, actor);
            expect(result).toBe(true);
        });

        it('should match group membership', () => {
            const actorMatcher = { type: 'group', value: 'engineering' };
            const actor = { groups: ['engineering', 'backend'] };
            const result = matchActor(actorMatcher, actor);
            expect(result).toBe(true);
        });

        it('should match service', () => {
            const actorMatcher = { type: 'service', value: 'auth-service' };
            const actor = { serviceId: 'auth-service' };
            const result = matchActor(actorMatcher, actor);
            expect(result).toBe(true);
        });
    });
});
