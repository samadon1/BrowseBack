/**
 * Background Service Worker for BrowseBack
 * Handles automatic tab capture and storage
 */

import StorageManager from './lib/storage.js';
import CaptureManager from './lib/capture.js';
import SemanticSearch from './lib/semantic-search.js';

// Handle extension icon click - open sidebar
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Global instances
let storageManager = null;
let captureManager = null;
let semanticSearch = null;
let captureInterval = null;
let isIndexBuilt = false;

// Configuration
const CAPTURE_INTERVAL_MS = 15000; // 15 seconds (Chrome has rate limits)
const RETENTION_DAYS = 7; // Keep data for 7 days

/**
 * Initialize the extension
 */
async function initialize() {
  console.log('BrowseBack: Initializing...');

  // Initialize storage
  storageManager = new StorageManager();
  await storageManager.init();

  // Initialize capture manager
  captureManager = new CaptureManager();

  // Initialize semantic search
  semanticSearch = new SemanticSearch();

  // Build semantic index from existing captures
  await buildSemanticIndex();

  // Load settings from Chrome storage
  const settings = await loadSettings();

  // Start automatic capture
  startAutomaticCapture(settings.captureInterval || CAPTURE_INTERVAL_MS);

  // Set up cleanup schedule
  scheduleCleanup(settings.retentionDays || RETENTION_DAYS);

  console.log('BrowseBack: Initialized successfully');
}

/**
 * Load user settings from Chrome storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['captureInterval', 'retentionDays', 'enabled'], (result) => {
      resolve({
        captureInterval: result.captureInterval || CAPTURE_INTERVAL_MS,
        retentionDays: result.retentionDays || RETENTION_DAYS,
        enabled: result.enabled !== false // Enabled by default
      });
    });
  });
}

/**
 * Start automatic tab capture
 */
function startAutomaticCapture(interval) {
  // Clear existing interval
  if (captureInterval) {
    clearInterval(captureInterval);
  }

  // Set up new interval
  captureInterval = setInterval(async () => {
    await captureCurrentTab();
  }, interval);

  console.log(`BrowseBack: Auto-capture started (every ${interval / 1000}s)`);
}

/**
 * Capture the current active tab
 */
async function captureCurrentTab() {
  try {
    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab) {
      return;
    }

    // Check if we should capture this URL
    if (!captureManager.shouldCapture(activeTab.url)) {
      return;
    }

    // Get tab info
    const tabInfo = await captureManager.getTabInfo(activeTab.id);

    // Capture screenshot (pass windowId for proper permissions)
    const screenshot = await captureManager.captureTab(activeTab.id, activeTab.windowId);

    // Skip if capture failed (e.g., tab was being dragged)
    if (!screenshot) {
      console.debug('BrowseBack: Skipping capture - screenshot unavailable');
      return;
    }

    // Check if content has changed
    if (!captureManager.hasContentChanged(screenshot)) {
      console.log('BrowseBack: Content unchanged, skipping capture');
      return;
    }

    // Get DOM text from content script
    const domText = await extractDOMText(activeTab.id);

    // Create capture object
    const capture = {
      timestamp: Date.now(),
      url: tabInfo.url,
      title: tabInfo.title,
      screenshot: screenshot,
      domText: domText,
      extractedText: domText, // Will be enhanced by AI in offscreen document
      favIconUrl: tabInfo.favIconUrl
    };

    // Save to storage
    const captureId = await storageManager.saveCapture(capture);

    // Notify any open popups/sidebars that a new capture was saved
    try {
      chrome.runtime.sendMessage({
        action: 'captureAdded',
        captureId: captureId,
        timestamp: capture.timestamp
      }).catch(() => {
        // Ignore errors if no popup is open
      });
    } catch (e) {
      // Popup might not be open, that's okay
    }

    // Process with AI in offscreen document (async, don't block)
    processWithAI(captureId, screenshot, domText);

    console.log(`BrowseBack: Captured ${tabInfo.title} (ID: ${captureId})`);
  } catch (error) {
    console.error('BrowseBack: Error capturing tab:', error);
  }
}

/**
 * Extract text content from DOM via content script
 */
async function extractDOMText(tabId) {
  try {
    // First, try to inject the content script if it's not already there
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Ignore error if already injected
    });

    // Small delay to ensure script is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now try to send message
    const response = await chrome.tabs.sendMessage(tabId, { action: 'extractText' });
    return response?.text || '';
  } catch (error) {
    // Silently fail - content script might not be compatible with this page
    // (e.g., chrome:// pages, extension pages)
    return '';
  }
}

/**
 * Build semantic search index from all captures
 */
