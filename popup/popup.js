/**
 * Popup UI Controller for BrowseBack
 */

// Splash Screen Elements
let splashScreen;
let mainApp;
let splashCheckAPI;
let splashAPIText;
let splashModelStatus;
let splashCheckModel;
let splashModelText;
let splashDownloadStatus;
let splashDownloadText;
let splashProgress;
let splashProgressText;
let splashActions;
let splashContinue;
let splashSetup;

// DOM Elements
let searchInput;
let searchBtn;
let askAiBtn;
let aiModeChip;
let semanticModeChip;
let resultsContainer;
let loadingState;
let aiLoadingState;
let emptyState;
let noResultsState;
let aiAnswerContainer;
let aiAnswerText;
let aiSourcesList;
let closeAiAnswer;
let captureCountEl;
let storageUsedEl;
let captureNowBtn;
let settingsBtn;
let settingsPanel;
let closeSettingsBtn;
let deleteAllBtn;

// State
let currentResults = [];
let aiSession = null;
let semanticSearchEnabled = false;

/**
 * Initialize the popup
 */
async function init() {
  // First, show splash screen and initialize AI
  await initializeSplash();

  // Then initialize main app
  initializeMainApp();
}

/**
 * Initialize splash screen and check AI status
 */
async function initializeSplash() {
  // Get splash elements
  splashScreen = document.getElementById('aiSplashScreen');
  mainApp = document.getElementById('mainApp');
  splashCheckAPI = document.getElementById('splashCheckAPI');
  splashAPIText = document.getElementById('splashAPIText');
  splashModelStatus = document.getElementById('splashModelStatus');
  splashCheckModel = document.getElementById('splashCheckModel');
  splashModelText = document.getElementById('splashModelText');
  splashDownloadStatus = document.getElementById('splashDownloadStatus');
  splashDownloadText = document.getElementById('splashDownloadText');
  splashProgress = document.getElementById('splashProgress');
  splashProgressText = document.getElementById('splashProgressText');
  splashActions = document.getElementById('splashActions');
  splashContinue = document.getElementById('splashContinue');
  splashSetup = document.getElementById('splashSetup');

  // Add event listeners
  splashContinue.addEventListener('click', () => {
    splashScreen.style.display = 'none';
    mainApp.style.display = 'flex';
  });

  splashSetup.addEventListener('click', () => {
    window.open('https://developer.chrome.com/docs/ai/built-in', '_blank');
  });

  // Check AI availability
  await checkAIAvailability();
}

/**
 * Check AI availability and show progress
 */
async function checkAIAvailability() {
  try {
    // Step 1: Check if API exists
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay for UX

    if (typeof window.LanguageModel === 'undefined') {
      splashCheckAPI.innerHTML = '<span class="error-icon">✕</span>';
      splashAPIText.textContent = 'API not available - Enable chrome://flags';
      splashActions.style.display = 'flex';
      return;
    }

    splashCheckAPI.innerHTML = '<span class="check-icon">✓</span>';
    splashAPIText.textContent = 'API available';

    // Step 2: Check model status
    splashModelStatus.style.display = 'flex';
    await new Promise(resolve => setTimeout(resolve, 300));

    const availability = await window.LanguageModel.availability({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    if (availability === 'unavailable') {
      splashCheckModel.innerHTML = '<span class="error-icon">✕</span>';
      splashModelText.textContent = 'Model unavailable on this device';
      splashActions.style.display = 'flex';
      setTimeout(() => {
        splashScreen.style.display = 'none';
        mainApp.style.display = 'flex';
      }, 2000);
      return;
    }

    if (availability === 'available') {
      splashCheckModel.innerHTML = '<span class="check-icon">✓</span>';
      splashModelText.textContent = 'Model ready!';

      // Hide splash and show main app
      setTimeout(() => {
        splashScreen.style.display = 'none';
        mainApp.style.display = 'flex';
      }, 1000);
      return;
    }

    if (availability === 'downloadable' || availability === 'downloading') {
      splashCheckModel.innerHTML = '<span class="check-icon">✓</span>';
      splashModelText.textContent = 'Model found';

      // Step 3: Download model
      splashDownloadStatus.style.display = 'flex';
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        const session = await window.LanguageModel.create({
          expectedInputs: [{ type: 'text', languages: ['en'] }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }],
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              const percent = Math.round(e.loaded * 100);
              splashProgress.style.width = `${percent}%`;
              splashProgressText.textContent = `${percent}%`;
              splashDownloadText.textContent = `Downloading AI model... (${percent}%)`;
            });
          }
        });

        aiSession = session;
        splashDownloadText.textContent = 'Download complete!';
        splashProgress.style.width = '100%';
        splashProgressText.textContent = '100%';

        setTimeout(() => {
          splashScreen.style.display = 'none';
          mainApp.style.display = 'flex';
        }, 1000);

      } catch (error) {
        console.error('Download failed:', error);
        splashDownloadText.textContent = 'Download failed - continuing without AI';
        splashActions.style.display = 'flex';
      }
    }

  } catch (error) {
    console.error('AI check failed:', error);
    splashCheckAPI.innerHTML = '<span class="error-icon">✕</span>';
    splashAPIText.textContent = 'Error checking AI: ' + error.message;
    splashActions.style.display = 'flex';
  }
}

