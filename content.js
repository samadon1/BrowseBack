/**
 * Content Script for BrowseBack
 * Extracts visible text content from web pages
 */

/**
 * Extract all visible text from the page
 */
function extractVisibleText() {
  // Get all text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script and style elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (tagName === 'script' || tagName === 'style') {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip hidden elements
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip empty text
        if (!node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textContent = [];
  let node;

  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text) {
      textContent.push(text);
    }
  }

  return textContent.join(' ');
}

/**
 * Extract important metadata from the page
 */
function extractMetadata() {
  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    keywords: document.querySelector('meta[name="keywords"]')?.content || '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.content || ''
  };
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractText') {
    try {
      const text = extractVisibleText();
      const metadata = extractMetadata();

      sendResponse({
        text: text,
        metadata: metadata
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      sendResponse({ text: '', metadata: {} });
    }
  }

  return true;
});

// Notify background that content script is ready
chrome.runtime.sendMessage({ action: 'contentScriptReady' });
