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
   * Calculate Levenshtein distance for fuzzy matching
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Check if two words are fuzzy matches (tolerates 1-2 character differences)
   * @param {string} word1 - Search term
   * @param {string} word2 - Word from content
   * @returns {number} Fuzzy match score (0-1, where 1 is perfect match)
   */
  fuzzyMatch(word1, word2) {
    if (word1 === word2) return 1.0;
    if (word1.length < 4 || word2.length < 4) return 0; // Too short for fuzzy matching

    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    const similarity = 1 - (distance / maxLength);

    // Only consider it a match if similarity is high enough
    if (similarity >= 0.8) return similarity * 0.7; // 70% of exact match score
    return 0;
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
          resolve(results.sort((a, b) => b.timestamp - a.timestamp));
          return;
        }

        // Improved search with exact phrase matching and relevance scoring
        const normalizedQuery = query.toLowerCase().trim();
        const searchTerms = normalizedQuery.split(/\s+/);

        const scoredResults = results.map(capture => {
          const title = (capture.title || '').toLowerCase();
          const url = (capture.url || '').toLowerCase();
          const text = (capture.extractedText || capture.domText || '').toLowerCase();

          let score = 0;
          let matchedTerms = 0;
          let hasExactPhrase = false;

          // PRIORITY 1: Exact phrase matches (highest priority)
          if (searchTerms.length > 1) {
            // Check for exact phrase match in title
            if (title.includes(normalizedQuery)) {
              score += 500; // Massive boost for exact phrase in title
              hasExactPhrase = true;
              // Extra bonus if title IS the exact phrase
              if (title === normalizedQuery) {
                score += 200;
              }
            }

            // Check for exact phrase match in content
            if (text.includes(normalizedQuery)) {
              score += 300; // Very high boost for exact phrase in content
              hasExactPhrase = true;

              // Count exact phrase occurrences
              const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const phraseOccurrences = (text.match(new RegExp(escapedQuery, 'g')) || []).length;
              score += Math.min(phraseOccurrences * 50, 200); // Up to 200 bonus for multiple occurrences

              // Bonus for exact phrase appearing very early in content
              const firstIndex = text.indexOf(normalizedQuery);
              if (firstIndex !== -1 && firstIndex < 50) {
                score += 100; // Big bonus for appearing at the start
              } else if (firstIndex !== -1 && firstIndex < 200) {
                score += 50; // Medium bonus for appearing early
              }
            }

            // Check for exact phrase match in URL
            if (url.includes(normalizedQuery)) {
              score += 200; // High boost for exact phrase in URL
              hasExactPhrase = true;
            }
          }

          // PRIORITY 2: Individual term matching (only if no exact phrase match)
          searchTerms.forEach(term => {
            let termMatched = false;

            // Exact title match
            if (title === term) {
              score += hasExactPhrase ? 50 : 100; // Lower if we already have exact phrase
              matchedTerms++;
              termMatched = true;
            } else if (title.includes(term)) {
              // Title contains term
              score += hasExactPhrase ? 25 : 50;
              matchedTerms++;
              termMatched = true;
              // Bonus for term at start of title
              if (title.startsWith(term)) {
                score += hasExactPhrase ? 10 : 20;
              }
            } else if (term.length >= 4) {
              // Fuzzy match in title for typos
              const titleWords = title.split(/\s+/);
              for (const word of titleWords) {
                const fuzzyScore = this.fuzzyMatch(term, word);
                if (fuzzyScore > 0) {
                  score += (hasExactPhrase ? 25 : 50) * fuzzyScore;
                  matchedTerms += 0.5; // Partial credit
                  termMatched = true;
                  break;
                }
              }
            }

            // URL match
            if (url.includes(term)) {
              score += hasExactPhrase ? 15 : 30;
              if (!termMatched) matchedTerms++;
              termMatched = true;
              // Bonus for domain match
              try {
                const urlObj = new URL(capture.url);
                if (urlObj.hostname.includes(term)) {
                  score += hasExactPhrase ? 7 : 15;
                }
              } catch (e) {
                // Invalid URL, skip domain check
              }
            }

            // Content match
            if (text.includes(term)) {
              // Count occurrences
              const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const occurrences = (text.match(new RegExp(escapedTerm, 'g')) || []).length;
              const termScore = Math.min(occurrences * 5, 30);
              score += hasExactPhrase ? termScore * 0.5 : termScore; // Lower if we already have exact phrase
              if (!termMatched) matchedTerms++;
              termMatched = true;

              // Bonus for term appearing early in content
              const firstIndex = text.indexOf(term);
              if (firstIndex !== -1 && firstIndex < 100) {
                score += hasExactPhrase ? 5 : 10;
              }
            } else if (!termMatched && term.length >= 4) {
              // Fuzzy match in content for typos (only check first 2000 chars for performance)
              const contentSample = text.substring(0, 2000);
              const contentWords = contentSample.split(/\s+/);
              for (const word of contentWords) {
                const fuzzyScore = this.fuzzyMatch(term, word);
                if (fuzzyScore > 0) {
                  score += Math.min(5, 30) * fuzzyScore;
                  matchedTerms += 0.5; // Partial credit
                  termMatched = true;
                  break;
                }
              }
            }
          });

          // Penalty for not matching all terms (only matters if no exact phrase match)
          if (!hasExactPhrase && searchTerms.length > 1 && matchedTerms < searchTerms.length) {
            score *= 0.5; // Halve score if not all terms match
          }

          // Small recency bonus (shouldn't override exact matches)
          const ageInDays = (Date.now() - capture.timestamp) / (1000 * 60 * 60 * 24);
          if (ageInDays < 1) {
            score += 5; // Today's results get small boost
          }

          return {
            ...capture,
            searchScore: score,
            matchedTerms: matchedTerms,
            hasExactPhrase: hasExactPhrase
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

        // Debug logging for search results
        if (matches.length > 0) {
          console.log(`🔍 Search for "${query}" found ${matches.length} results`);
          console.log('Top 3 results:', matches.slice(0, 3).map(m => ({
            title: m.title,
            score: m.searchScore,
            hasExactPhrase: m.hasExactPhrase,
            url: m.url
          })));
        }

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