/**
 * Initialize main app
 */
async function initializeMainApp() {
  // Get DOM elements
  searchInput = document.getElementById('searchInput');
  searchBtn = document.getElementById('searchBtn');
  askAiBtn = document.getElementById('askAiBtn');
  aiModeChip = document.getElementById('aiModeChip');
  semanticModeChip = document.getElementById('semanticModeChip');
  resultsContainer = document.getElementById('resultsContainer');
  loadingState = document.getElementById('loadingState');
  aiLoadingState = document.getElementById('aiLoadingState');
  emptyState = document.getElementById('emptyState');
  noResultsState = document.getElementById('noResultsState');
  aiAnswerContainer = document.getElementById('aiAnswerContainer');
  aiAnswerText = document.getElementById('aiAnswerText');
  aiSourcesList = document.getElementById('aiSourcesList');
  closeAiAnswer = document.getElementById('closeAiAnswer');
  captureCountEl = document.getElementById('captureCount');
  storageUsedEl = document.getElementById('storageUsed');
  captureNowBtn = document.getElementById('captureNowBtn');
  settingsBtn = document.getElementById('settingsBtn');
  settingsPanel = document.getElementById('settingsPanel');
  closeSettingsBtn = document.getElementById('closeSettingsBtn');
  deleteAllBtn = document.getElementById('deleteAllBtn');

  // Set up event listeners
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  searchBtn.addEventListener('click', handleSearch);

  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      searchInput.value = query;
      handleSearch();
    });
  });

  // AI buttons
  askAiBtn.addEventListener('click', handleAskAI);
  aiModeChip.addEventListener('click', handleAskAI);
  closeAiAnswer.addEventListener('click', () => {
    aiAnswerContainer.style.display = 'none';
    resultsContainer.style.display = 'grid';
  });

  // Semantic search toggle
  semanticModeChip.addEventListener('click', () => {
    semanticSearchEnabled = !semanticSearchEnabled;
    if (semanticSearchEnabled) {
      semanticModeChip.classList.add('active');
      console.log('✅ Semantic search enabled - using TF-IDF embeddings + AI query expansion');
    } else {
      semanticModeChip.classList.remove('active');
      console.log('ℹ️ Switched to keyword search');
    }
    // Re-run search if there's a query
    if (searchInput.value.trim()) {
      handleSearch();
    }
  });

  // Action buttons
  captureNowBtn.addEventListener('click', handleCaptureNow);
  settingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'block';
    loadSettings();
  });
  closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
  });
  deleteAllBtn.addEventListener('click', handleDeleteAll);

  // Load initial data
  await loadStats();
  await loadRecentCaptures();
  await initializeAI();
}

