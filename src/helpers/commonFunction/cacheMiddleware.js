import cache from '../../utils/cache.js';

export function cacheMiddleware(keyPrefix, ttl = 60) {
  return (req, res, next) => {
    const key = keyPrefix + JSON.stringify(req.params || req.query);
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
