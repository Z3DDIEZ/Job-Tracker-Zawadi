/**
 * Cache Management
 * Handles localStorage caching with TTL
 */

import type { JobApplication, CacheData } from '@/types';

const CACHE_KEY = 'job_tracker_cache';
const CACHE_TIMESTAMP_KEY = 'job_tracker_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const CacheManager = {
  save(data: JobApplication[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('📦 Cache saved:', data.length, 'applications');
    } catch (error) {
      console.error('Cache save failed:', error);
    }
  },

  load(): JobApplication[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || '0');
      const age = Date.now() - timestamp;

      if (cached && age < CACHE_DURATION) {
        const data = JSON.parse(cached) as JobApplication[];
        console.log(
          '✅ Cache loaded:',
          data.length,
          'applications (age:',
          Math.round(age / 1000),
          's)'
        );
        return data;
      } else {
        console.log('⚠️ Cache expired or empty');
        return null;
      }
    } catch (error) {
      console.error('Cache load failed:', error);
      return null;
    }
  },

  invalidate(): void {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('🗑️ Cache invalidated');
  },

  getCacheData(): CacheData {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || '0');
      const age = Date.now() - timestamp;

      if (cached && age < CACHE_DURATION) {
        return {
          data: JSON.parse(cached) as JobApplication[],
          timestamp,
          isValid: true,
        };
      }
      return {
        data: [] as JobApplication[],
        timestamp: 0,
        isValid: false,
      };
    } catch (error) {
      console.error('Cache read failed:', error);
      return {
        data: [] as JobApplication[],
        timestamp: 0,
        isValid: false,
      };
    }
  },
};
