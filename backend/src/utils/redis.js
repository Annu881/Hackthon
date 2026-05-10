const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    legacyMode: true
});

client.connect().catch(err => {
    console.warn('⚠️ Redis connection failed (optional):', err.message);
    console.warn('System will work without caching');
});

client.on('error', (err) => {
    console.warn('Redis error:', err.message);
});

client.on('connect', () => {
    console.log('✅ Redis connected');
});

/**
 * Get value from cache
 */
async function getCache(key) {
    try {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.warn('Cache get error:', err.message);
        return null;
    }
}

/**
 * Set value in cache with TTL
 */
async function setCache(key, value, ttl = 3600) {
    try {
        await client.setEx(key, ttl, JSON.stringify(value));
    } catch (err) {
        console.warn('Cache set error:', err.message);
    }
}

/**
 * Delete from cache
 */
async function deleteCache(key) {
    try {
        await client.del(key);
    } catch (err) {
        console.warn('Cache delete error:', err.message);
    }
}

/**
 * Clear all cache matching pattern
 */
async function clearCachePattern(pattern) {
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
    } catch (err) {
        console.warn('Cache clear pattern error:', err.message);
    }
}

/**
 * Clear all cache
 */
async function clearAllCache() {
    try {
        await client.flushDb();
    } catch (err) {
        console.warn('Cache clear all error:', err.message);
    }
}

module.exports = { getCache, setCache, deleteCache, clearCachePattern, clearAllCache };
