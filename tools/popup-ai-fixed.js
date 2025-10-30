/**
 * CORRECTED AI FUNCTIONS - Based on Official Chrome Docs
 * Replace the existing initializeAI(), startAIModelDownload(), and generateAIAnswer()
 * functions in popup.js with these corrected versions
 */

/**
 * Initialize AI with CORRECT API (LanguageModel)
 */
async function initializeAI() {
  try {
    // Check if API exists (LanguageModel is the correct global per docs)
    if (typeof window.LanguageModel === 'undefined') {
      showAISetupGuide('api_not_available');
      return;
    }

    console.log('✅ LanguageModel API found');

    // Check availability status
    const availability = await window.LanguageModel.availability();
    console.log('🔍 Prompt API availability:', availability);

    // Handle different availability states
    if (availability === 'unavailable') {
      showAISetupGuide('not_available');
      return;
    }

    if (availability === 'downloadable') {
      console.log('📥 AI model can be downloaded. Starting download...');

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
 * Start AI model download (CORRECTED)
 */
async function startAIModelDownload() {
  console.log('⏬ Initiating AI model download...');
  console.log('📊 Monitor progress at: chrome://components');
  console.log('🔍 Look for: "Optimization Guide On Device Model"');

  try {
    // Create a session to trigger download
    const session = await window.LanguageModel.create({
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
    console.error('❌ Failed to download AI model:', error);

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
 * Generate AI answer (CORRECTED)
 */
async function generateAIAnswer(query, results) {
  try {
    // Check if API exists
    if (typeof window.LanguageModel === 'undefined') {
      throw new Error('Prompt API not available');
    }

    // Create AI session if not exists
    if (!aiSession) {
      aiSession = await window.LanguageModel.create({
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
