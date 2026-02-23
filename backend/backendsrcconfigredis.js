const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));
redis.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

// Cache helper methods
const cache = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key, value, ttlSeconds = 3600) {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },
  
  async del(key) {
    await redis.del(key);
  },
  
  async exists(key) {
    return await redis.exists(key);
  },
  
  // Geo-spatial operations for driver locations
  async updateDriverLocation(driverId, lat, lng, metadata = {}) {
    const pipeline = redis.pipeline();
    
    // Add to geospatial index
    pipeline.geoadd('drivers:online', lng, lat, driverId);
    
    // Store metadata
    pipeline.hset(`driver:${driverId}`, {
      lat: lat.toString(),
      lng: lng.toString(),
      lastUpdate: Date.now().toString(),
      ...metadata
    });
    
    // Set expiration
    pipeline.expire(`driver:${driverId}`, 300); // 5 minutes
    
    await pipeline.exec();
  },
  
  async getNearbyDrivers(lat, lng, radiusKm = 5, unit = 'km') {
    const results = await redis.georadius(
      'drivers:online',
      lng, lat,
      radiusKm, unit,
      'WITHDIST', 'WITHCOORD', 'ASC'
    );
    
    return results.map(([driverId, distance, [lng, lat]]) => ({
      driverId,
      distance: parseFloat(distance),
      location: { lat: parseFloat(lat), lng: parseFloat(lng) }
    }));
  },
  
  async removeDriverLocation(driverId) {
    const pipeline = redis.pipeline();
    pipeline.zrem('drivers:online', driverId);
    pipeline.del(`driver:${driverId}`);
    await pipeline.exec();
  },
  
  async getDriverInfo(driverId) {
    return await redis.hgetall(`driver:${driverId}`);
  },
  
  // Rate limiting
  async checkRateLimit(key, maxRequests, windowSeconds) {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetTime: await redis.ttl(key)
    };
  },
  
  // Session management
  async createSession(sessionId, data, ttlSeconds = 86400) {
    await redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
  },
  
  async getSession(sessionId) {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  },
  
  async destroySession(sessionId) {
    await redis.del(`session:${sessionId}`);
  }
};

module.exports = { redis, cache };