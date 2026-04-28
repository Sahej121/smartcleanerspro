// Simple in-memory TTL cache for server-side use
const cache = new Map();

/**
 * Get or set cache value
 * @param {string} key Cache key
 * @param {Function} fetcher Async function to fetch data if not in cache
 * @param {number} ttl Time to live in milliseconds
 */
export async function getCachedData(key, fetcher, ttl = 60000) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && (now - cached.timestamp < ttl)) {
    return cached.data;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Update cache
  cache.set(key, {
    data,
    timestamp: now
  });

  return data;
}

/**
 * Invalidate a specific cache key
 * @param {string} key 
 */
export function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Clear the entire cache
 */
export function clearCache() {
  cache.clear();
}
