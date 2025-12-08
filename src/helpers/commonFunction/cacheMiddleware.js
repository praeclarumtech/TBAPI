import cache from '../../utils/cache.js';

export function cacheMiddleware(keyPrefix, ttl = 60) {
  return (req, res, next) => {
    // Combine both params and query to ensure all parameters are included in cache key
    const cacheParams = {
      ...(req.params || {}),
      ...(req.query || {}),
    };
    // Sort keys to ensure consistent cache key generation
    const sortedParams = Object.keys(cacheParams)
      .sort()
      .reduce((acc, key) => {
        acc[key] = cacheParams[key];
        return acc;
      }, {});
    const key = keyPrefix + JSON.stringify(sortedParams);
    const cachedData = cache.get(key);
    if (cachedData) {
      console.log(`⚡ Cache hit: ${key}`);
      return res.json(cachedData);
    }

    console.log(`🗄️ Cache miss: ${key} → fetching from DB`);

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
}
