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
let clearSearchBtn;
let askAiBtn;
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
let recordMeetingBtn;
let analyticsBtn;
let analyticsPanel;
let closeAnalyticsBtn;
let settingsBtn;
let settingsPanel;
let closeSettingsBtn;
let deleteAllBtn;

// Mode switcher elements
let browseMode;
let searchMode;
let askMode;
let searchModeToggles;

// Chat elements
let aiChatContainer;
let chatMessages;
let chatInputField;
let chatSendBtn;
let chatBackBtn;

// State
let currentResults = [];
let allResults = []; // Store all results for pagination
let displayedResultsCount = 0;
const RESULTS_PER_PAGE = 50;
let aiSession = null;
let semanticSearchEnabled = false;
let currentMode = 'browse'; // browse, search, ask
let chatHistory = []; // Store chat conversation
let chatContext = null; // Store context results for follow-ups
let isGeneratingResponse = false; // Prevent duplicate AI calls

// Audio transcription state
let isTranscribing = false;
let audioStream = null;
let mediaRecorder = null;
let audioChunks = [];
let transcriptionStartTime = null;
let transcriptionTabTitle = null;
let transcriptionSession = null;
let currentTranscript = '';

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
  clearSearchBtn = document.getElementById('clearSearchBtn');
  askAiBtn = document.getElementById('askAiBtn');
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
  recordMeetingBtn = document.getElementById('recordMeetingBtn');
  analyticsBtn = document.getElementById('analyticsBtn');
  analyticsPanel = document.getElementById('analyticsPanel');
  closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');
  settingsBtn = document.getElementById('settingsBtn');
  settingsPanel = document.getElementById('settingsPanel');
  closeSettingsBtn = document.getElementById('closeSettingsBtn');
  deleteAllBtn = document.getElementById('deleteAllBtn');

  // Mode switcher elements
  browseMode = document.getElementById('browseMode');
  searchMode = document.getElementById('searchMode');
  askMode = document.getElementById('askMode');
  searchModeToggles = document.getElementById('searchModeToggles');

  // Chat elements
  aiChatContainer = document.getElementById('aiChatContainer');
  chatMessages = document.getElementById('chatMessages');
  chatInputField = document.getElementById('chatInputField');
  chatSendBtn = document.getElementById('chatSendBtn');
  chatBackBtn = document.getElementById('chatBackBtn');

  // Set up event listeners
  searchInput.addEventListener('input', () => {
    // Show/hide clear button based on input
    if (searchInput.value.trim()) {
      clearSearchBtn.style.display = 'flex';
    } else {
      clearSearchBtn.style.display = 'none';
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  searchBtn.addEventListener('click', handleSearch);

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';

    // Reload the current mode's default view
    if (currentMode === 'browse') {
      loadBrowseMode();
    } else if (currentMode === 'search') {
      loadSearchMode();
    } else if (currentMode === 'ask') {
      showState('empty');
    }
  });

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
  closeAiAnswer.addEventListener('click', () => {
    aiAnswerContainer.style.display = 'none';
    resultsContainer.style.display = 'flex';
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

  recordMeetingBtn.addEventListener('click', toggleTranscription);

  analyticsBtn.addEventListener('click', () => {
    analyticsPanel.style.display = 'block';
    loadAnalytics();
  });
  closeAnalyticsBtn.addEventListener('click', () => {
    analyticsPanel.style.display = 'none';
  });

  // Analytics view toggle
  document.querySelectorAll('.analytics-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;

      // Update active state
      document.querySelectorAll('.analytics-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Reload analytics with new view
      loadAnalytics(view);
    });
  });

  settingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'block';
    loadSettings();
  });
  closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
  });
  deleteAllBtn.addEventListener('click', handleDeleteAll);

  // Transcription page event listeners
  const transcriptionBackBtn = document.getElementById('transcriptionBackBtn');
  const stopTranscriptionBtn = document.getElementById('stopTranscriptionBtn');

  transcriptionBackBtn.addEventListener('click', () => {
    if (isTranscribing) {
      if (confirm('Stop transcription and go back?')) {
        stopTranscription();
        hideTranscriptionPage();
        resetTranscriptionState();
      }
    } else {
      hideTranscriptionPage();
      resetTranscriptionState();
    }
  });

  stopTranscriptionBtn.addEventListener('click', () => {
    stopTranscription();
  });

  // Action pill event listeners
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('action-pill')) {
      const action = e.target.dataset.action;

      switch (action) {
        case 'notes':
          await handleActionPill('Create structured notes from this transcript', 'notes');
          break;

        case 'flashcards':
          await handleActionPill('Create study flashcards from this transcript', 'flashcards');
          break;

        case 'summary':
          await handleActionPill('Provide a more detailed summary of this transcript', 'summary');
          break;
      }
    }

    // Tab switcher
    if (e.target.classList.contains('tab-btn')) {
      const tab = e.target.dataset.tab;
      const transcriptTabContent = document.getElementById('transcriptTabContent');
      const summaryTabContent = document.getElementById('summaryTabContent');
      const tabBtns = document.querySelectorAll('.tab-btn');

      // Update active tab
      tabBtns.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      // Toggle visibility
      if (tab === 'transcript') {
        transcriptTabContent.style.display = 'block';
        summaryTabContent.style.display = 'none';
      } else if (tab === 'summary') {
        transcriptTabContent.style.display = 'none';
        summaryTabContent.style.display = 'block';
      }
    }
  });

  // Query input event listeners
  const transcriptQueryBtn = document.getElementById('transcriptQueryBtn');
  const transcriptQuery = document.getElementById('transcriptQuery');

  if (transcriptQueryBtn) {
    transcriptQueryBtn.addEventListener('click', handleTranscriptQuery);
  }

  if (transcriptQuery) {
    transcriptQuery.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTranscriptQuery();
      }
    });
  }

  // Save transcript modal event listeners
  const saveTranscriptModal = document.getElementById('saveTranscriptModal');
  const closeSaveModal = document.getElementById('closeSaveModal');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  const saveTranscriptHeaderBtn = document.getElementById('saveTranscriptHeaderBtn');
  const transcriptName = document.getElementById('transcriptName');
  const tagPills = document.querySelectorAll('.tag-pill');

  if (closeSaveModal) {
    closeSaveModal.addEventListener('click', closeSaveTranscriptModal);
  }

  if (cancelSaveBtn) {
    cancelSaveBtn.addEventListener('click', closeSaveTranscriptModal);
  }

  if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', saveTranscriptWithMetadata);
  }

  if (saveTranscriptHeaderBtn) {
    saveTranscriptHeaderBtn.addEventListener('click', openSaveTranscriptModal);
  }

  // Tag pill selection
  tagPills.forEach(pill => {
    pill.addEventListener('click', () => {
      tagPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // Mode switcher event listeners
  browseMode.addEventListener('click', () => {
    // Exit chat if open
    if (aiChatContainer.style.display === 'flex') {
      exitChatMode();
    }
    switchMode('browse');
  });
  searchMode.addEventListener('click', () => {
    // Exit chat if open
    if (aiChatContainer.style.display === 'flex') {
      exitChatMode();
    }
    switchMode('search');
  });
  askMode.addEventListener('click', () => switchMode('ask'));

  // Chat event listeners
  chatBackBtn.addEventListener('click', exitChatMode);
  chatSendBtn.addEventListener('click', handleChatSendFromInput);
  chatInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSendFromInput();
    }
  });

  // Load initial data
  await loadStats();
  await loadRecentCaptures();
  await initializeAI();

  // Initialize Proofreader API in background (non-blocking)
  initializeProofreader().catch(err => {
    console.log('Proofreader initialization skipped:', err);
  });
}

/**
 * Switch between Browse, Search, and Ask modes
 */
function switchMode(mode) {
  currentMode = mode;

  // Update active state
  browseMode.classList.toggle('active', mode === 'browse');
  searchMode.classList.toggle('active', mode === 'search');
  askMode.classList.toggle('active', mode === 'ask');

  // Hide chat container if switching modes
  if (aiChatContainer.style.display === 'flex') {
    aiChatContainer.style.display = 'none';
    chatHistory = [];
    chatContext = null;
    chatMessages.innerHTML = '';
  }

  // Update UI based on mode
  if (mode === 'browse') {
    // Browse mode: Timeline view with dates and domain grouping
    resultsContainer.style.display = 'block'; // Timeline uses block
    searchInput.placeholder = 'Search timeline...';
    searchModeToggles.style.display = 'none';
    searchInput.value = ''; // Clear search
    loadBrowseMode();
  } else if (mode === 'search') {
    resultsContainer.style.display = 'grid'; // Grid for search
    // Search mode: Strict keyword/OCR/transcript/image search only
    searchInput.placeholder = 'Search text, keywords, OCR...';
    searchModeToggles.style.display = 'flex';
    searchInput.value = ''; // Clear search
    loadSearchMode(); // Load all items in grid view
  } else if (mode === 'ask') {
    // Ask mode: AI-powered natural language Q&A
    searchInput.placeholder = 'Ask anything about your browsing...';
    searchModeToggles.style.display = 'none';
    searchInput.value = ''; // Clear search
    // Show empty state with prompt
    showState('empty');
  }

  console.log(`🔄 Switched to ${mode} mode`);
}

/**
 * Exit chat mode and return to normal view
 */
function exitChatMode() {
  aiChatContainer.style.display = 'none';

  // Both browse and search now use grid layout
  resultsContainer.style.display = 'grid';

  // Reset search input
  searchInput.placeholder = currentMode === 'browse' ? 'Search timeline...' :
                             currentMode === 'search' ? 'Search text, keywords, OCR...' :
                             'Ask anything about your browsing...';

  // Clear chat history
  chatHistory = [];
  chatContext = null;
  chatMessages.innerHTML = '';
}

/**
 * Load Browse mode with timeline view
 */
async function loadBrowseMode() {
  showState('loading');

  try {
    // Load screenshots from background script
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: ''
    });

    let allItems = response.results || [];

    // Load transcripts from storage
    const storage = await chrome.storage.local.get(null);
    const transcripts = Object.keys(storage)
      .filter(key => key.startsWith('transcript_'))
      .map(key => ({
        ...storage[key],
        type: 'transcript',
        id: storage[key].id || key.replace('transcript_', '')
      }));

    // Combine and sort by timestamp
    allItems = [...allItems, ...transcripts].sort((a, b) => b.timestamp - a.timestamp);

    if (allItems.length > 0) {
      currentResults = allItems;
      displayTimelineView(currentResults); // Use timeline view for browse
    } else {
      showState('empty');
    }
  } catch (error) {
    console.error('Failed to load browse mode:', error);
    showState('empty');
  }
}

/**
 * Load Search mode with grid view of all items
 */
async function loadSearchMode() {
  showState('loading');

  try {
    // Load screenshots from background script
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: ''
    });

    let allItems = response.results || [];

    // Load transcripts from storage
    const storage = await chrome.storage.local.get(null);
    const transcripts = Object.keys(storage)
      .filter(key => key.startsWith('transcript_'))
      .map(key => ({
        ...storage[key],
        type: 'transcript',
        id: storage[key].id || key.replace('transcript_', '')
      }));

    // Combine and sort by timestamp
    allItems = [...allItems, ...transcripts].sort((a, b) => b.timestamp - a.timestamp);

    if (allItems.length > 0) {
      currentResults = allItems;
      displayResults(currentResults);
    } else {
      showState('empty');
    }
  } catch (error) {
    console.error('Failed to load search mode:', error);
    showState('empty');
  }
}

/**
 * Handle search input
 */
