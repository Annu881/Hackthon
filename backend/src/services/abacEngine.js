/**
 * ABAC Engine — Uber Charter + authfx inspired
 * NOW WITH Redis caching — policies fetched from cache, not MongoDB every time
 */

const Policy = require('../models/Policy');
const Resource = require('../models/Resource');
const AuditLog = require('../models/AuditLog');
const cache = require('./cacheService');

// ─── Expression Evaluator (CEL-like) ────────────────────────────────────────

function evaluateExpression(expression, context) {
    try {
        let expr = expression;

        expr = expr.replace(/actor\.(\w+)/g, (match, attr) => {
            const val = context.actor[attr];
            return typeof val === 'string' ? `"${val}"` : (val !== undefined ? val : 'null');
        });

        expr = expr.replace(/resource\.(\w+)/g, (match, attr) => {
            const val = context.resource[attr];
            return typeof val === 'string' ? `"${val}"` : (val !== undefined ? val : 'null');
        });

        expr = expr.replace(/env\.(\w+)/g, (match, attr) => {
            const val = context.environment && context.environment[attr];
            return typeof val === 'string' ? `"${val}"` : (val !== undefined ? val : 'null');
        });

        // "value" in ["a","b"] operator
        expr = expr.replace(/"([^"]+)"\s+in\s+\[([^\]]+)\]/g, (match, val, arr) => {
            const items = arr.split(',').map(s => s.trim().replace(/"/g, ''));
            return items.includes(val) ? 'true' : 'false';
        });

        // string.contains() operator
        expr = expr.replace(/"([^"]*)"\s*\.contains\("([^"]*)"\)/g, (match, str, sub) => {
            return str.includes(sub) ? 'true' : 'false';
        });

        // eslint-disable-next-line no-new-func
        const result = new Function('"use strict"; return (' + expr + ');')();
        return { result: Boolean(result), error: null };
    } catch (err) {
        return { result: false, error: 'Expression error: ' + err.message };
    }
}

/**
 * Resource Pattern Matcher
 * Supports:
 * - exact match: uon://a/b/c
 * - wildcard segment: uon://a/b/*
 * - globstar (recursive): uon://a/b/**
 */
function matchResourcePattern(pattern, resourceUon) {
    if (!pattern || !resourceUon) return false;

    // Normalize: remove trailing slashes for consistent comparison
    const p = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
    const r = resourceUon.endsWith('/') ? resourceUon.slice(0, -1) : resourceUon;

    if (p === r) return true;

    const patternParts = p.split('/');
    const uonParts = r.split('/');

    // Globstar support: uon://** or uon://reports/**
    const doubleStarIndex = patternParts.indexOf('**');
    if (doubleStarIndex !== -1) {
        // Match everything up to the **
        for (let i = 0; i < doubleStarIndex; i++) {
            if (patternParts[i] !== uonParts[i] && patternParts[i] !== '*') return false;
        }
        return true;
    }

    // Default segmented match
    if (patternParts.length !== uonParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i] === '*') continue;
        if (patternParts[i] !== uonParts[i]) return false;
    }
    return true;
}

// ─── Actor Matcher ───────────────────────────────────────────────────────────

function matchActor(actorMatcher, actor) {
    if (actorMatcher.type === 'any') return true;
    if (actorMatcher.type === 'role') return actor.role === actorMatcher.value;
    if (actorMatcher.type === 'user') return actor.userId === actorMatcher.value || actor.email === actorMatcher.value;
    if (actorMatcher.type === 'group') return Array.isArray(actor.groups) && actor.groups.includes(actorMatcher.value);
    if (actorMatcher.type === 'service') return actor.serviceId === actorMatcher.value;
    return false;
}

// ─── Fetch Policies (with Redis cache) ──────────────────────────────────────

async function fetchActivePolicies() {
    // Try Redis cache first
    const cached = await cache.getCachedPolicies();
    if (cached) return cached;

    // Cache miss — fetch from MongoDB
    const policies = await Policy.find({ isActive: true }).sort({ priority: -1 }).lean();

    // Store in Redis for next requests
    await cache.setCachedPolicies(policies);

    return policies;
}

// ─── Fetch Resource (with Redis cache) ──────────────────────────────────────

async function fetchResource(uon) {
    const cached = await cache.getCachedResource(uon);
    if (cached) return cached;

    const resource = await Resource.findOne({ uon }).lean();
    if (resource) await cache.setCachedResource(uon, resource);
    return resource;
}

/**
 * Flattens a context object for storage in the database (simple Map<string, string>)
 */
function flattenContext(obj, prefix = '') {
    const flat = {};
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(flat, flattenContext(obj[key], `${prefix}${key}.`));
        } else {
            flat[`${prefix}${key}`] = String(obj[key]);
        }
    }
    return flat;
}

// ─── Main ABAC Evaluate Function ────────────────────────────────────────────