async function buildSemanticIndex() {
  try {
    console.log('BrowseBack: Building semantic search index...');
    const allCaptures = await storageManager.getAll();

    if (allCaptures.length === 0) {
      console.log('BrowseBack: No captures yet, skipping index build');
      return;
    }

    await semanticSearch.buildIndex(allCaptures);
    isIndexBuilt = true;
    console.log(`BrowseBack: Semantic index built with ${allCaptures.length} documents`);
  } catch (error) {
    console.error('BrowseBack: Error building semantic index:', error);
  }
}

/**
 * Process capture with AI (offscreen document for DOM access)
 * This is a placeholder - actual AI processing happens in popup/search
 * because service workers have limitations with canvas/DOM APIs
 */
async function processWithAI(captureId, screenshot, domText) {
  // Note: AI processing will happen in the popup when searching
  // Service workers can't use canvas or create Image elements
  // We store the raw screenshot and process it on-demand
  console.log(`BrowseBack: Capture ${captureId} queued for AI processing`);

  // Add new capture to semantic index
  if (isIndexBuilt) {
    try {
      const capture = await storageManager.getById(captureId);
      if (capture) {
        semanticSearch.addToIndex(capture);
        console.log(`BrowseBack: Added capture ${captureId} to semantic index`);
      }
    } catch (error) {
      console.error('BrowseBack: Error adding to semantic index:', error);
    }
  }
}

/**
 * Schedule cleanup of old captures
 */
function scheduleCleanup(retentionDays) {
  // Run cleanup daily at 3 AM
  const now = new Date();
  const nextCleanup = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    3, 0, 0, 0
  );

  const msUntilCleanup = nextCleanup.getTime() - now.getTime();

  setTimeout(() => {
    performCleanup(retentionDays);
    // Schedule next cleanup (24 hours)
    setInterval(() => performCleanup(retentionDays), 24 * 60 * 60 * 1000);
  }, msUntilCleanup);

  console.log(`BrowseBack: Cleanup scheduled for ${nextCleanup.toLocaleString()}`);
}

/**
 * Perform cleanup of old captures
 */
async function performCleanup(retentionDays) {
  try {
    const deletedCount = await storageManager.deleteOlderThan(retentionDays);
    console.log(`BrowseBack: Cleanup completed, deleted ${deletedCount} old captures`);
  } catch (error) {
    console.error('BrowseBack: Error during cleanup:', error);
  }
}

/**
 * Handle messages from popup/content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'search') {
    const useSemanticSearch = request.semantic || false;

    if (useSemanticSearch && isIndexBuilt) {
      // Use semantic search with AI
      storageManager.getAll().then(allCaptures => {
        return semanticSearch.search(request.query, allCaptures);
      }).then(results => {
        sendResponse({ results, semantic: true });
      }).catch(error => {
        console.error('Semantic search failed, falling back to keyword search:', error);
        return storageManager.search(request.query);
      }).then(results => {
        if (results) sendResponse({ results, semantic: false });
      }).catch(error => {
        sendResponse({ error: error.message });
      });
    } else {
      // Use keyword search
      storageManager.search(request.query).then(results => {
        sendResponse({ results, semantic: false });
      }).catch(error => {
        sendResponse({ error: error.message });
      });
    }
    return true; // Keep message channel open
  }

  if (request.action === 'getStats') {
    storageManager.getStats().then(stats => {
      sendResponse({ stats });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }

  if (request.action === 'deleteAll') {
    storageManager.deleteAll().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }

  if (request.action === 'startTabCapture') {
    // Handle tab audio capture for transcription
    // Note: chrome.tabCapture.capture() must be called from a user gesture
    // The actual stream will be obtained in the popup using the getDisplayMedia approach
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'captureNow') {
    captureCurrentTab().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }

  if (request.action === 'getCapture') {
    storageManager.getById(request.id).then(capture => {
      sendResponse({ capture });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }
});

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('BrowseBack: First time installation');

    // Set default settings
    await chrome.storage.sync.set({
      captureInterval: CAPTURE_INTERVAL_MS,
      retentionDays: RETENTION_DAYS,
      enabled: true
    });

    // Open welcome page
    chrome.tabs.create({ url: 'popup/popup.html' });
  }
});

/**
 * Handle tab updates
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Capture when page finishes loading
  if (changeInfo.status === 'complete' && tab.active) {
    setTimeout(() => captureCurrentTab(), 2000); // Wait 2s for page to settle
  }
});

/**
 * Handle tab activation
 */
chrome.tabs.onActivated.addListener(() => {
  // Capture when switching tabs
  setTimeout(() => captureCurrentTab(), 1000);
});

// Initialize on startup
initialize();