/**
 * Handle search input
 */
async function handleSearch() {
  const query = searchInput.value.trim();

  // Check if this is a natural language question
  if (isNaturalLanguageQuestion(query)) {
    console.log('🤖 Detected natural language question, using AI answer mode');
    await handleAskAI();
    return;
  }

  // Show loading state
  showState('loading');

  try {
    // Send search request to background with semantic flag
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: query,
      semantic: semanticSearchEnabled
    });

    if (response.error) {
      console.error('Search error:', response.error);
      showState('empty');
      return;
    }

    currentResults = response.results || [];

    // Show indicator if semantic search was used
    if (response.semantic) {
      console.log('🧠 Semantic search results with AI query expansion');
    }

    if (currentResults.length === 0) {
      showState('noResults');
    } else {
      displayResults(currentResults, response.semantic);
    }
  } catch (error) {
    console.error('Search failed:', error);
    showState('empty');
  }
}

/**
 * Detect if query is a natural language question
 */
function isNaturalLanguageQuestion(query) {
  const lowerQuery = query.toLowerCase();

  // Question words
  const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'was', 'were', 'did', 'do', 'does', 'is', 'are', 'can', 'could', 'would', 'should'];

  // Check if starts with question word
  const startsWithQuestion = questionWords.some(word =>
    lowerQuery.startsWith(word + ' ') || lowerQuery.startsWith(word + "'")
  );

  // Check if ends with question mark
  const hasQuestionMark = lowerQuery.endsWith('?');

  // Check for common question patterns
  const hasQuestionPattern = /^(tell me|show me|find me|help me|explain|describe|summarize)/i.test(lowerQuery);

  // Check if query is longer than 4 words (likely conversational)
  const wordCount = query.split(/\s+/).length;
  const isLongQuery = wordCount > 4;

  return startsWithQuestion || hasQuestionMark || hasQuestionPattern || (isLongQuery && questionWords.some(w => lowerQuery.includes(' ' + w + ' ')));
}

/**
 * Load recent captures (default view)
 */
async function loadRecentCaptures() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: ''
    });

    if (response.results && response.results.length > 0) {
      currentResults = response.results;
      displayResults(currentResults);
    } else {
      showState('empty');
    }
  } catch (error) {
    console.error('Failed to load recent captures:', error);
    showState('empty');
  }
}

/**
 * Display search results
 */
function displayResults(results, isSemanticSearch = false) {
  resultsContainer.innerHTML = '';
  resultsContainer.style.display = 'grid';
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  noResultsState.style.display = 'none';

  // Add semantic search indicator if used
  if (isSemanticSearch && results.length > 0) {
    const indicator = document.createElement('div');
    indicator.className = 'semantic-indicator';
    indicator.innerHTML = '🧠 <strong>Semantic Search Results</strong> - Using AI-powered query expansion and TF-IDF embeddings';
    resultsContainer.appendChild(indicator);
  }

  results.forEach(result => {
    const card = createResultCard(result);
    resultsContainer.appendChild(card);
  });
}

/**
 * Create a result card element
 */
