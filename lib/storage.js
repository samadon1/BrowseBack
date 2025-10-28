/**
 * IndexedDB Storage Manager for BrowseBack
 * Handles all local storage operations for captured browsing data
 */

const DB_NAME = 'BrowseBackDB';
const DB_VERSION = 1;
const STORE_NAME = 'captures';

class StorageManager {
  constructor() {
    this.db = null;
    this.version = '1.1.0'; // Added getAll() method
    console.log('StorageManager v' + this.version + ' initialized');
  }

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes for efficient querying
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('url', 'url', { unique: false });
          objectStore.createIndex('title', 'title', { unique: false });
        }
      };
    });
  }

  /**
   * Save a capture to the database
   * @param {Object} capture - The capture data
   * @returns {Promise<number>} The ID of the saved capture
   */
  async saveCapture(capture) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(capture);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Search captures by text content with relevance scoring
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching captures sorted by relevance
   */
  async search(query) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;

        if (!query || query.trim() === '') {
          // Return all results sorted by timestamp (most recent first)
          resolve(results.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50));
          return;
        }

        // Improved search with multiple query terms and relevance scoring
        const searchTerms = query.toLowerCase().trim().split(/\s+/);

        const scoredResults = results.map(capture => {
          const title = (capture.title || '').toLowerCase();
          const url = (capture.url || '').toLowerCase();
          const text = (capture.extractedText || capture.domText || '').toLowerCase();

          let score = 0;
          let matchedTerms = 0;

          searchTerms.forEach(term => {
            // Exact title match (highest priority)
            if (title === term) {
              score += 100;
              matchedTerms++;
            } else if (title.includes(term)) {
              // Title contains term (high priority)
              score += 50;
              matchedTerms++;
              // Bonus for term at start of title
              if (title.startsWith(term)) {
                score += 20;
              }
            }

            // URL match (medium-high priority)
            if (url.includes(term)) {
              score += 30;
              matchedTerms++;
              // Bonus for domain match
              try {
                const urlObj = new URL(capture.url);
                if (urlObj.hostname.includes(term)) {
                  score += 15;
                }
              } catch (e) {
                // Invalid URL, skip domain check
              }
            }

            // Content match (medium priority)
            if (text.includes(term)) {
              // Count occurrences (more mentions = more relevant)
              const occurrences = (text.match(new RegExp(term, 'g')) || []).length;
              score += Math.min(occurrences * 5, 30); // Cap at 30 points
              matchedTerms++;

              // Bonus for term appearing early in content
              const firstIndex = text.indexOf(term);
              if (firstIndex !== -1 && firstIndex < 100) {
                score += 10;
              }
            }
          });

          // Penalty for not matching all terms (for multi-word queries)
          if (searchTerms.length > 1 && matchedTerms < searchTerms.length) {
            score *= 0.5; // Halve score if not all terms match
          }

          // Boost recent results slightly (recency bonus)
          const ageInDays = (Date.now() - capture.timestamp) / (1000 * 60 * 60 * 24);
          if (ageInDays < 1) {
            score += 5; // Today's results get small boost
          }

          return {
            ...capture,
            searchScore: score,
            matchedTerms: matchedTerms
          };
        });

        // Filter out zero-score results and sort by score (then recency)
        const matches = scoredResults
          .filter(result => result.searchScore > 0)
          .sort((a, b) => {
            // Primary sort: by score (higher first)
            if (b.searchScore !== a.searchScore) {
              return b.searchScore - a.searchScore;
            }
            // Secondary sort: by timestamp (newer first)
            return b.timestamp - a.timestamp;
          });

        resolve(matches);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get captures within a time range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Captures within range
   */
  async getByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      const range = IDBKeyRange.bound(
        startDate.getTime(),
        endDate.getTime()
      );

      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete captures older than specified days
   * @param {number} days - Number of days to retain
   * @returns {Promise<number>} Number of deleted captures
   */
  async deleteOlderThan(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      const range = IDBKeyRange.upperBound(cutoffDate.getTime());
      const request = index.openCursor(range);

      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deleteCount++;
          cursor.continue();
        } else {
          resolve(deleteCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete all captures
   * @returns {Promise<void>}
   */
  async deleteAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage stats
   */
  async getStats() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = async () => {
        const count = countRequest.result;

        // Estimate storage size
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          resolve({
            captureCount: count,
            storageUsed: estimate.usage,
            storageQuota: estimate.quota,
            percentageUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
          });
        } else {
          resolve({
            captureCount: count,
            storageUsed: 'Unknown',
            storageQuota: 'Unknown',
            percentageUsed: 'Unknown'
          });
        }
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  /**
   * Get capture by ID
   * @param {number} id - Capture ID
   * @returns {Promise<Object>} Capture data
   */
  async getById(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all captures
   * @returns {Promise<Array>} All captures sorted by timestamp (newest first)
   */
  async getAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        // Sort by timestamp, newest first
        resolve(results.sort((a, b) => b.timestamp - a.timestamp));
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Export for use in other modules
export default StorageManager;