async function handleSearch() {
  const query = searchInput.value.trim();

  // If chat is open, handle as chat message
  if (aiChatContainer.style.display === 'flex' && query) {
    await handleChatSend();
    return;
  }

  // If in Ask mode, always use AI
  if (currentMode === 'ask' && query) {
    await handleAskAI();
    return;
  }

  // Search mode: strict keyword/OCR search only (no auto-detection)
  // Show loading state
  showState('loading');

  try {
    // Correct typos in search query
    const correctedQuery = await correctQuery(query);
    if (correctedQuery !== query) {
      console.log(`📝 Search query corrected: "${query}" → "${correctedQuery}"`);
    }

    // Send search request to background for screenshots
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: correctedQuery,
      semantic: semanticSearchEnabled
    });

    if (response.error) {
      console.error('Search error:', response.error);
      showState('empty');
      return;
    }

    let results = response.results || [];

    // Also search transcripts with sophisticated scoring
    if (correctedQuery) {
      const storage = await chrome.storage.local.get(null);
      const transcripts = Object.keys(storage)
        .filter(key => key.startsWith('transcript_'))
        .map(key => {
          const transcript = storage[key];
          const title = (transcript.tabTitle || '').toLowerCase();
          const text = (transcript.text || '').toLowerCase();
          const summary = (transcript.summary || '').toLowerCase();
          const normalizedQuery = correctedQuery.toLowerCase().trim();
          const searchTerms = normalizedQuery.split(/\s+/);

          let score = 0;
          let matchedTerms = 0;
          let hasExactPhrase = false;

          // PRIORITY 1: Exact phrase matches in transcripts (highest value)
          if (searchTerms.length > 1) {
            // Exact phrase in title
            if (title.includes(normalizedQuery)) {
              score += 600; // Even higher than screenshots since transcripts are rich content
              hasExactPhrase = true;
              if (title === normalizedQuery) score += 200;
            }

            // Exact phrase in transcript text (most important)
            if (text.includes(normalizedQuery)) {
              score += 400; // High boost for exact phrase in transcript
              hasExactPhrase = true;

              // Count phrase occurrences
              const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const occurrences = (text.match(new RegExp(escapedQuery, 'g')) || []).length;
              score += Math.min(occurrences * 60, 240); // Up to 240 bonus

              // Position bonus
              const firstIndex = text.indexOf(normalizedQuery);
              if (firstIndex !== -1 && firstIndex < 100) {
                score += 120;
              } else if (firstIndex !== -1 && firstIndex < 300) {
                score += 60;
              }
            }

            // Exact phrase in summary
            if (summary.includes(normalizedQuery)) {
              score += 350;
              hasExactPhrase = true;
            }
          }

          // PRIORITY 2: Individual term matching
          searchTerms.forEach(term => {
            const termWeight = hasExactPhrase ? 0.4 : 1.0;

            if (title.includes(term)) {
              score += 60 * termWeight;
              matchedTerms++;
              if (title.startsWith(term)) score += 25 * termWeight;
            }

            if (text.includes(term)) {
              const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const occurrences = (text.match(new RegExp(escapedTerm, 'g')) || []).length;
              score += Math.min(occurrences * 8, 50) * termWeight;
              matchedTerms++;
            }

            if (summary.includes(term)) {
              score += 40 * termWeight;
              matchedTerms++;
            }
          });

          // Penalty for not matching all terms
          if (!hasExactPhrase && searchTerms.length > 1 && matchedTerms < searchTerms.length) {
            score *= 0.5;
          }

          // Recency bonus
          const ageInDays = (Date.now() - (transcript.timestamp || Date.now())) / (1000 * 60 * 60 * 24);
          if (ageInDays < 1) score += 8;

          return {
            ...transcript,
            type: 'transcript',
            id: transcript.id || Date.now(),
            searchScore: score,
            hasExactPhrase: hasExactPhrase
          };
        })
        .filter(transcript => transcript.searchScore > 0);

      results = [...results, ...transcripts];

      console.log(`📝 Found ${transcripts.length} matching transcripts`);
      if (transcripts.length > 0) {
        console.log('Top transcript:', {
          title: transcripts[0].tabTitle,
          score: transcripts[0].searchScore,
          hasExactPhrase: transcripts[0].hasExactPhrase
        });
      }
    }

    // Sort all results by search score (highest first), then by timestamp
    if (query && results.length > 0) {
      results.sort((a, b) => {
        // Primary sort: by score (higher first)
        if (b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore;
        }
        // Secondary sort: by timestamp (newer first)
        return b.timestamp - a.timestamp;
      });

      // Only show results with score > 30 (good matches)
      const filteredResults = results.filter(r => r.searchScore && r.searchScore > 30);

      if (filteredResults.length > 0) {
        results = filteredResults;
        console.log(`🔍 Filtered to ${results.length} high-quality matches (score > 30)`);
        console.log('Top 3 results:', results.slice(0, 3).map(r => ({
          type: r.type,
          title: r.title || r.tabTitle,
          score: r.searchScore,
          hasExactPhrase: r.hasExactPhrase
        })));
      }
    }

    currentResults = results;

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
 * Extract key search terms from natural language questions
 * Removes filler words and focuses on important terms
 */
function extractKeyTerms(query) {
  // Common question/filler words to remove
  const fillerWords = new Set([
    'what', 'when', 'where', 'who', 'why', 'how', 'which', 'whose',
    'was', 'were', 'is', 'are', 'am', 'be', 'been', 'being',
    'do', 'does', 'did', 'doing', 'done',
    'have', 'has', 'had', 'having',
    'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must',
    'i', 'me', 'my', 'mine', 'you', 'your', 'yours',
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'about', 'above', 'after', 'again', 'against', 'all', 'and', 'any', 'as', 'at',
    'be', 'because', 'before', 'below', 'between', 'both', 'but', 'by',
    'for', 'from', 'in', 'into', 'of', 'on', 'or', 'out', 'over',
    'through', 'to', 'under', 'up', 'with',
    'reading', 'readying', 'looking', 'viewing', 'watching', 'browsing', 'visiting'
  ]);

  // Extract words and filter out filler words
  const words = query.toLowerCase()
    .replace(/[?!.,;]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => {
      // Keep if:
      // 1. Not a filler word
      // 2. At least 3 characters (or 2 for acronyms/special terms)
      // 3. Not just numbers
      return !fillerWords.has(word) &&
             word.length >= 2 &&
             !/^\d+$/.test(word);
    });

  // If we filtered out everything, return original query
  if (words.length === 0) {
    return query;
  }

  // Join remaining key terms
  return words.join(' ');
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
    // Load screenshots from background script
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: ''
    });

    let allItems = response.results || [];

    // Load transcripts from storage
    const storage = await chrome.storage.local.get(null);
    const transcripts = Object.keys(storage)
      .filter(key => key.startsWith('transcript_'))
      .map(key => ({
        ...storage[key],
        type: 'transcript',
        id: storage[key].id || key.replace('transcript_', '')
      }));

    // Combine and sort by timestamp
    allItems = [...allItems, ...transcripts].sort((a, b) => b.timestamp - a.timestamp);

    if (allItems.length > 0) {
      allResults = allItems;
      displayedResultsCount = 0;
      displayTimelineViewPaginated(true); // true = initial load
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
  aiAnswerContainer.style.display = 'none';

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
 * Display timeline view with pagination (for Browse mode)
 */
function displayTimelineViewPaginated(isInitialLoad = false) {
  if (isInitialLoad) {
    resultsContainer.innerHTML = '';
    displayedResultsCount = 0;
  }

  resultsContainer.style.display = 'block';
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  noResultsState.style.display = 'none';

  // Remove existing "View More" button if present
  const existingViewMore = document.getElementById('viewMoreBtn');
  if (existingViewMore) {
    existingViewMore.remove();
  }

  // Get next batch of results
  const startIndex = displayedResultsCount;
  const endIndex = Math.min(startIndex + RESULTS_PER_PAGE, allResults.length);
  const resultsToDisplay = allResults.slice(startIndex, endIndex);

  // Group results by date
  const groupedByDate = {};
  resultsToDisplay.forEach(result => {
    const date = new Date(result.timestamp);
    const dateKey = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(result);
  });

  // Display each date group
  Object.keys(groupedByDate).forEach(dateKey => {
    // Date header
    const dateHeader = document.createElement('div');
    dateHeader.className = 'timeline-date-header';
    dateHeader.textContent = dateKey;
    resultsContainer.appendChild(dateHeader);

    // Timeline container for this date
    const timelineGroup = document.createElement('div');
    timelineGroup.className = 'timeline-group';

    // Group consecutive items by domain
    const resultsForDate = groupedByDate[dateKey];
    const domainGroups = [];
    let currentGroup = null;

    resultsForDate.forEach((result, index) => {
      // Handle transcripts differently - they don't have URLs
      const domain = result.type === 'transcript'
        ? 'Transcripts'  // Group all transcripts together
        : getDomainFromUrl(result.url || '');

      if (!currentGroup || currentGroup.domain !== domain) {
        // Start new group
        currentGroup = {
          domain: domain,
          results: [result]
        };
        domainGroups.push(currentGroup);
      } else {
        // Add to existing group
        currentGroup.results.push(result);
      }
    });

    // Render domain groups
    domainGroups.forEach(group => {
      const groupContainer = createTimelineGroup(group);
      timelineGroup.appendChild(groupContainer);
    });

    resultsContainer.appendChild(timelineGroup);
  });

  // Update displayed count
  displayedResultsCount = endIndex;

  // Add "View More" button if there are more results
  if (displayedResultsCount < allResults.length) {
    const viewMoreBtn = document.createElement('button');
    viewMoreBtn.id = 'viewMoreBtn';
    viewMoreBtn.className = 'view-more-btn';
    viewMoreBtn.innerHTML = `
      <span>View More</span>
      <span class="view-more-count">${allResults.length - displayedResultsCount} more items</span>
    `;
    viewMoreBtn.addEventListener('click', () => {
      displayTimelineViewPaginated(false);
    });
    resultsContainer.appendChild(viewMoreBtn);
  }
}

/**
 * Display timeline view (for Browse mode) - Legacy function
 */
function displayTimelineView(results) {
  allResults = results;
  displayedResultsCount = 0;
  displayTimelineViewPaginated(true);
}

/**
 * Get domain from URL
 */
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Extract dominant color from favicon
 */
function extractColorFromFavicon(faviconUrl, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';

  img.onload = function() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Count color occurrences
      const colorCounts = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent and very light/dark pixels
        if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) continue;

        const key = `${r},${g},${b}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      // Find most common color
      let dominantColor = null;
      let maxCount = 0;
      for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantColor = color;
        }
      }

      if (dominantColor) {
        const [r, g, b] = dominantColor.split(',').map(Number);
        callback(`rgb(${r}, ${g}, ${b})`);
      } else {
        callback('#3b82f6'); // Default blue
      }
    } catch (e) {
      callback('#3b82f6'); // Default blue on error
    }
  };

  img.onerror = function() {
    callback('#3b82f6'); // Default blue on error
  };

  img.src = faviconUrl;
}

/**
 * Create a timeline group for same-domain items
 */
function createTimelineGroup(group) {
  const container = document.createElement('div');
  container.className = 'timeline-domain-group';

  // Create single icon for the group
  const icon = document.createElement('div');
  icon.className = 'timeline-icon';

  // Use real favicon
  const domain = group.domain;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  // Override icon for transcript groups
  if (domain === 'Transcripts') {
    icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#3b82f6" stroke-width="1.5" fill="white"/><path d="M8 7h8M8 11h6M8 15h4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/><circle cx="16" cy="6" r="2" fill="#3b82f6" opacity="0.2"/><path d="M15 6l1 1" stroke="#3b82f6" stroke-width="1" stroke-linecap="round"/></svg>`;

    // Set transcript color
    container.style.setProperty('--group-color', '#3b82f6');
  } else {
    icon.innerHTML = `<img src="${faviconUrl}" alt="${domain}" onerror="this.style.display='none'; this.parentElement.innerHTML='<svg width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/><line x1=\\'2\\' y1=\\'12\\' x2=\\'22\\' y2=\\'12\\'/><path d=\\'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\\'/></svg>';" style="width: 16px; height: 16px; border-radius: 2px;">`;

    // Extract color from favicon
    extractColorFromFavicon(faviconUrl, (color) => {
      container.style.setProperty('--group-color', color);
    });
  }

  container.appendChild(icon);

  // Create wrapper for items
  const itemsWrapper = document.createElement('div');
  itemsWrapper.className = 'timeline-items-wrapper';

  // Add all items in the group
  group.results.forEach((result, index) => {
    const isFirstInGroup = index === 0;
    const isLastInGroup = index === group.results.length - 1;
    const timelineItem = createTimelineItem(result, isFirstInGroup, isLastInGroup);
    itemsWrapper.appendChild(timelineItem);
  });

  container.appendChild(itemsWrapper);

  return container;
}

