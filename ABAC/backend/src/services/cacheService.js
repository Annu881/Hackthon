/**
 * Redis Cache Service — Fast access caching
 * Caches policies so MongoDB is not hit on every request
 * Falls back gracefully if Redis is not available
 */

let redisClient = null;
let redisAvailable = false;

const CACHE_TTL = 300; // 5 minutes
const POLICY_CACHE_KEY = 'abac:policies:all';
const RESOURCE_CACHE_PREFIX = 'abac:resource:';

async function initRedis() {
    try {
        const redis = require('redis');
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: { connectTimeout: 3000, reconnectStrategy: false }
        });

        redisClient.on('error', (err) => {
            if (redisAvailable) {
                console.warn('⚠️  Redis disconnected — falling back to MongoDB directly');
                redisAvailable = false;
            }
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected — policy caching enabled');
            redisAvailable = true;
        });

        await redisClient.connect();
        redisAvailable = true;
    } catch (err) {
        console.warn('⚠️  Redis not available — running without cache (MongoDB direct)');
        redisAvailable = false;
        redisClient = null;
    }
}

// Get cached policies
async function getCachedPolicies() {
    if (!redisAvailable || !redisClient) return null;
    try {
        const data = await redisClient.get(POLICY_CACHE_KEY);
        if (data) {
            console.log('⚡ Cache HIT — policies from Redis');
            return JSON.parse(data);
        }
        console.log('📦 Cache MISS — fetching from MongoDB');
        return null;
    } catch (err) {
        return null;
    }
}

// Store policies in cache
async function setCachedPolicies(policies) {
    if (!redisAvailable || !redisClient) return;
    try {
        await redisClient.setEx(POLICY_CACHE_KEY, CACHE_TTL, JSON.stringify(policies));
    } catch (err) { }
}

// Invalidate policy cache (call when policy is created/updated/deleted)
async function invalidatePolicyCache() {
    if (!redisAvailable || !redisClient) return;
    try {
        await redisClient.del(POLICY_CACHE_KEY);
        console.log('🗑️  Policy cache invalidated');
    } catch (err) { }
}

// Cache a single resource by UON
async function getCachedResource(uon) {
    if (!redisAvailable || !redisClient) return null;
    try {
        const data = await redisClient.get(RESOURCE_CACHE_PREFIX + uon);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        return null;
    }
}

async function setCachedResource(uon, resource) {
    if (!redisAvailable || !redisClient) return;
    try {
        await redisClient.setEx(RESOURCE_CACHE_PREFIX + uon, CACHE_TTL, JSON.stringify(resource));
    } catch (err) { }
}

async function invalidateResourceCache(uon) {
    if (!redisAvailable || !redisClient) return;
    try {
        await redisClient.del(RESOURCE_CACHE_PREFIX + uon);
    } catch (err) { }
}

// Get cache stats for dashboard
async function getCacheStats() {
    if (!redisAvailable || !redisClient) {
        return { available: false, message: 'Redis not connected — using MongoDB directly' };
    }
    try {
        const info = await redisClient.info('stats');
        const hits = (info.match(/keyspace_hits:(\d+)/) || [])[1] || 0;
        const misses = (info.match(/keyspace_misses:(\d+)/) || [])[1] || 0;
        const total = parseInt(hits) + parseInt(misses);
        const hitRate = total > 0 ? Math.round((parseInt(hits) / total) * 100) : 0;
        return {
            available: true,
            hits: parseInt(hits),
            misses: parseInt(misses),
            hitRate: hitRate + '%',
            ttl: CACHE_TTL + 's',
            message: 'Redis active'
        };
    } catch (err) {
        return { available: false, message: err.message };
    }
}

module.exports = {
    initRedis,
    getCachedPolicies,
    setCachedPolicies,
    invalidatePolicyCache,
    getCachedResource,
    setCachedResource,
    invalidateResourceCache,
    getCacheStats,
    isAvailable: () => redisAvailable
};
