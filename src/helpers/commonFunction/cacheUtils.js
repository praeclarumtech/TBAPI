// helpers/commonFunction/cacheUtils.js
import cache from '../../utils/cache.js';

export const clearCacheByPrefixes = (prefixes) => {
  const prefixArray = Array.isArray(prefixes) ? prefixes : [prefixes];

  cache.keys()
    .filter(key => prefixArray.some(prefix => key.startsWith(prefix)))
    .forEach(key => cache.del(key));
};