/**
 * Create a timeline item element (for Browse mode)
 */
function createTimelineItem(result, isFirstInGroup = false, isLastInGroup = false) {
  const item = document.createElement('div');
  item.className = 'timeline-item';

  if (isFirstInGroup) item.classList.add('first-in-group');
  if (isLastInGroup) item.classList.add('last-in-group');

  const time = document.createElement('div');
  time.className = 'timeline-time';
  const date = new Date(result.timestamp);
  time.textContent = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const content = document.createElement('div');
  content.className = 'timeline-content';

  const thumbnail = document.createElement('div');
  thumbnail.className = 'timeline-thumbnail';
  
  // Handle different item types
  if (result.type === 'transcript') {
    thumbnail.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" fill="#f8fafc"/>
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="#3b82f6" stroke-width="1.5" fill="white"/>
        <path d="M8 7h8M8 11h6M8 15h4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="16" cy="6" r="2" fill="#3b82f6" opacity="0.2"/>
        <path d="M15 6l1 1" stroke="#3b82f6" stroke-width="1" stroke-linecap="round"/>
      </svg>
    `;
    thumbnail.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    thumbnail.style.display = 'flex';
    thumbnail.style.alignItems = 'center';
    thumbnail.style.justifyContent = 'center';
  } else {
    const img = document.createElement('img');
    img.src = result.screenshot || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
    img.alt = result.title || 'Screenshot';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    thumbnail.appendChild(img);
  }

  const details = document.createElement('div');
  details.className = 'timeline-details';

  const title = document.createElement('div');
  title.className = 'timeline-title';
  
  // Use appropriate title based on item type
  if (result.type === 'transcript') {
    title.textContent = result.tabTitle || result.title || 'Audio Transcript';
  } else {
    title.textContent = result.title || 'Untitled Page';
  }

  const url = document.createElement('div');
  url.className = 'timeline-url';
  
  // Handle different item types
  if (result.type === 'transcript') {
    url.textContent = 'Audio Transcript';
  } else {
    url.textContent = truncateUrl(result.url);
  }

  details.appendChild(title);
  details.appendChild(url);

  content.appendChild(thumbnail);
  content.appendChild(details);

  item.appendChild(time);
  item.appendChild(content);

  // Click handler - open URL (only for non-transcript items)
  item.addEventListener('click', () => {
    if (result.type === 'transcript') {
      // For transcripts, we could show a modal or do something else
      console.log('Transcript clicked:', result);
    } else if (result.url) {
      chrome.tabs.create({ url: result.url });
    }
  });

  return item;
}

/**
 * Create a result card element
 */
function createResultCard(result) {
  const card = document.createElement('div');
  card.className = 'result-card';

  // Add type indicator
  if (result.type === 'transcript') {
    card.classList.add('transcript-card');
  }

  // Add relevance indicator if search score exists
  if (result.searchScore > 0) {
    card.setAttribute('data-score', Math.round(result.searchScore));
  }

  const thumbnail = document.createElement('div');
  thumbnail.className = 'result-thumbnail';

  // Different thumbnail for transcripts
  if (result.type === 'transcript') {
    thumbnail.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" fill="#f8fafc"/>
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="#3b82f6" stroke-width="1.5" fill="white"/>
        <path d="M8 7h8M8 11h6M8 15h4" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="16" cy="6" r="2" fill="#3b82f6" opacity="0.2"/>
        <path d="M15 6l1 1" stroke="#3b82f6" stroke-width="1" stroke-linecap="round"/>
      </svg>
    `;
    thumbnail.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    thumbnail.style.display = 'flex';
    thumbnail.style.alignItems = 'center';
    thumbnail.style.justifyContent = 'center';
  } else {
    const img = document.createElement('img');
    img.src = result.screenshot || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
    img.alt = result.title || 'Screenshot';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    thumbnail.appendChild(img);
  }

  const content = document.createElement('div');
  content.className = 'result-content';

  const title = document.createElement('div');
  title.className = 'result-title';

  // Highlight search query in title if searching
  const query = searchInput.value.trim();

  // Different title for transcripts
  if (result.type === 'transcript') {
    const transcriptTitle = result.tabTitle || result.title || 'Audio Transcript';
    if (query && result.searchScore > 0) {
      title.innerHTML = highlightText(transcriptTitle, query);
    } else {
      title.textContent = transcriptTitle;
    }
  } else {
    if (query && result.searchScore > 0) {
      title.innerHTML = highlightText(result.title || 'Untitled Page', query);
    } else {
      title.textContent = result.title || 'Untitled Page';
    }
  }

  const url = document.createElement('div');
  url.className = 'result-url';

  // Different metadata for transcripts
  if (result.type === 'transcript') {
    const duration = result.duration ? `${Math.round(result.duration / 1000)}s` : '0s';
    const wordCount = result.wordCount || 0;
    const tag = result.tag || 'other';
    const tagColors = {
      meeting: '#3b82f6',
      studies: '#8b5cf6',
      lecture: '#10b981',
      interview: '#f59e0b',
      other: '#71717a'
    };
    const tagColor = tagColors[tag] || tagColors.other;
    url.innerHTML = `<span style="opacity: 0.6;">🎤</span> ${duration} • ${wordCount} words • <span style="display: inline-block; padding: 0.125rem 0.5rem; background: ${tagColor}15; color: ${tagColor}; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${tag}</span>`;
  } else {
    url.textContent = truncateUrl(result.url);
  }

  const timestamp = document.createElement('div');
  timestamp.className = 'result-timestamp';
  // timestamp.innerHTML = `<span>🕐</span> ${formatTimestamp(result.timestamp)}`;

  content.appendChild(title);
  content.appendChild(url);
  content.appendChild(timestamp);

  // Add text snippet with highlighting if available
  const textContent = result.type === 'transcript'
    ? (result.text || result.summary)
    : (result.extractedText || result.domText);

  if (textContent) {
    const snippet = document.createElement('div');
    snippet.className = 'result-snippet';

    if (query && result.searchScore > 0) {
      // Extract relevant snippet around search term
      const relevantSnippet = extractRelevantSnippet(textContent, query, 100);
      snippet.innerHTML = highlightText(relevantSnippet, query);
    } else {
      // Clean HTML from text before displaying
      const cleanedText = cleanHtmlFromText(textContent);
      snippet.textContent = truncateText(cleanedText, 100);
    }

    content.appendChild(snippet);
  }

  card.appendChild(thumbnail);
  card.appendChild(content);

  // Click handler
  card.addEventListener('click', () => {
    if (result.type === 'transcript') {
      openTranscriptViewer(result);
    } else {
      chrome.tabs.create({ url: result.url });
    }
  });

  return card;
}

/**
 * Highlight search terms in text
 */
function highlightText(text, query) {
  if (!query || !text) return text;

  // First, escape HTML to prevent rendering HTML tags
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const terms = query.toLowerCase().trim().split(/\s+/);
  let highlighted = escapedText;

  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
}

/**
 * Clean HTML tags and normalize whitespace from text
 */
