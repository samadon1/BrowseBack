/**
 * Screenshot Capture Module for BrowseBack
 * Handles tab screenshot capture and compression
 */

export class CaptureManager {
  constructor() {
    this.lastCaptureHash = null;
  }

  /**
   * Capture screenshot of the active tab
   * @param {number} tabId - The tab ID to capture
   * @param {number} windowId - The window ID containing the tab
   * @returns {Promise<string>} Base64 encoded screenshot (PNG format)
   */
  async captureTab(tabId, windowId) {
    try {
      // Capture as JPEG for better compression (service workers can't use Canvas)
      // Note: Chrome's captureVisibleTab works in service workers
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
        format: 'jpeg',
        quality: 70  // Good balance between quality and size
      });

      return dataUrl;
    } catch (error) {
      // Ignore transient errors like "user may be dragging a tab"
      if (error.message.includes('user may be dragging') ||
          error.message.includes('cannot be edited right now')) {
        console.debug('Skipping capture - tab temporarily unavailable:', error.message);
        return null; // Will retry next interval
      }

      console.error('Error capturing tab:', error);
      throw error;
    }
  }

  /**
   * Check if page content has changed significantly
   * @param {string} screenshot - Base64 screenshot
   * @returns {boolean} True if content changed
   */
  hasContentChanged(screenshot) {
    // Simple hash-based comparison
    const hash = this.simpleHash(screenshot);

    if (this.lastCaptureHash === hash) {
      return false;
    }

    this.lastCaptureHash = hash;
    return true;
  }

  /**
   * Simple string hash function
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i += 100) { // Sample every 100 chars for speed
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Get visible tab info
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Tab info
   */
  async getTabInfo(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      return {
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl
      };
    } catch (error) {
      console.error('Error getting tab info:', error);
      return {
        url: 'unknown',
        title: 'Unknown Page',
        favIconUrl: null
      };
    }
  }

  /**
   * Check if URL should be captured
   * @param {string} url - URL to check
   * @returns {boolean} True if should capture
   */
  shouldCapture(url) {
    // Skip chrome:// pages, extension pages, and new tab
    const skipPatterns = [
      'chrome://',
      'chrome-extension://',
      'about:',
      'edge://',
      'brave://'
    ];

    return !skipPatterns.some(pattern => url.startsWith(pattern));
  }
}

export default CaptureManager;