function createResultCard(result) {
  const card = document.createElement('div');
  card.className = 'result-card';

  // Add relevance indicator if search score exists
  if (result.searchScore > 0) {
    card.setAttribute('data-score', Math.round(result.searchScore));
  }

  const thumbnail = document.createElement('img');
  thumbnail.className = 'result-thumbnail';
  thumbnail.src = result.screenshot || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
  thumbnail.alt = result.title;

  const content = document.createElement('div');
  content.className = 'result-content';

  const title = document.createElement('div');
  title.className = 'result-title';

  // Highlight search query in title if searching
  const query = searchInput.value.trim();
  if (query && result.searchScore > 0) {
    title.innerHTML = highlightText(result.title || 'Untitled Page', query);
  } else {
    title.textContent = result.title || 'Untitled Page';
  }

  const url = document.createElement('div');
  url.className = 'result-url';
  url.textContent = truncateUrl(result.url);

  const timestamp = document.createElement('div');
  timestamp.className = 'result-timestamp';
  timestamp.innerHTML = `<span>🕐</span> ${formatTimestamp(result.timestamp)}`;

  content.appendChild(title);
  content.appendChild(url);
  content.appendChild(timestamp);

  // Add text snippet with highlighting if available
  if (result.extractedText || result.domText) {
    const snippet = document.createElement('div');
    snippet.className = 'result-snippet';

    const text = result.extractedText || result.domText;

    if (query && result.searchScore > 0) {
      // Extract relevant snippet around search term
      const relevantSnippet = extractRelevantSnippet(text, query, 100);
      snippet.innerHTML = highlightText(relevantSnippet, query);
    } else {
      snippet.textContent = truncateText(text, 100);
    }

    content.appendChild(snippet);
  }

  // Show relevance score badge for debugging (optional - remove for production)
  if (result.searchScore > 0 && result.searchScore > 10) {
    const scoreBadge = document.createElement('div');
    scoreBadge.className = 'score-badge';
    scoreBadge.textContent = `${Math.round(result.searchScore)}% match`;
    content.appendChild(scoreBadge);
  }

  card.appendChild(thumbnail);
  card.appendChild(content);

  // Click handler - open URL
  card.addEventListener('click', () => {
    chrome.tabs.create({ url: result.url });
  });

  return card;
}

/**
 * Highlight search terms in text
 */
function highlightText(text, query) {
  if (!query || !text) return text;

  const terms = query.toLowerCase().trim().split(/\s+/);
  let highlighted = text;

  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
}

/**
 * Extract relevant snippet around search term
 */
function extractRelevantSnippet(text, query, maxLength) {
  const terms = query.toLowerCase().trim().split(/\s+/);
  const lowerText = text.toLowerCase();

  // Find first occurrence of any search term
  let firstIndex = -1;
  for (const term of terms) {
    const index = lowerText.indexOf(term);
    if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
      firstIndex = index;
    }
  }

  if (firstIndex === -1) {
    return truncateText(text, maxLength);
  }

  // Extract snippet centered around the match
  const start = Math.max(0, firstIndex - 40);
  const end = Math.min(text.length, firstIndex + maxLength - 40);

  let snippet = text.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(date) {
  const now = new Date();
  const secondsAgo = Math.floor((now - date) / 1000);

  if (secondsAgo < 60) return 'just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)} days ago`;

  return date.toLocaleDateString();
}

/**
 * Show specific state
 */
function showState(state) {
  resultsContainer.style.display = 'none';
  loadingState.style.display = 'none';
  aiLoadingState.style.display = 'none';
  emptyState.style.display = 'none';
  noResultsState.style.display = 'none';
  aiAnswerContainer.style.display = 'none';

  switch (state) {
    case 'loading':
      loadingState.style.display = 'flex';
      break;
    case 'aiLoading':
      aiLoadingState.style.display = 'flex';
      break;
    case 'empty':
      emptyState.style.display = 'flex';
      break;
    case 'noResults':
      noResultsState.style.display = 'flex';
      break;
  }
}