function cleanHtmlFromText(text) {
  if (!text) return '';

  // Remove script and style tags with their content
  let cleaned = text.replace(/<(script|style)[^>]*>[\s\S]*?<\/(script|style)>/gi, ' ');

  // Remove meta tags and their content
  cleaned = cleaned.replace(/<meta[^>]*>/gi, ' ');

  // Remove all other HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Remove CSS-like patterns that might have leaked through
  cleaned = cleaned.replace(/[a-z-]+\s*:\s*[^;]+;/gi, ' ');

  // Normalize whitespace - replace multiple spaces/newlines with single space
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Extract relevant snippet around search term
 */
function extractRelevantSnippet(text, query, maxLength) {
  // Clean HTML from text first
  text = cleanHtmlFromText(text);

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
  const originalHTML = captureNowBtn.innerHTML;
  captureNowBtn.disabled = true;
  captureNowBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" opacity="0.5">
      <rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="10.5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 3h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;

  try {
    await chrome.runtime.sendMessage({ action: 'captureNow' });

    // Update stats after capture
    setTimeout(async () => {
      await loadStats();
      await loadRecentCaptures();
      captureNowBtn.disabled = false;
      captureNowBtn.innerHTML = originalHTML;
    }, 1000);
  } catch (error) {
    console.error('Capture failed:', error);
    captureNowBtn.disabled = false;
    captureNowBtn.innerHTML = originalHTML;
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
  // Handle undefined or null URLs
  if (!url) {
    return 'No URL';
  }
  
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
      askMode.disabled = false;
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
    askMode.disabled = false;
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
  askMode.disabled = true;

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
  askMode.title = msg.title;
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

  if (isGeneratingResponse) {
    console.log('⏳ Already generating a response, please wait...');
    return;
  }

  // Set flag to prevent duplicate calls
  isGeneratingResponse = true;

  // Hide other states, show AI loading
  showState('aiLoading');

  try {
    // First, correct any typos/grammar mistakes
    const correctedQuery = await correctQuery(query);

    // Then extract key terms from natural language question
    const searchQuery = extractKeyTerms(correctedQuery);
    console.log(`🔍 Original query: "${query}"`);
    if (correctedQuery !== query) {
      console.log(`📝 Corrected query: "${correctedQuery}"`);
    }
    console.log(`🔍 Extracted terms: "${searchQuery}"`);

    // First, do a semantic search to get relevant captures (screenshots)
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: searchQuery,
      semantic: true // Use semantic search for better relevance
    });

    let allResults = response.results || [];

    // Also search transcripts with sophisticated scoring (same as Search mode)
    const storage = await chrome.storage.local.get(null);
    const transcripts = Object.keys(storage)
      .filter(key => key.startsWith('transcript_'))
      .map(key => {
        const transcript = storage[key];
        const title = (transcript.tabTitle || '').toLowerCase();
        const text = (transcript.text || '').toLowerCase();
        const summary = (transcript.summary || '').toLowerCase();
        const normalizedQuery = searchQuery.toLowerCase().trim(); // Use extracted key terms
        const searchTerms = normalizedQuery.split(/\s+/);

        let score = 0;
        let matchedTerms = 0;
        let hasExactPhrase = false;

        // PRIORITY 1: Exact phrase matches
        if (searchTerms.length > 1) {
          if (title.includes(normalizedQuery)) {
            score += 600;
            hasExactPhrase = true;
            if (title === normalizedQuery) score += 200;
          }

          if (text.includes(normalizedQuery)) {
            score += 400;
            hasExactPhrase = true;

            const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const occurrences = (text.match(new RegExp(escapedQuery, 'g')) || []).length;
            score += Math.min(occurrences * 60, 240);

            const firstIndex = text.indexOf(normalizedQuery);
            if (firstIndex !== -1 && firstIndex < 100) {
              score += 120;
            } else if (firstIndex !== -1 && firstIndex < 300) {
              score += 60;
            }
          }

          if (summary.includes(normalizedQuery)) {
            score += 350;
            hasExactPhrase = true;
          }
        }

        // PRIORITY 2: Individual term matching
        searchTerms.forEach(term => {
          const termWeight = hasExactPhrase ? 0.4 : 1.0;

          if (title.includes(term)) {
            score += 60 * termWeight;
            matchedTerms++;
            if (title.startsWith(term)) score += 25 * termWeight;
          }

          if (text.includes(term)) {
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const occurrences = (text.match(new RegExp(escapedTerm, 'g')) || []).length;
            score += Math.min(occurrences * 8, 50) * termWeight;
            matchedTerms++;
          }

          if (summary.includes(term)) {
            score += 40 * termWeight;
            matchedTerms++;
          }
        });

        if (!hasExactPhrase && searchTerms.length > 1 && matchedTerms < searchTerms.length) {
          score *= 0.5;
        }

        const ageInDays = (Date.now() - (transcript.timestamp || Date.now())) / (1000 * 60 * 60 * 24);
        if (ageInDays < 1) score += 8;

        return {
          ...transcript,
          type: 'transcript',
          id: transcript.id || Date.now(),
          searchScore: score,
          hasExactPhrase: hasExactPhrase
        };
      })
      .filter(transcript => transcript.searchScore > 0);

    // Combine results
    allResults = [...allResults, ...transcripts];

    console.log(`🤖 Ask AI: Found ${allResults.length} total results (${transcripts.length} transcripts)`);

    if (allResults.length === 0) {
      showState('noResults');
      return;
    }

    // Sort all results by search score (highest first), then by timestamp
    allResults.sort((a, b) => {
      if (b.searchScore !== a.searchScore) {
        return b.searchScore - a.searchScore;
      }
      return b.timestamp - a.timestamp;
    });

    // Filter for only highly relevant results (score > 20 for better accuracy)
    // Only include results with actual search scores (meaning they matched the query)
    const relevantResults = allResults.filter(r => r.searchScore && r.searchScore > 20);

    console.log(`🤖 Ask AI: ${relevantResults.length} relevant results (score > 20)`);
    if (relevantResults.length > 0) {
      console.log('Top 3 relevant results:', relevantResults.slice(0, 3).map(r => ({
        type: r.type,
        title: r.title || r.tabTitle,
        score: r.searchScore,
        hasExactPhrase: r.hasExactPhrase
      })));
    }

    if (relevantResults.length === 0) {
      // No relevant results found
      aiAnswerContainer.style.display = 'block';
      resultsContainer.style.display = 'none';
      loadingState.style.display = 'none';
      aiLoadingState.style.display = 'none';

      aiAnswerText.textContent = "I couldn't find any browsing history related to your question. Try searching for specific keywords or browse your timeline to see what you've visited.";
      aiSourcesList.innerHTML = '';
      return;
    }

    // Smart threshold: Use adaptive scoring to get the best matches
    // Calculate the score difference between consecutive results
    // Only include results that are within 50% of the top score or have minimal score drop
    const topScore = relevantResults[0].searchScore;
    const minScore = topScore * 0.5; // At least 50% of the top score

    const topResults = [];
    for (let i = 0; i < relevantResults.length && topResults.length < 6; i++) {
      const result = relevantResults[i];

      // Include if score is within 50% of top score
      if (result.searchScore >= minScore) {
        topResults.push(result);
      } else {
        // Stop if we already have at least 2 results and score drops too much
        if (topResults.length >= 2) {
          break;
        }
      }
    }

    console.log(`🤖 AI Answer using ${topResults.length} relevant results from ${response.results.length} total`);
    console.log('Top results:', topResults.map(r => ({ title: r.title, score: r.searchScore })));
    console.log(`Score range: ${topResults[topResults.length - 1].searchScore} - ${topScore}`);

    if (topResults.length === 0) {
      // No relevant results found
      aiAnswerContainer.style.display = 'block';
      resultsContainer.style.display = 'none';
      loadingState.style.display = 'none';
      aiLoadingState.style.display = 'none';

      aiAnswerText.textContent = "I couldn't find any browsing history related to your question. Try searching for specific keywords or browse your timeline to see what you've visited.";
      aiSourcesList.innerHTML = '';
      return;
    }

    // Initialize chat with first query
    chatHistory = [];
    chatContext = topResults;

    // Show full-page chat interface
    aiChatContainer.style.display = 'flex';
    resultsContainer.style.display = 'none';
    loadingState.style.display = 'none';
    aiLoadingState.style.display = 'none';
    chatMessages.innerHTML = '';

    // Add user message
    addChatMessage('user', query);

    // Show typing animation
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-message ai';
    loadingEl.innerHTML = `
      <div class="chat-loading">
        <div class="chat-loading-dot"></div>
        <div class="chat-loading-dot"></div>
        <div class="chat-loading-dot"></div>
      </div>
    `;
    chatMessages.appendChild(loadingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Generate AI answer
    const answer = await generateAIAnswer(query, topResults);

    // Remove typing animation
    chatMessages.removeChild(loadingEl);

    // Add AI response
    addChatMessage('ai', answer, topResults);

    // Clear and focus the chat input field
    chatInputField.value = '';
    chatInputField.focus();

  } catch (error) {
    console.error('AI answer failed:', error);
    showState('noResults');
    alert('Failed to generate AI answer. The Prompt API may not be fully available yet.');
  } finally {
    // Reset flag
    isGeneratingResponse = false;
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

    // Generate answer (non-streaming to prevent flickering)
    console.log('🤖 Generating AI response...');
    const answer = await aiSession.prompt(prompt);
    console.log('✅ AI response generated');

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

    // Add thumbnail
    const sourceThumbnail = document.createElement('img');
    sourceThumbnail.className = 'ai-source-thumbnail';
    sourceThumbnail.src = source.screenshot || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
    sourceThumbnail.alt = source.title || 'Untitled Page';

    const sourceContent = document.createElement('div');
    sourceContent.className = 'ai-source-content';

    const sourceTitle = document.createElement('div');
    sourceTitle.className = 'ai-source-title';
    sourceTitle.textContent = source.title || 'Untitled Page';

    const sourceUrl = document.createElement('div');
    sourceUrl.className = 'ai-source-url';
    sourceUrl.textContent = truncateUrl(source.url);

    sourceContent.appendChild(sourceTitle);
    sourceContent.appendChild(sourceUrl);

    sourceItem.appendChild(sourceThumbnail);
    sourceItem.appendChild(sourceContent);

    // Click to open source
    sourceItem.addEventListener('click', () => {
      chrome.tabs.create({ url: source.url });
    });

    aiSourcesList.appendChild(sourceItem);
  });
}

/**
 * Simple markdown parser for chat messages
 */
function parseMarkdown(text) {
  if (!text) return '';

  let html = text;

  // Escape HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```code```) - must be before inline code
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold (**text** or __text__) - must be before italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<p>') && !html.startsWith('<pre>') && !html.startsWith('<ul>') && !html.startsWith('<ol>')) {
    html = '<p>' + html + '</p>';
  }

  // Lists (- item or * item)
  html = html.replace(/<p>([-*]\s+.+?)(<\/p>|<br>)/g, function(match, content) {
    const items = content.split(/<br>[-*]\s+/);
    const listItems = items.map(item => {
      const cleaned = item.replace(/^[-*]\s+/, '').trim();
      return cleaned ? `<li>${cleaned}</li>` : '';
    }).filter(Boolean).join('');
    return listItems ? `<ul>${listItems}</ul>` : match;
  });

  // Numbered lists (1. item)
  html = html.replace(/<p>(\d+\.\s+.+?)(<\/p>|<br>)/g, function(match, content) {
    const items = content.split(/<br>\d+\.\s+/);
    const listItems = items.map(item => {
      const cleaned = item.replace(/^\d+\.\s+/, '').trim();
      return cleaned ? `<li>${cleaned}</li>` : '';
    }).filter(Boolean).join('');
    return listItems ? `<ol>${listItems}</ol>` : match;
  });

  // Headers (## text)
  html = html.replace(/<p>(#{1,6})\s+([^<]+)<\/p>/g, function(match, hashes, content) {
    const level = hashes.length;
    return `<h${level}>${content.trim()}</h${level}>`;
  });

  return html;
}

/**
 * Add a message to the chat interface
 */