async function evaluate(opts) {
    const actor = opts.actor;
    const action = opts.action;
    const resourceUon = opts.resourceUon;
    const context = opts.context || {};
    const requestIp = opts.requestIp || '';

    const startTime = Date.now();

    try {
        // 1. Fetch policies (from Redis cache or MongoDB)
        const policies = await fetchActivePolicies();

        // 2. Fetch resource attributes (from Redis cache or MongoDB)
        const resourceDoc = await fetchResource(resourceUon);

        const resourceAttrs = {};
        if (resourceDoc && resourceDoc.attributes) {
            // Handle both Map and plain object
            if (typeof resourceDoc.attributes.forEach === 'function') {
                resourceDoc.attributes.forEach((val, key) => { resourceAttrs[key] = val; });
            } else {
                Object.assign(resourceAttrs, resourceDoc.attributes);
            }
        }
        if (resourceDoc) {
            resourceAttrs.type = resourceDoc.type || '';
            resourceAttrs.domain = resourceDoc.domain || '';
            resourceAttrs.sensitivity = resourceDoc.sensitivity || '';
        }

        // 3. Build actor attributes
        const actorAttrs = {};
        if (actor.attributes) {
            try {
                if (typeof actor.attributes.forEach === 'function') {
                    actor.attributes.forEach((val, key) => { actorAttrs[key] = val; });
                } else {
                    Object.assign(actorAttrs, actor.attributes);
                }
            } catch (e) { }
        }

        // 4. Build evaluation context
        const now = new Date();
        const evalContext = {
            actor: Object.assign({
                userId: actor._id ? actor._id.toString() : '',
                email: actor.email || '',
                role: actor.role || '',
                department: actor.department || '',
                location: actor.location || '',
                groups: actor.groups || []
            }, actorAttrs, context.actorAttributes || {}),
            resource: Object.assign({ uon: resourceUon }, resourceAttrs, context.resourceAttributes || {}),
            environment: Object.assign({
                time: now.toISOString(),
                time_unix: Math.floor(now.getTime() / 1000),
                hour: now.getHours(),
                minute: now.getMinutes(),
                dayOfWeek: now.getDay(), // 0=Sunday, 6=Saturday
                isWeekend: now.getDay() === 0 || now.getDay() === 6,
                isWorkingHours: now.getHours() >= 9 && now.getHours() < 18
            }, context.environment || {})
        };

        // Safe objects for audit log
        const safeActor = {
            userId: actor._id || null,
            email: String(actor.email || ''),
            role: String(actor.role || ''),
            department: String(actor.department || ''),
            location: String(actor.location || '')
        };
        const safeResource = {
            uon: String(resourceUon || ''),
            type: String(resourceDoc ? resourceDoc.type || '' : ''),
            domain: String(resourceDoc ? resourceDoc.domain || '' : '')
        };

        const defaultDecision = {
            allowed: false,
            reason: 'No matching policy found',
            matchedPolicy: null,
            conditionResult: null,
            latencyMs: 0
        };

        // 5. Evaluate policies in priority order
        const evaluationSteps = [];

        for (let pi = 0; pi < policies.length; pi++) {
            const policy = policies[pi];
            const isActorMatch = matchActor(policy.actorMatcher, evalContext.actor);

            evaluationSteps.push({
                policyName: policy.name,
                priority: policy.priority,
                actorMatch: isActorMatch,
                step: 'Actor Matching'
            });

            if (!isActorMatch) continue;

            const permissions = policy.permissions || [];
            for (let ppi = 0; ppi < permissions.length; ppi++) {
                const permission = permissions[ppi];
                const isResourceMatch = matchResourcePattern(permission.resourceMatcher, resourceUon);
                const isActionMatch = permission.actions.includes(action);

                evaluationSteps.push({
                    policyName: policy.name,
                    resourceMatch: isResourceMatch,
                    actionMatch: isActionMatch,
                    step: 'Permission Matching'
                });

                if (!isResourceMatch || !isActionMatch) continue;

                let conditionResult = true;
                let conditionEvaluated = '';

                if (permission.condition && permission.condition.expression) {
                    conditionEvaluated = permission.condition.expression;
                    const evalResult = evaluateExpression(permission.condition.expression, evalContext);
                    conditionResult = evalResult.result;

                    evaluationSteps.push({
                        policyName: policy.name,
                        conditionExpression: conditionEvaluated,
                        conditionResult: conditionResult,
                        step: 'Condition Evaluation'
                    });

                    if (evalResult.error) console.warn('Condition eval error:', evalResult.error);
                }

                const allowed = permission.effect === 'allow' ? conditionResult : !conditionResult;
                const latencyMs = Date.now() - startTime;

                // 6. Write audit log (async — don't await, don't block response)
                AuditLog.create({
                    actor: safeActor,
                    action: String(action),
                    resource: safeResource,
                    decision: allowed ? 'allow' : 'deny',
                    matchedPolicy: String(policy.name || ''),
                    conditionEvaluated: String(conditionEvaluated || ''),
                    conditionResult: conditionResult,
                    context: flattenContext(evalContext),
                    reason: allowed ? ('Matched policy: ' + policy.name) : ('Denied by policy: ' + policy.name),
                    ip: String(requestIp || ''),
                    latencyMs
                }).catch(e => console.error('Audit log error (non-fatal):', e.message));

                return {
                    allowed,
                    reason: allowed
                        ? ('Access granted by policy: ' + policy.name)
                        : ('Access denied by policy: ' + policy.name),
                    matchedPolicy: policy.name,
                    conditionResult,
                    conditionExpression: conditionEvaluated || null,
                    policyDomain: policy.domain,
                    effect: permission.effect,
                    latencyMs,
                    evaluationSteps,
                    cachedPolicies: cache.isAvailable()
                };
            }
        }

        // No policy matched
        const latencyMs = Date.now() - startTime;
        AuditLog.create({
            actor: safeActor,
            action: String(action),
            resource: safeResource,
            decision: 'deny',
            reason: 'No matching policy found',
            context: flattenContext(evalContext),
            ip: String(requestIp || ''),
            latencyMs
        }).catch(e => console.error('Audit log error (non-fatal):', e.message));

        return { ...defaultDecision, evaluationSteps, latencyMs, cachedPolicies: cache.isAvailable() };

    } catch (err) {
        console.error('ABAC Engine error:', err);
        throw err;
    }
}

module.exports = { evaluate, fetchActivePolicies };