/**
 * Load and display statistics
 */
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });

    if (response.stats) {
      const stats = response.stats;
      captureCountEl.textContent = stats.captureCount || 0;

      if (typeof stats.storageUsed === 'number') {
        const mb = (stats.storageUsed / (1024 * 1024)).toFixed(1);
        storageUsedEl.textContent = `${mb} MB`;
      } else {
        storageUsedEl.textContent = '0 MB';
      }
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

/**
 * Handle capture now button
 */
async function handleCaptureNow() {
  captureNowBtn.disabled = true;
  captureNowBtn.textContent = 'Capturing...';

  try {
    await chrome.runtime.sendMessage({ action: 'captureNow' });

    // Update stats after capture
    setTimeout(async () => {
      await loadStats();
      await loadRecentCaptures();
      captureNowBtn.disabled = false;
      captureNowBtn.innerHTML = '<span>📸</span> Capture Now';
    }, 1000);
  } catch (error) {
    console.error('Capture failed:', error);
    captureNowBtn.disabled = false;
    captureNowBtn.innerHTML = '<span>📸</span> Capture Now';
  }
}

/**
 * Load settings
 */
async function loadSettings() {
  chrome.storage.sync.get(['captureInterval', 'retentionDays'], (result) => {
    const intervalSelect = document.getElementById('captureInterval');
    const retentionSelect = document.getElementById('retentionDays');

    if (result.captureInterval) {
      intervalSelect.value = result.captureInterval;
    }
    if (result.retentionDays) {
      retentionSelect.value = result.retentionDays;
    }

    // Add change listeners
    intervalSelect.addEventListener('change', () => {
      chrome.storage.sync.set({ captureInterval: parseInt(intervalSelect.value) });
    });

    retentionSelect.addEventListener('change', () => {
      chrome.storage.sync.set({ retentionDays: parseInt(retentionSelect.value) });
    });
  });
}

/**
 * Handle delete all
 */
async function handleDeleteAll() {
  const confirmed = confirm(
    'Are you sure you want to delete ALL captured data?\n\nThis action cannot be undone!'
  );

  if (!confirmed) return;

  deleteAllBtn.disabled = true;
  deleteAllBtn.textContent = 'Deleting...';

  try {
    await chrome.runtime.sendMessage({ action: 'deleteAll' });

    // Reset UI
    await loadStats();
    showState('empty');
    settingsPanel.style.display = 'none';

    deleteAllBtn.disabled = false;
    deleteAllBtn.innerHTML = '<span>🗑️</span> Delete All Captures';
  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete data. Please try again.');
    deleteAllBtn.disabled = false;
    deleteAllBtn.innerHTML = '<span>🗑️</span> Delete All Captures';
  }
}

/**
 * Utility: Format timestamp
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Utility: Truncate URL
 */
function truncateUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname;

    if (path.length > 30) {
      return `${domain}${path.substring(0, 30)}...`;
    }

    return `${domain}${path}`;
  } catch {
    return url.substring(0, 50);
  }
}

/**
 * Utility: Truncate text
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Initialize AI with proper availability checking (CORRECTED - uses LanguageModel per official docs)
 */
async function initializeAI() {
  try {
    // Check if API exists (LanguageModel is the official global API)
    if (typeof window.LanguageModel === 'undefined') {
      showAISetupGuide('api_not_available');
      return;
    }

    console.log('✅ LanguageModel API found');

    // Check availability status with language specification
    const availability = await window.LanguageModel.availability({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });
    console.log('🔍 Prompt API availability:', availability);

    // Handle different availability states per official docs
    if (availability === 'unavailable') {
      showAISetupGuide('not_available');
      return;
    }

    if (availability === 'downloadable') {
      console.log('📥 AI model can be downloaded. Starting download automatically...');

      // Automatically start download in background
      try {
        await startAIModelDownload();
      } catch (error) {
        console.error('Failed to start download:', error);
        showAISetupGuide('needs_download');
      }
      return;
    }

    if (availability === 'downloading') {
      console.log('⏬ AI model is currently downloading...');
      showAISetupGuide('needs_download');
      return;
    }

    if (availability === 'available') {
      console.log('✅ BrowseBack: Prompt API ready! AI answers enabled.');
      askAiBtn.disabled = false;
      aiModeChip.disabled = false;
      return;
    }

    // Unknown state
    console.warn('⚠️ Unknown availability state:', availability);
    showAISetupGuide('unknown');

  } catch (error) {
    console.error('❌ Error checking AI availability:', error);
    showAISetupGuide('error', error.message);
  }
}

/**
 * Start AI model download automatically (CORRECTED - uses LanguageModel)
 */