function addChatMessage(type, content, sources = null) {
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${type}`;

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'chat-message-bubble';

  // For AI messages, parse markdown; for user messages, use plain text
  if (type === 'ai') {
    bubbleEl.innerHTML = parseMarkdown(content);
  } else {
    bubbleEl.textContent = content;
  }

  messageEl.appendChild(bubbleEl);

  // Add sources if provided (for AI messages)
  if (type === 'ai' && sources && sources.length > 0) {
    const sourcesEl = document.createElement('div');
    sourcesEl.className = 'chat-message-sources';

    const sourcesHeader = document.createElement('div');
    sourcesHeader.className = 'chat-message-sources-header';
    sourcesHeader.textContent = 'Sources';
    sourcesEl.appendChild(sourcesHeader);

    // Create grid container for sources
    const sourcesGrid = document.createElement('div');
    sourcesGrid.className = 'chat-sources-grid';

    sources.forEach(source => {
      const sourceItem = document.createElement('div');
      sourceItem.className = 'chat-source-item';

      const thumbnail = document.createElement('img');
      thumbnail.className = 'chat-source-thumbnail';
      thumbnail.src = source.screenshot || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
      thumbnail.alt = source.title;

      const title = document.createElement('div');
      title.className = 'chat-source-title';
      title.textContent = source.title || 'Untitled Page';

      sourceItem.appendChild(thumbnail);
      sourceItem.appendChild(title);

      sourceItem.addEventListener('click', () => {
        chrome.tabs.create({ url: source.url });
      });

      sourcesGrid.appendChild(sourceItem);
    });

    sourcesEl.appendChild(sourcesGrid);
    messageEl.appendChild(sourcesEl);
  }

  chatMessages.appendChild(messageEl);

  // Store in history
  chatHistory.push({ type, content, sources });

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Handle chat send from dedicated chat input field
 */
async function handleChatSendFromInput() {
  const query = chatInputField.value.trim();

  if (!query || isGeneratingResponse) return;

  // Set flag to prevent duplicate calls
  isGeneratingResponse = true;

  // Disable input temporarily
  chatInputField.disabled = true;
  chatSendBtn.disabled = true;

  // Add user message
  addChatMessage('user', query);
  chatInputField.value = '';

  // Show WhatsApp-style loading indicator
  const loadingEl = document.createElement('div');
  loadingEl.className = 'chat-message ai';
  loadingEl.innerHTML = `
    <div class="chat-loading">
      <div class="chat-loading-dot"></div>
      <div class="chat-loading-dot"></div>
      <div class="chat-loading-dot"></div>
    </div>
  `;
  chatMessages.appendChild(loadingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    // Use existing context for follow-up questions
    const answer = await generateAIAnswer(query, chatContext || []);

    // Remove loading indicator
    chatMessages.removeChild(loadingEl);

    // Add AI response
    addChatMessage('ai', answer, chatContext);

  } catch (error) {
    console.error('Chat AI failed:', error);
    chatMessages.removeChild(loadingEl);
    addChatMessage('ai', "I'm sorry, I encountered an error. Please try again.");
  } finally {
    // Re-enable input and reset flag
    chatInputField.disabled = false;
    chatSendBtn.disabled = false;
    isGeneratingResponse = false;
    chatInputField.focus();
  }
}

/**
 * Handle chat send (legacy - uses main search input)
 */
async function handleChatSend() {
  // Redirect to the new chat input handler
  await handleChatSendFromInput();
}

// Track current analytics view
let currentAnalyticsView = 'weekly';

// Proofreader API session
let proofreaderSession = null;

/**
 * Initialize Proofreader API for query correction
 */
async function initializeProofreader() {
  try {
    // Check if Proofreader API is available
    if (typeof window.Proofreader === 'undefined') {
      console.log('📝 Proofreader API not available');
      return false;
    }

    // Check availability
    const availability = await window.Proofreader.availability();
    console.log('📝 Proofreader availability:', availability);

    if (availability === 'no') {
      console.log('📝 Proofreader not available on this device');
      return false;
    }

    // If downloadable, create session (will trigger download if needed)
    if (availability === 'downloadable' || availability === 'readily') {
      proofreaderSession = await window.Proofreader.create({
        expectedInputLanguages: ['en'],
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`📝 Proofreader download: ${(e.loaded * 100).toFixed(1)}%`);
          });
        }
      });

      console.log('✅ Proofreader API initialized');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Failed to initialize Proofreader API:', error);
    return false;
  }
}

/**
 * Correct query using Proofreader API
 */
async function correctQuery(query) {
  try {
    // If no proofreader session, return original query
    if (!proofreaderSession) {
      return query;
    }

    // Proofread the query
    const result = await proofreaderSession.proofread(query);

    // If corrections were made, log and return corrected text
    if (result.corrections && result.corrections.length > 0) {
      console.log('📝 Query corrected:', {
        original: query,
        corrected: result.corrected,
        corrections: result.corrections.length
      });
      return result.corrected;
    }

    // No corrections needed
    return query;
  } catch (error) {
    console.warn('Query correction failed:', error);
    return query; // Return original on error
  }
}

/**
 * Render weekly activity chart (last 7 days)
 */
function renderWeeklyActivityChart(captures) {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityByDay = new Array(7).fill(0);
  const dateLabels = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = captures.filter(c => {
      const captureDate = new Date(c.timestamp);
      return captureDate >= date && captureDate < nextDay;
    }).length;

    activityByDay[6 - i] = count;
    dateLabels[6 - i] = dayLabels[date.getDay()];
  }

  // Update title
  document.getElementById('activityChartTitle').textContent = 'Activity (Last 7 Days)';

  // Calculate week total
  const weekTotal = activityByDay.reduce((sum, count) => sum + count, 0);
  document.getElementById('weekTotal').textContent = `${weekTotal.toLocaleString()} captures this week`;

  // Render chart
  const maxActivity = Math.max(...activityByDay, 1);
  const activityChart = document.getElementById('activityChart');
  activityChart.innerHTML = activityByDay.map((count, index) => {
    const height = (count / maxActivity) * 100;
    return `
      <div class="chart-bar">
        <div class="bar-container">
          <div class="bar-fill" style="height: ${height}%">
            <div class="bar-value">${count}</div>
          </div>
        </div>
        <div class="bar-label">${dateLabels[index]}</div>
      </div>
    `;
  }).join('');
}

/**
 * Render daily activity chart (3-hour intervals for today)
 */
function renderDailyActivityChart(captures) {
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter captures from today
  const todayCaptures = captures.filter(c => {
    const captureDate = new Date(c.timestamp);
    return captureDate >= today && captureDate < tomorrow;
  });

  // 8 intervals of 3 hours each (0-3, 3-6, 6-9, 9-12, 12-15, 15-18, 18-21, 21-24)
  const intervals = 8;
  const activityByInterval = new Array(intervals).fill(0);
  const intervalLabels = [
    '12-3am', '3-6am', '6-9am', '9am-12pm',
    '12-3pm', '3-6pm', '6-9pm', '9pm-12am'
  ];

  todayCaptures.forEach(capture => {
    const hour = new Date(capture.timestamp).getHours();
    const intervalIndex = Math.floor(hour / 3);
    activityByInterval[intervalIndex]++;
  });

  console.log('📊 Daily Activity Data:', {
    todayCaptures: todayCaptures.length,
    activityByInterval,
    maxActivity: Math.max(...activityByInterval, 1)
  });

  // Update title
  document.getElementById('activityChartTitle').textContent = 'Activity (Today)';

  // Calculate today's total
  const todayTotal = activityByInterval.reduce((sum, count) => sum + count, 0);
  document.getElementById('weekTotal').textContent = `${todayTotal.toLocaleString()} captures today`;

  // Render chart
  const maxActivity = Math.max(...activityByInterval, 1);
  const activityChart = document.getElementById('activityChart');
  activityChart.innerHTML = activityByInterval.map((count, index) => {
    // Calculate height with minimum of 5% for bars with data
    let height = 0;
    if (count > 0) {
      height = Math.max((count / maxActivity) * 100, 5);
    }

    return `
      <div class="chart-bar">
        <div class="bar-container">
          <div class="bar-fill" style="height: ${height}%">
            <div class="bar-value">${count}</div>
          </div>
        </div>
        <div class="bar-label">${intervalLabels[index]}</div>
      </div>
    `;
  }).join('');
}

/**
 * Load analytics data
 */
async function loadAnalytics(view = currentAnalyticsView) {
  currentAnalyticsView = view;

  try {
    // Get all captures
    const response = await chrome.runtime.sendMessage({
      action: 'search',
      query: ''
    });

    const captures = response.results || [];
    console.log('Analytics: Loaded captures:', captures.length);
    if (captures.length > 0) {
      console.log('Analytics: Sample capture:', captures[0]);
      console.log('Analytics: Sample timestamp:', new Date(captures[0].timestamp));
    }

    // If no captures, show empty state
    if (captures.length === 0) {
      const activityChart = document.getElementById('activityChart');
      if (activityChart) {
        activityChart.innerHTML = `
          <div style="text-align: center; padding: 3rem 1rem; color: #71717a;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">📊</div>
            <div style="font-size: 0.9375rem; font-weight: 500; margin-bottom: 0.5rem;">No Activity Yet</div>
            <div style="font-size: 0.8125rem; opacity: 0.7;">Browse the web to start capturing your activity</div>
          </div>
        `;
      }

      const topDomainsList = document.getElementById('topDomainsList');
      if (topDomainsList) {
        topDomainsList.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem; color: #71717a;">
            <div style="font-size: 0.875rem;">No domains visited yet</div>
          </div>
        `;
      }

      const hourlyChart = document.getElementById('hourlyChart');
      if (hourlyChart) {
        hourlyChart.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem; color: #71717a;">
            <div style="font-size: 0.875rem;">No hourly data yet</div>
          </div>
        `;
      }

      document.getElementById('weekTotal').textContent = '0 captures this week';
      document.getElementById('uniqueDomains').textContent = '0 unique domains';
      document.getElementById('peakHourText').textContent = 'No peak hour yet';

      return;
    }

    // Calculate summary stats
    const total = captures.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekCaptures = captures.filter(c => new Date(c.timestamp) >= startOfWeek).length;


    // Update section subtitles
    document.getElementById('weekTotal').textContent = `${weekCaptures.toLocaleString()} captures this week`;

    // Calculate top domains with percentages
    const domainCounts = {};
    const domainFirstSeen = {};
    const domainLastSeen = {};

    captures.forEach(capture => {
      try {
        const domain = new URL(capture.url).hostname.replace('www.', '');
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;

        if (!domainFirstSeen[domain] || capture.timestamp < domainFirstSeen[domain]) {
          domainFirstSeen[domain] = capture.timestamp;
        }
        if (!domainLastSeen[domain] || capture.timestamp > domainLastSeen[domain]) {
          domainLastSeen[domain] = capture.timestamp;
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });

    const topDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    document.getElementById('uniqueDomains').textContent = `${Object.keys(domainCounts).length} unique domains`;

    // Render top domains
    const topDomainsList = document.getElementById('topDomainsList');
    topDomainsList.innerHTML = topDomains.map(([domain, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      const lastVisit = new Date(domainLastSeen[domain]);
      const timeAgo = formatTimeAgo(lastVisit);

      return `
        <div class="site-card">
          <div class="site-header">
            <img class="site-favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="${domain}">
            <div class="site-name">${domain}</div>
          </div>
          <div class="site-stats">
            <div class="site-stat">
              <span class="site-stat-value">${count}</span>
              <span>visits</span>
            </div>
            <div class="site-stat">
              <span class="site-stat-value">${percentage}%</span>
              <span>of total</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Render activity chart based on view
    if (view === 'daily') {
      // Daily view: 3-hour intervals for today
      renderDailyActivityChart(captures);
    } else {
      // Weekly view: last 7 days
      renderWeeklyActivityChart(captures);
    }

    // Calculate hourly activity (24 hours)
    const hourlyActivity = new Array(24).fill(0);
    captures.forEach(capture => {
      const hour = new Date(capture.timestamp).getHours();
      hourlyActivity[hour]++;
    });

    const maxHourly = Math.max(...hourlyActivity, 1);
    const peakHour = hourlyActivity.indexOf(maxHourly);
    const peakHourDisplay = peakHour === 0 ? '12 AM' : peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`;

    document.getElementById('peakHourText').textContent = `Peak activity at ${peakHourDisplay} (${maxHourly} captures)`;

    // Render hourly chart
    const hourlyChart = document.getElementById('hourlyChart');
    hourlyChart.innerHTML = hourlyActivity.map((count, hour) => {
      let intensity = 0;
      if (count > 0) {
        const ratio = count / maxHourly;
        if (ratio >= 0.75) intensity = 4;
        else if (ratio >= 0.5) intensity = 3;
        else if (ratio >= 0.25) intensity = 2;
        else intensity = 1;
      }

      const displayHour = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`;

      return `
        <div class="hour-cell" data-intensity="${intensity}">
          ${displayHour}
          <div class="hour-tooltip">${count} captures</div>
        </div>
      `;
    }).join('');


  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

/**
 * Toggle transcription on/off
 */
async function toggleTranscription() {
  if (isTranscribing) {
    stopTranscription();
  } else {
    await startTranscription();
  }
}

/**
 * Start transcribing tab audio using Prompt API with audio input
 * Requires: Chrome 138+ (Canary/Dev) and Prompt API origin trial enrollment
 */
