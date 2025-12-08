/**
 * Simple in-memory cache for server-side API responses
 * Reduces external API calls and improves performance
 * 
 * @note Callers are responsible for ensuring the type parameter T matches the cached data type
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class ServerCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Retrieve cached data if it exists and hasn't expired
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   * @note Caller must ensure type T matches the actual cached data type
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with current timestamp
   * @param key Cache key
   * @param data Data to cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Delete a specific cached entry
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get the number of cached entries
   * @returns Number of cache entries
   */
  size(): number {
    return this.cache.size;
  }
}

export const serverCache = new ServerCache();