async function startAIModelDownload() {
  console.log('⏬ Initiating AI model download...');
  console.log('📊 Monitor progress at: chrome://components');
  console.log('🔍 Look for: "Optimization Guide On Device Model"');

  try {
    // Create a session to trigger download (per official docs)
    const session = await window.LanguageModel.create({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const percent = Math.round(e.loaded * 100);
          console.log(`📥 Downloading AI model: ${percent}% complete`);

          // Update UI to show progress
          if (askAiBtn) {
            askAiBtn.textContent = `⏬ ${percent}%`;
            askAiBtn.title = `Downloading AI model: ${percent}%`;
          }
        });
      }
    });

    console.log('✅ AI model download complete!');
    console.log('💡 AI answers now available');

    // Store the session for later use
    aiSession = session;

    // Enable AI features
    askAiBtn.disabled = false;
    aiModeChip.disabled = false;
    askAiBtn.textContent = '🤖';
    askAiBtn.title = 'Ask AI - Ready!';

  } catch (error) {
    console.error('❌ Failed to start AI model download:', error);

    // Show user-friendly error
    if (error.message.includes('not available')) {
      console.log('💡 Possible solutions:');
      console.log('   1. Check chrome://flags/#prompt-api-for-gemini-nano is Enabled');
      console.log('   2. Restart Chrome completely');
      console.log('   3. Check chrome://components for model status');
    }

    throw error;
  }
}

/**
 * Show AI setup guide based on availability status
 */
function showAISetupGuide(status, errorMsg = '') {
  askAiBtn.disabled = true;
  aiModeChip.disabled = true;

  const messages = {
    'api_not_available': {
      console: '📋 Setup needed: Enable chrome://flags/#prompt-api-for-gemini-nano',
      title: 'Enable Chrome flag first',
      steps: [
        '1. Open: chrome://flags/#prompt-api-for-gemini-nano',
        '2. Set to "Enabled"',
        '3. Click "Relaunch" button',
        '4. Reload this extension',
        '',
        '📚 More info: chrome://components (check "Optimization Guide On Device Model")'
      ]
    },
    'not_available': {
      console: '❌ Prompt API not available on this device',
      title: 'AI not available',
      steps: [
        'Requirements:',
        '✓ Chrome 127+ (Dev/Canary channel)',
        '✓ 22GB+ free disk space',
        '✓ 4GB+ GPU VRAM or 16GB RAM',
        '✓ Windows/Mac/Linux (desktop only)',
        '',
        '💡 Keyword search still works perfectly!'
      ]
    },
    'needs_download': {
      console: '📥 AI model needs to be downloaded first (~1.7GB)',
      title: 'Click to download AI model',
      steps: [
        '1. Click the 🤖 Ask AI button above',
        '2. Model will start downloading (~1.7GB)',
        '3. Takes 5-10 minutes on fast connection',
        '4. Watch chrome://components for progress',
        '',
        '💡 Download happens once, then AI works offline!'
      ]
    },
    'unknown': {
      console: '⚠️ Unknown AI status - check Chrome version',
      title: 'Unknown status',
      steps: [
        'Try these steps:',
        '1. Update to Chrome Dev (130+) or Canary',
        '2. Enable: chrome://flags/#prompt-api-for-gemini-nano',
        '3. Restart Chrome completely',
        '4. Check: chrome://components',
        '',
        '📚 Guide: https://developer.chrome.com/docs/ai/built-in'
      ]
    },
    'error': {
      console: `❌ Error: ${errorMsg}`,
      title: 'Error checking AI',
      steps: [
        'Error occurred:',
        errorMsg,
        '',
        '💡 Keyword search still works perfectly!'
      ]
    }
  };

  const msg = messages[status] || messages['unknown'];

  console.log('\n' + '='.repeat(60));
  console.log('🤖 BROWSEBACK AI SETUP GUIDE');
  console.log('='.repeat(60));
  console.log(msg.console);
  console.log('');
  msg.steps.forEach(step => console.log(step));
  console.log('='.repeat(60) + '\n');

  askAiBtn.title = msg.title;
  aiModeChip.title = msg.title;
}