async function startTranscription() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      alert('No active tab found');
      return;
    }

    console.log('🎙️ Starting transcription for tab:', tab.title);

    // Check if Prompt API is available
    if (typeof window.LanguageModel === 'undefined') {
      alert('Prompt API not available.\n\nRequirements:\n1. Chrome 138+ (Canary/Dev)\n2. Enable: chrome://flags/#prompt-api-for-gemini-nano\n3. Enable: chrome://flags/#optimization-guide-on-device-model\n\nDownload model at: chrome://components (Optimization Guide On Device Model)');
      return;
    }

    try {
      // Create Prompt API session with audio input capability
      console.log('Creating Prompt API session with audio input...');

      // Show transcription page
      showTranscriptionPage(tab.title);

      // Create Prompt API session with audio input
      transcriptionSession = await window.LanguageModel.create({
        expectedInputs: [{ type: 'audio' }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        systemPrompt: 'You are a transcription assistant. Transcribe the audio accurately, word for word.'
      });

      console.log('✅ Prompt API session created with audio input support');

      // Capture tab audio using getDisplayMedia
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 48000
        },
        video: {
          displaySurface: 'browser'
        },
        preferCurrentTab: true
      });

      // Extract audio tracks
      const audioTracks = stream.getAudioTracks();

      if (audioTracks.length === 0) {
        stream.getVideoTracks().forEach(track => track.stop());
        alert('No audio track found.\n\nMake sure to:\n1. Check "Share audio" in the dialog\n2. Select a tab that is playing audio');
        if (transcriptionSession && transcriptionSession.destroy) {
          transcriptionSession.destroy();
        }
        resetTranscriptionState();
        return;
      }

      // Stop video tracks (we don't need them)
      stream.getVideoTracks().forEach(track => track.stop());

      // Create audio-only stream
      const audioOnlyStream = new MediaStream(audioTracks);
      audioStream = audioOnlyStream;

      // Create MediaRecorder to capture audio chunks
      audioChunks = [];

      // Try different audio formats to see which works best with Prompt API
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }

      console.log('📼 Using audio format:', mimeType);

      mediaRecorder = new MediaRecorder(audioOnlyStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // Higher quality might help
      });

      // Initialize state
      isTranscribing = true;
      transcriptionStartTime = Date.now();
      transcriptionTabTitle = tab.title;
      currentTranscript = '';

      // Simple approach: Just collect audio chunks, transcribe when done
      // (Real-time streaming transcription doesn't work with Prompt API)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log('🎵 Audio chunk collected:', event.data.size, 'bytes (total chunks:', audioChunks.length + ')');

          // Update UI to show we're recording
          const transcriptEmpty = document.querySelector('.transcript-empty');
          if (transcriptEmpty) {
            const totalSize = audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
            const durationSeconds = Math.floor((Date.now() - transcriptionStartTime) / 1000);
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            const timeDisplay = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

            transcriptEmpty.innerHTML = `
              <div style="text-align: center; max-width: 320px; margin: 0 auto;">
                <div class="recording-indicator">
                  <div class="recording-indicator-dot"></div>
                </div>
                <div style="font-size: 0.9375rem; font-weight: 500; margin-bottom: 2.5rem; color: #18181b; letter-spacing: -0.01em;">Recording</div>
                <div style="display: grid; grid-template-columns: 1fr 1px 1fr; gap: 2rem; margin-bottom: 3rem;">
                  <div style="text-align: center;">
                    <div style="font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 0.5rem;">Duration</div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: #18181b; font-variant-numeric: tabular-nums; letter-spacing: -0.02em;">${timeDisplay}</div>
                  </div>
                  <div style="width: 1px; background: #e4e4e7;"></div>
                  <div style="text-align: center;">
                    <div style="font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 0.5rem;">Size</div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: #18181b; font-variant-numeric: tabular-nums; letter-spacing: -0.02em;">${(totalSize / 1024).toFixed(0)}<span style="font-size: 0.875rem; color: #71717a; margin-left: 0.25rem;">KB</span></div>
                  </div>
                </div>
                <button id="stopRecordingInline" style="display: inline-flex; align-items: center; padding: 0.625rem 1.5rem; background: #18181b; color: #ffffff; border: none; border-radius: 6px; font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); letter-spacing: -0.01em; margin-bottom: 1rem;">
                  Stop Recording
                </button>
                <div style="font-size: 0.8125rem; color: #a1a1aa; letter-spacing: -0.01em;">Transcription will begin after recording stops</div>
              </div>
            `;

            // Attach event listener to inline stop button
            const stopBtn = transcriptEmpty.querySelector('#stopRecordingInline');
            if (stopBtn) {
              stopBtn.addEventListener('click', () => stopTranscription());
            }
          }
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎙️ Recording stopped');
        await handleTranscriptionComplete();
      };

      mediaRecorder.onerror = (event) => {
        console.error('🎙️ Recording error:', event.error);
        alert('Recording failed: ' + event.error);
        resetTranscriptionState();
      };

      // Start recording - collect audio chunks continuously
      // We'll transcribe the complete audio when recording stops
      mediaRecorder.start(1000); // Collect chunks every 1 second for UI updates

      // Update UI
      recordMeetingBtn.classList.add('recording');
      recordMeetingBtn.title = 'Stop Transcription';

      console.log('✅ Real-time transcription started using Prompt API with audio input');
      console.log('💡 Tab audio will be transcribed in real-time using Gemini Nano');

    } catch (recognitionError) {
      console.error('Failed to start transcription:', recognitionError);
      alert('Failed to start transcription: ' + recognitionError.message);
      resetTranscriptionState();
    }

  } catch (error) {
    console.error('Failed to start transcription:', error);
    alert('Failed to start transcription: ' + error.message);
    resetTranscriptionState();
  }
}

/**
 * Stop transcription
 */
function stopTranscription() {
  if (!isTranscribing) {
    return;
  }

  console.log('🎙️ Stopping transcription...');

  try {
    // Mark as not transcribing first
    isTranscribing = false;

    // Stop media recorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }

  } catch (error) {
    console.error('Error stopping transcription:', error);
    resetTranscriptionState();
  }
}

/**
 * Handle transcription completion
 */
async function handleTranscriptionComplete() {
  console.log('🎙️ Recording stopped - starting transcription...');

  const transcriptionStatus = document.getElementById('transcriptionStatus');
  const transcriptSummary = document.getElementById('transcriptSummary');
  const transcriptEmpty = document.querySelector('.transcript-empty');

  // Check if we have audio chunks
  if (!audioChunks || audioChunks.length === 0) {
    if (transcriptionStatus) {
      transcriptionStatus.textContent = 'No audio detected';
    }
    if (transcriptEmpty) {
      transcriptEmpty.innerHTML = `
        <div style="text-align: center; max-width: 400px; margin: 0 auto; padding: 2rem;">
          <div style="font-size: 1.125rem; font-weight: 600; color: #18181b; margin-bottom: 0.75rem; letter-spacing: -0.01em;">No Audio Detected</div>
          <div style="font-size: 0.9375rem; color: #71717a; line-height: 1.6; margin-bottom: 2rem;">
            The recording didn't capture any audio. This usually happens when:
          </div>
          <div style="text-align: left; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 4px; height: 4px; background: #ef4444; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
              <div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">Audio sharing wasn't enabled</div>
                <div style="font-size: 0.8125rem; color: #71717a;">Make sure to check "Share audio" when selecting a tab</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 4px; height: 4px; background: #ef4444; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
              <div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">The tab had no audio playing</div>
                <div style="font-size: 0.8125rem; color: #71717a;">Start recording when audio is actively playing</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <div style="width: 4px; height: 4px; background: #ef4444; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
              <div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">Tab volume was muted</div>
                <div style="font-size: 0.8125rem; color: #71717a;">Ensure the tab's audio is unmuted</div>
              </div>
            </div>
          </div>
          <button onclick="hideTranscriptionPage()" style="display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)'">
            Try Again
          </button>
        </div>
      `;
    }
    // Don't reset state yet - let user click "Try Again" button
    return;
  }

  // Combine all audio chunks into a single blob
  const completeAudioBlob = new Blob(audioChunks, { type: audioChunks[0].type });
  const audioSizeMB = (completeAudioBlob.size / (1024 * 1024)).toFixed(2);
  console.log('📼 Complete audio:', completeAudioBlob.size, 'bytes (' + audioSizeMB + ' MB)');

  // Check if audio blob is empty or too small (less than 1KB likely means no actual audio)
  if (completeAudioBlob.size < 1000) {
    if (transcriptionStatus) {
      transcriptionStatus.textContent = 'No audio detected';
    }
    if (transcriptEmpty) {
      transcriptEmpty.innerHTML = `
        <div style="text-align: center; max-width: 400px; margin: 0 auto; padding: 2rem;">
          <div style="font-size: 1.125rem; font-weight: 600; color: #18181b; margin-bottom: 0.75rem; letter-spacing: -0.01em;">No Audio Detected</div>
          <div style="font-size: 0.9375rem; color: #71717a; line-height: 1.6; margin-bottom: 2rem;">
            The recording was too short or didn't contain any audio.
          </div>
          <div style="text-align: left; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
              <div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">Check "Share audio" in the dialog</div>
                <div style="font-size: 0.8125rem; color: #71717a;">Enable audio sharing when selecting a tab</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
              <div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">Make sure audio is playing</div>
                <div style="font-size: 0.8125rem; color: #71717a;">Start the video/audio before recording</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <div style="width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
              <div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">Record for at least 3-5 seconds</div>
                <div style="font-size: 0.8125rem; color: #71717a;">Give it some time to capture audio</div>
              </div>
            </div>
          </div>
          <button onclick="hideTranscriptionPage()" style="display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)'">
            Try Again
          </button>
        </div>
      `;
    }
    // Don't reset state yet - let user click "Try Again" button
    return;
  }

  // Update UI to show transcription in progress
  if (transcriptionStatus) {
    transcriptionStatus.innerHTML = 'Transcribing';
  }
  if (transcriptEmpty) {
    transcriptEmpty.innerHTML = `
      <div style="text-align: center; max-width: 280px; margin: 0 auto;">
        <div style="width: 32px; height: 32px; margin: 0 auto 2rem; position: relative;">
          <svg style="animation: spin 1.5s linear infinite;" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#18181b" stroke-width="2" stroke-linecap="round" stroke-dasharray="50 50" opacity="0.2"/>
          </svg>
        </div>
        <div style="font-size: 0.9375rem; font-weight: 500; margin-bottom: 1rem; color: #18181b; letter-spacing: -0.01em;">Transcribing</div>
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; margin-bottom: 1.5rem;">
          <div style="font-size: 0.8125rem; font-weight: 500; color: #71717a; letter-spacing: -0.01em;">${audioSizeMB} MB</div>
        </div>
        <div style="font-size: 0.8125rem; color: #a1a1aa; letter-spacing: -0.01em;">Processing with Gemini Nano</div>
      </div>
    `;
  }

  // Add spinning animation if not already in CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('style[data-spin-animation]')) {
    style.setAttribute('data-spin-animation', 'true');
    document.head.appendChild(style);
  }

  try {
    // Use the existing session that was created at the start
    console.log('🎤 Sending complete audio to Prompt API for transcription...');

    const completeTranscript = await transcriptionSession.prompt([
      {
        role: 'user',
        content: [
          { type: 'text', value: 'Transcribe this complete audio recording accurately, word for word:' },
          { type: 'audio', value: completeAudioBlob }
        ]
      }
    ]);

    if (completeTranscript && completeTranscript.trim()) {
      console.log('✅ Transcription successful!');
      console.log('📝 Transcript length:', completeTranscript.length, 'characters');

      currentTranscript = completeTranscript;
      updateTranscriptDisplay(currentTranscript);

      // Update word count
      const transcriptWordCount = document.getElementById('transcriptWordCount');
      if (transcriptWordCount) {
        const wordCount = currentTranscript.trim().split(/\s+/).length;
        transcriptWordCount.textContent = wordCount;
      }

      if (transcriptionStatus) {
        transcriptionStatus.innerHTML = 'Complete';
      }

      // Show tab switcher
      const transcriptTabs = document.getElementById('transcriptTabs');
      if (transcriptTabs) {
        transcriptTabs.style.display = 'flex';
        transcriptTabs.style.animation = 'fadeIn 0.3s ease-out';
      }

      // Show save button in header
      const saveTranscriptHeaderBtn = document.getElementById('saveTranscriptHeaderBtn');
      if (saveTranscriptHeaderBtn) {
        saveTranscriptHeaderBtn.style.display = 'flex';
      }

      // Show success indicator briefly
      const transcriptText = document.getElementById('transcriptText');
      if (transcriptText) {
        transcriptText.style.animation = 'fadeIn 0.5s ease-out';
      }

      // Generate AI summary
      await generateTranscriptSummary();

    } else {
      throw new Error('Empty transcript returned');
    }

  } catch (transcriptionError) {
    console.error('❌ Transcription failed:', transcriptionError);
    console.error('Error details:', transcriptionError.name, transcriptionError.message);

    if (transcriptionStatus) {
      transcriptionStatus.textContent = 'No speech detected';
    }

    // Check if it's an empty transcript error (likely no speech in audio)
    const isEmptyTranscript = transcriptionError.message.includes('Empty transcript');

    if (isEmptyTranscript) {
      // Show user-friendly "no speech detected" message
      if (transcriptEmpty) {
        transcriptEmpty.innerHTML = `
          <div style="text-align: center; max-width: 400px; margin: 0 auto; padding: 2rem;">
            <div style="font-size: 1.125rem; font-weight: 600; color: #18181b; margin-bottom: 0.75rem; letter-spacing: -0.01em;">No Speech Detected</div>
            <div style="font-size: 0.9375rem; color: #71717a; line-height: 1.6; margin-bottom: 2rem;">
              We recorded ${audioSizeMB} MB of audio, but couldn't detect any speech in it.
            </div>
            <div style="text-align: left; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
              <div style="font-size: 0.8125rem; font-weight: 600; color: #18181b; margin-bottom: 1rem;">This could be because:</div>
              <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
                <div style="width: 4px; height: 4px; background: #f59e0b; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
                <div>
                  <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">The audio was music or sounds only</div>
                  <div style="font-size: 0.8125rem; color: #71717a;">Transcription works best with clear speech</div>
                </div>
              </div>
              <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
                <div style="width: 4px; height: 4px; background: #f59e0b; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
                <div>
                  <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">Audio quality was too low</div>
                  <div style="font-size: 0.8125rem; color: #71717a;">Background noise or poor quality can affect detection</div>
                </div>
              </div>
              <div style="display: flex; gap: 0.75rem;">
                <div style="width: 4px; height: 4px; background: #f59e0b; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></div>
                <div>
                  <div style="font-weight: 600; font-size: 0.875rem; color: #18181b; margin-bottom: 0.25rem;">Speech was in another language</div>
                  <div style="font-size: 0.8125rem; color: #71717a;">Currently optimized for English speech</div>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <button onclick="hideTranscriptionPage()" style="display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: white; color: #18181b; border: 2px solid #e4e4e7; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#d4d4d8'; this.style.boxShadow='0 4px 8px rgba(0, 0, 0, 0.06)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#e4e4e7'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.02)'">
                Try Again
              </button>
              ${audioSizeMB > 0 ? `
              <button onclick="downloadAudioRecording()" style="display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)'">
                Download Audio
              </button>
              ` : ''}
            </div>
          </div>
        `;
      }
    } else {
      // Show generic error message for other types of errors
      const errorMessage = `
        <div style="text-align: center; max-width: 400px; margin: 0 auto; padding: 2rem;">
          <div style="font-size: 1.125rem; font-weight: 600; color: #18181b; margin-bottom: 0.75rem; letter-spacing: -0.01em;">Transcription Failed</div>
          <div style="font-size: 0.9375rem; color: #71717a; line-height: 1.6; margin-bottom: 2rem;">
            ${transcriptionError.message}
          </div>
          <div style="text-align: left; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
            <div style="font-size: 0.8125rem; font-weight: 600; color: #18181b; margin-bottom: 0.75rem;">The Prompt API audio transcription is experimental</div>
            <div style="font-size: 0.8125rem; color: #71717a; line-height: 1.6; margin-bottom: 1rem;">
              Your audio was recorded (${audioSizeMB} MB). You can download it and use external transcription services:
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8125rem; color: #18181b;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 4px; height: 4px; background: #3b82f6; border-radius: 50%;"></div>
                <div><strong>OpenAI Whisper</strong> - Free, excellent quality</div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 4px; height: 4px; background: #3b82f6; border-radius: 50%;"></div>
                <div><strong>Google Speech-to-Text</strong> - Accurate, multiple languages</div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 4px; height: 4px; background: #3b82f6; border-radius: 50%;"></div>
                <div><strong>Otter.ai</strong> - Easy to use, good for meetings</div>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <button onclick="hideTranscriptionPage()" style="display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: white; color: #18181b; border: 2px solid #e4e4e7; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#d4d4d8'; this.style.boxShadow='0 4px 8px rgba(0, 0, 0, 0.06)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#e4e4e7'; this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.02)'">
              Close
            </button>
            ${audioSizeMB > 0 ? `
            <button onclick="downloadAudioRecording()" style="display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); color: white; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(24, 24, 27, 0.2); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(24, 24, 27, 0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(24, 24, 27, 0.2)'">
              Download Audio
            </button>
            ` : ''}
          </div>
        </div>
      `;

      updateTranscriptDisplay(errorMessage);
    }

    // Don't reset state yet - let user click buttons (Try Again / Download Audio)
  }
}

/**
 * Save transcript
 */
async function saveTranscript() {
  try {
    const duration = Date.now() - transcriptionStartTime;
    const wordCount = currentTranscript.trim().split(/\s+/).length;

    console.log(`📝 Transcription complete: ${wordCount} words, ${(duration / 1000).toFixed(0)}s`);

    if (!currentTranscript.trim()) {
      alert('No transcript generated.\n\nMake sure:\n• The tab was playing audio with speech\n• Audio transcription is supported in your Chrome version');
      resetTranscriptionState();
      return;
    }

    // Create transcript object
    const transcript = {
      id: Date.now(),
      timestamp: transcriptionStartTime,
      duration: duration,
      tabTitle: transcriptionTabTitle,
      text: currentTranscript.trim(),
      wordCount: wordCount,
      type: 'transcript'
    };

    // Save to storage
    const storageKey = `transcript_${transcript.id}`;
    await chrome.storage.local.set({ [storageKey]: transcript });

    console.log('✅ Transcript saved:', storageKey);

    // Show success message with option to download
    const userWantsDownload = confirm(
      `Transcription complete!\n\n` +
      `Duration: ${(duration / 1000).toFixed(0)}s\n` +
      `Words: ${wordCount}\n\n` +
      `Would you like to download the transcript as a text file?`
    );

    if (userWantsDownload) {
      downloadTranscript(transcript);
    }

  } catch (error) {
    console.error('Failed to save transcript:', error);
    alert('Failed to save transcript: ' + error.message);
  } finally {
    resetTranscriptionState();
  }
}

/**
 * Download audio recording
 */
function downloadAudioRecording() {
  if (!audioChunks || audioChunks.length === 0) {
    console.error('No audio chunks to download');
    return;
  }

  console.log('📥 Downloading audio recording...');

  // Create blob from audio chunks
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  const url = URL.createObjectURL(audioBlob);

  // Create download link
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;

  // Create filename with tab title and timestamp
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 5).replace(':', '-');
  const sanitizedTitle = transcriptionTabTitle ? transcriptionTabTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 50) : 'recording';
  a.download = `${sanitizedTitle}_${dateStr}_${timeStr}.webm`;

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  console.log('📥 Audio downloaded:', a.download);
}

/**
 * Download transcript as text file
 */