/**
 * Handle Ask AI button click
 */
async function handleAskAI() {
  const query = searchInput.value.trim();

  if (!query) {
    alert('Please enter a question or search term first!');
    return;
  }

  // Hide other states, show AI loading
  showState('aiLoading');

  try {
    // First, do a regular search to get relevant captures
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: query
    });

    if (!response.results || response.results.length === 0) {
      showState('noResults');
      return;
    }

    // Use top 5 results for context
    const topResults = response.results.slice(0, 5);

    // Generate AI answer
    const answer = await generateAIAnswer(query, topResults);

    // Display the answer
    displayAIAnswer(answer, topResults);

  } catch (error) {
    console.error('AI answer failed:', error);
    showState('noResults');
    alert('Failed to generate AI answer. The Prompt API may not be fully available yet.');
  }
}

/**
 * Generate AI answer using Prompt API
 */
async function generateAIAnswer(query, results) {
  try {
    // Check if API exists (CORRECTED - uses LanguageModel)
    if (typeof window.LanguageModel === 'undefined') {
      throw new Error('Prompt API not available');
    }

    // Create AI session if not exists
    if (!aiSession) {
      aiSession = await window.LanguageModel.create({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        systemPrompt: `You are a helpful, conversational assistant that answers questions about the user's browsing history.

Guidelines:
- Use natural, conversational language (e.g., "You were searching for...", "You visited...", "Based on your browsing...")
- Be specific and reference actual page titles and URLs
- Keep answers concise (2-4 sentences)
- If multiple relevant pages exist, mention the most important ones
- If the browsing history doesn't clearly answer the question, say so honestly
- Use past tense when describing browsing activity (e.g., "You were looking at...", "You visited...")
- Be friendly and helpful`
      });
    }

    // Build context from search results with timestamps
    const context = results.map((r, i) => {
      const text = (r.extractedText || r.domText || '').substring(0, 500);
      const date = new Date(r.timestamp);
      const timeAgo = formatTimeAgo(date);
      return `[${i + 1}] "${r.title}" (${timeAgo})
URL: ${r.url}
Content: ${text}`;
    }).join('\n\n');

    // Generate conversational answer
    const prompt = `Based on the user's browsing history below, answer their question in a natural, conversational way.

BROWSING HISTORY:
${context}

USER'S QUESTION: ${query}

YOUR ANSWER (be conversational and specific):`;

    const answer = await aiSession.prompt(prompt);

    return answer;

  } catch (error) {
    console.error('Error generating AI answer:', error);
    throw error;
  }
}

/**
 * Display AI answer
 */
function displayAIAnswer(answer, sources) {
  // Hide loading and results
  loadingState.style.display = 'none';
  aiLoadingState.style.display = 'none';
  resultsContainer.style.display = 'none';
  emptyState.style.display = 'none';
  noResultsState.style.display = 'none';

  // Show AI answer container
  aiAnswerContainer.style.display = 'block';

  // Set answer text
  aiAnswerText.textContent = answer;

  // Display sources
  aiSourcesList.innerHTML = '';
  sources.forEach(source => {
    const sourceItem = document.createElement('div');
    sourceItem.className = 'ai-source-item';

    const sourceTitle = document.createElement('div');
    sourceTitle.className = 'ai-source-title';
    sourceTitle.textContent = source.title || 'Untitled Page';

    const sourceUrl = document.createElement('div');
    sourceUrl.className = 'ai-source-url';
    sourceUrl.textContent = truncateUrl(source.url);

    sourceItem.appendChild(sourceTitle);
    sourceItem.appendChild(sourceUrl);

    // Click to open source
    sourceItem.addEventListener('click', () => {
      chrome.tabs.create({ url: source.url });
    });

    aiSourcesList.appendChild(sourceItem);
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