function downloadTranscript(transcript) {
  const content = `Tab: ${transcript.tabTitle}\n` +
    `Date: ${new Date(transcript.timestamp).toLocaleString()}\n` +
    `Duration: ${(transcript.duration / 1000).toFixed(0)} seconds\n` +
    `Words: ${transcript.wordCount}\n\n` +
    `--- TRANSCRIPT ---\n\n` +
    `${transcript.text}\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;

  // Create filename
  const timeStr = new Date(transcript.timestamp).toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const cleanTitle = transcript.tabTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
  a.download = `transcript_${cleanTitle}_${timeStr}.txt`;

  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);

  console.log('📥 Transcript downloaded:', a.download);
}

/**
 * Show transcription page
 */
function showTranscriptionPage(tabTitle) {
  const transcriptionContainer = document.getElementById('transcriptionContainer');
  const transcriptionStatus = document.getElementById('transcriptionStatus');
  const transcriptEmpty = document.querySelector('.transcript-empty');
  const transcriptText = document.getElementById('transcriptText');
  const transcriptSummary = document.getElementById('transcriptSummary');
  const transcriptActions = document.getElementById('transcriptActions');

  // Check if elements exist
  if (!transcriptionContainer || !transcriptionStatus || !transcriptEmpty || !transcriptText || !transcriptSummary) {
    console.error('Transcription page elements not found');
    return;
  }

  // Set status to show tab name
  transcriptionStatus.textContent = `Transcribing: ${tabTitle}`;

  // Reset display
  transcriptEmpty.style.display = 'flex';
  transcriptText.style.display = 'none';
  transcriptText.textContent = '';
  transcriptSummary.style.display = 'none';

  // Show transcription page
  transcriptionContainer.style.display = 'flex';

  // Start timer
  updateTranscriptionTimer();
}

/**
 * Hide transcription page
 */
function hideTranscriptionPage() {
  const transcriptionContainer = document.getElementById('transcriptionContainer');
  transcriptionContainer.style.display = 'none';

  // Reset transcription state when hiding
  resetTranscriptionState();
}

/**
 * Open saved transcript viewer
 */
function openTranscriptViewer(transcript) {
  const transcriptionContainer = document.getElementById('transcriptionContainer');
  const transcriptionStatus = document.getElementById('transcriptionStatus');
  const transcriptEmpty = document.querySelector('.transcript-empty');
  const transcriptText = document.getElementById('transcriptText');
  const transcriptSummary = document.getElementById('transcriptSummary');
  const summaryText = document.getElementById('summaryText');
  const transcriptTabs = document.getElementById('transcriptTabs');
  const transcriptTabContent = document.getElementById('transcriptTabContent');
  const summaryTabContent = document.getElementById('summaryTabContent');

  // Set global variable for action pills to work
  currentTranscript = transcript.text || '';
  transcriptionTabTitle = transcript.tabTitle || 'Audio Transcript';

  // Show transcription container
  transcriptionContainer.style.display = 'flex';

  // Update status
  if (transcriptionStatus) {
    transcriptionStatus.textContent = 'Complete with AI summary';
  }

  // Hide empty state, show transcript
  if (transcriptEmpty) transcriptEmpty.style.display = 'none';
  if (transcriptText) {
    transcriptText.style.display = 'block';
    transcriptText.textContent = transcript.text || 'No transcript available';
  }

  // Show tabs
  if (transcriptTabs) {
    transcriptTabs.style.display = 'flex';
  }

  // Show save button
  const saveTranscriptHeaderBtn = document.getElementById('saveTranscriptHeaderBtn');
  if (saveTranscriptHeaderBtn) {
    saveTranscriptHeaderBtn.style.display = 'flex';
  }

  // Show transcript tab by default
  if (transcriptTabContent) transcriptTabContent.style.display = 'block';
  if (summaryTabContent) summaryTabContent.style.display = 'none';

  // Show summary if available
  if (transcript.summary && transcriptSummary && summaryText) {
    transcriptSummary.style.display = 'block';
    summaryText.textContent = transcript.summary;
  }

  console.log('📖 Opened saved transcript:', transcript.id);
}

/**
 * Update transcript display in real-time
 */
function updateTranscriptDisplay(transcript) {
  const transcriptEmpty = document.querySelector('.transcript-empty');
  const transcriptText = document.getElementById('transcriptText');
  // Hide empty state, show transcript
  if (transcript.trim()) {
    transcriptEmpty.style.display = 'none';
    transcriptText.style.display = 'block';

    // Check if transcript contains HTML (for error messages)
    if (transcript.includes('<div') || transcript.includes('<br>')) {
      transcriptText.innerHTML = transcript;
    } else {
      transcriptText.textContent = transcript;
    }

    // Auto-scroll to bottom
    transcriptText.scrollTop = transcriptText.scrollHeight;
  }
}

/**
 * Update transcription timer
 */
function updateTranscriptionTimer() {
  if (!isTranscribing) return;

  const transcriptDuration = document.getElementById('transcriptDuration');
  const elapsed = Math.floor((Date.now() - transcriptionStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  transcriptDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Continue updating
  setTimeout(updateTranscriptionTimer, 1000);
}

/**
 * Generate AI summary of transcript
 */
async function generateTranscriptSummary() {
  const transcriptionStatus = document.getElementById('transcriptionStatus');
  const transcriptSummary = document.getElementById('transcriptSummary');
  const summaryText = document.getElementById('summaryText');

  try {
    if (!currentTranscript.trim()) {
      if (transcriptionStatus) {
        transcriptionStatus.textContent = 'No transcript to summarize';
      }
      return;
    }

    // Check if AI is available
    if (typeof window.LanguageModel === 'undefined') {
      console.log('⚠️ AI not available for summary');
      if (transcriptSummary && summaryText) {
        transcriptSummary.style.display = 'block';
        summaryText.innerHTML = '<p>✅ Transcription complete! Your transcript is ready to download.</p>';
      }
      return;
    }

    // Update status
    if (transcriptionStatus) {
      transcriptionStatus.textContent = 'Generating AI summary...';
    }
    if (transcriptSummary && summaryText) {
      transcriptSummary.style.display = 'block';
      summaryText.innerHTML = '<div class="chat-loading"><div class="chat-loading-dot"></div><div class="chat-loading-dot"></div><div class="chat-loading-dot"></div></div>';
    }

    // Use existing AI session or create new one
    let summarySession = aiSession;
    if (!summarySession) {
      summarySession = await window.LanguageModel.create({
        expectedOutputs: [{ type: 'text', languages: ['en'] }]
      });
    }

    // Generate summary
    const summary = await summarySession.prompt(
      `Summarize the following transcript in 2-3 concise sentences. Focus on the main points and key takeaways:\n\n${currentTranscript}`
    );

    // Display summary
    if (summaryText) {
      summaryText.textContent = summary;
    }
    if (transcriptionStatus) {
      transcriptionStatus.textContent = 'Complete with AI summary';
    }

    console.log('✅ AI summary generated');

  } catch (error) {
    console.error('Failed to generate summary:', error);
    if (summaryText) {
      summaryText.textContent = '✅ Transcription complete! Your transcript is ready to download.';
    }
    if (transcriptionStatus) {
      transcriptionStatus.textContent = 'Transcription complete';
    }
  }
}

/**
 * Save transcript with summary
 */
async function saveTranscriptWithSummary(summary) {
  try {
    const duration = Date.now() - transcriptionStartTime;
    const wordCount = currentTranscript.trim().split(/\s+/).length;

    console.log(`📝 Transcription complete: ${wordCount} words, ${(duration / 1000).toFixed(0)}s`);

    // Create transcript object with summary
    const transcript = {
      id: Date.now(),
      timestamp: transcriptionStartTime,
      duration: duration,
      tabTitle: transcriptionTabTitle,
      text: currentTranscript.trim(),
      summary: summary,
      wordCount: wordCount,
      type: 'transcript'
    };

    // Save to storage
    const storageKey = `transcript_${transcript.id}`;
    await chrome.storage.local.set({ [storageKey]: transcript });

    console.log('✅ Transcript saved with summary:', storageKey);

  } catch (error) {
    console.error('Failed to save transcript:', error);
  } finally {
    resetTranscriptionState();
  }
}

/**
 * Handle transcript query
 */
async function handleTranscriptQuery() {
  try {
    const transcriptQuery = document.getElementById('transcriptQuery');
    const query = transcriptQuery?.value.trim();

    if (!query) return;

    // Check if AI is available
    if (typeof window.LanguageModel === 'undefined') {
      alert('AI not available. Please check Prompt API settings.');
      return;
    }

    // Show loading state
    const summaryText = document.getElementById('summaryText');
    if (summaryText) {
      summaryText.innerHTML = '<div class="chat-loading"><div class="chat-loading-dot"></div><div class="chat-loading-dot"></div><div class="chat-loading-dot"></div></div>';
    }

    // Switch to summary tab
    const summaryTab = document.querySelector('[data-tab="summary"]');
    const transcriptTab = document.querySelector('[data-tab="transcript"]');
    const transcriptTabContent = document.getElementById('transcriptTabContent');
    const summaryTabContent = document.getElementById('summaryTabContent');

    if (summaryTab) {
      transcriptTab?.classList.remove('active');
      summaryTab.classList.add('active');
      if (transcriptTabContent) transcriptTabContent.style.display = 'none';
      if (summaryTabContent) summaryTabContent.style.display = 'block';
    }

    // Create AI session
    const querySession = await window.LanguageModel.create({
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    // Generate response
    const response = await querySession.prompt(
      `Based on this transcript, answer the following question:\n\nQuestion: ${query}\n\nTranscript:\n${currentTranscript}`
    );

    // Update summary with response (render as markdown)
    if (summaryText) {
      summaryText.innerHTML = parseMarkdown(response);
    }

    // Clear input
    transcriptQuery.value = '';

    // Cleanup
    if (querySession && querySession.destroy) {
      querySession.destroy();
    }

    console.log('✅ Query answered successfully');

  } catch (error) {
    console.error('Failed to answer query:', error);
    const summaryText = document.getElementById('summaryText');
    if (summaryText) {
      summaryText.textContent = 'Failed to answer query. Please try again.';
    }
  }
}

/**
 * Handle action pill clicks
 */
async function handleActionPill(promptPrefix, actionType) {
  try {
    // Check if AI is available
    if (typeof window.LanguageModel === 'undefined') {
      alert('AI not available. Please check Prompt API settings.');
      return;
    }

    // Show loading state
    const summaryText = document.getElementById('summaryText');
    if (summaryText) {
      summaryText.innerHTML = '<div class="chat-loading"><div class="chat-loading-dot"></div><div class="chat-loading-dot"></div><div class="chat-loading-dot"></div></div>';
    }

    // Create AI session
    const actionSession = await window.LanguageModel.create({
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    });

    // Generate response
    const response = await actionSession.prompt(
      `${promptPrefix}:\n\n${currentTranscript}`
    );

    // Update summary with response (render as markdown)
    if (summaryText) {
      summaryText.innerHTML = parseMarkdown(response);
    }

    // Cleanup
    if (actionSession && actionSession.destroy) {
      actionSession.destroy();
    }

    console.log(`✅ ${actionType} generated successfully`);

  } catch (error) {
    console.error(`Failed to generate ${actionType}:`, error);
    const summaryText = document.getElementById('summaryText');
    if (summaryText) {
      summaryText.textContent = `Failed to generate ${actionType}. Please try again.`;
    }
  }
}

/**
 * Reset transcription state
 */
function resetTranscriptionState() {
  isTranscribing = false;
  audioStream = null;
  mediaRecorder = null;
  audioChunks = [];
  transcriptionStartTime = null;
  transcriptionTabTitle = null;
  currentTranscript = '';

  // Destroy Prompt API session
  if (transcriptionSession) {
    try {
      if (typeof transcriptionSession.destroy === 'function') {
        transcriptionSession.destroy();
      }
    } catch (e) {
      console.log('Error destroying session:', e);
    }
    transcriptionSession = null;
  }

  // Update UI
  recordMeetingBtn.classList.remove('recording');
  recordMeetingBtn.title = 'Transcribe Tab Audio';
}

/**
 * Open save transcript modal
 */
function openSaveTranscriptModal() {
  const modal = document.getElementById('saveTranscriptModal');
  const nameInput = document.getElementById('transcriptName');
  const tagPills = document.querySelectorAll('.tag-pill');

  // Pre-fill with tab title
  if (nameInput) {
    nameInput.value = transcriptionTabTitle || '';
  }

  // Reset tag selection
  tagPills.forEach(pill => pill.classList.remove('active'));

  // Show modal
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Close save transcript modal
 */
function closeSaveTranscriptModal() {
  const modal = document.getElementById('saveTranscriptModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Save transcript with metadata
 */
async function saveTranscriptWithMetadata() {
  const nameInput = document.getElementById('transcriptName');
  const selectedTag = document.querySelector('.tag-pill.active');

  const name = nameInput?.value.trim() || transcriptionTabTitle || 'Untitled Transcript';
  const tag = selectedTag?.dataset.tag || 'other';

  try {
    // Get the current summary if available
    const summaryText = document.getElementById('summaryText');
    const summary = summaryText?.textContent || '';

    const transcript = {
      id: Date.now(),
      timestamp: transcriptionStartTime || Date.now(),
      duration: Date.now() - (transcriptionStartTime || Date.now()),
      tabTitle: name,
      text: currentTranscript.trim(),
      summary: summary,
      wordCount: currentTranscript.trim().split(/\s+/).length,
      type: 'transcript',
      tag: tag,
      customName: name !== transcriptionTabTitle // Track if user renamed it
    };

    // Save to storage
    const storageKey = `transcript_${transcript.id}`;
    await chrome.storage.local.set({ [storageKey]: transcript });

    console.log('✅ Transcript saved with metadata:', storageKey, { name, tag });

    // Close modal
    closeSaveTranscriptModal();

    // Show success feedback
    alert('Transcript saved successfully!');

  } catch (error) {
    console.error('Failed to save transcript:', error);
    alert('Failed to save transcript. Please try again.');
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Listen for storage changes to auto-refresh timeline when new screenshots are captured
let refreshTimeout;
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    // Check if any screenshot was added (keys starting with 'screenshot_')
    const hasNewScreenshot = Object.keys(changes).some(key =>
      key.startsWith('screenshot_') && changes[key].newValue
    );

    // Check if any transcript was added
    const hasNewTranscript = Object.keys(changes).some(key =>
      key.startsWith('transcript_') && changes[key].newValue
    );

    // Reload the current mode if new content was added
    if (hasNewScreenshot || hasNewTranscript) {
      console.log('BrowseBack: New content detected, refreshing view...');

      // Debounce refresh to avoid multiple rapid updates
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        // Save current scroll position
        const resultsContainer = document.getElementById('resultsContainer');
        const scrollPosition = resultsContainer?.scrollTop || 0;

        // Only refresh if we're in browse or search mode (not during a chat)
        if (currentMode === 'browse') {
          loadBrowseMode().then(() => {
            // Restore scroll position after a brief delay to let content render
            setTimeout(() => {
              if (resultsContainer) {
                resultsContainer.scrollTop = scrollPosition;
              }
            }, 100);
          });
        } else if (currentMode === 'search' && currentResults.length > 0) {
          // Reload search mode to show new items
          loadSearchMode().then(() => {
            // Restore scroll position
            setTimeout(() => {
              if (resultsContainer) {
                resultsContainer.scrollTop = scrollPosition;
              }
            }, 100);
          });
        }
      }, 500); // Wait 500ms before refreshing to batch multiple changes
    }
  }
});

// Listen for direct messages from background when new captures are added
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureAdded') {
    console.log('BrowseBack: New capture added notification received');

    // Debounce refresh to avoid multiple rapid updates
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      // Save current scroll position
      const resultsContainer = document.getElementById('resultsContainer');
      const scrollPosition = resultsContainer?.scrollTop || 0;

      // Only refresh if we're in browse or search mode
      if (currentMode === 'browse') {
        loadBrowseMode().then(() => {
          // Restore scroll position after a brief delay to let content render
          setTimeout(() => {
            if (resultsContainer) {
              resultsContainer.scrollTop = scrollPosition;
            }
          }, 100);
        });
      } else if (currentMode === 'search' && currentResults.length > 0) {
        loadSearchMode().then(() => {
          // Restore scroll position
          setTimeout(() => {
            if (resultsContainer) {
              resultsContainer.scrollTop = scrollPosition;
            }
          }, 100);
        });
      }
    }, 300); // Shorter delay since this is a direct notification
  }
});
