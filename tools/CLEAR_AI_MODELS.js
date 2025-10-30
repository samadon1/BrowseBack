// Add this function to popup.js if you want to provide a "clear everything" option

/**
 * Clear all data and destroy AI sessions (models stay but memory is freed)
 */
async function clearEverythingIncludingAI() {
  const confirmed = confirm(
    '⚠️ COMPLETE DATA RESET ⚠️\n\n' +
    'This will:\n' +
    '✓ Delete all captures and transcripts\n' +
    '✓ Clear all search history\n' +
    '✓ Destroy AI sessions (free memory)\n' +
    '✓ Reset all settings\n\n' +
    'This will NOT delete (Chrome manages these):\n' +
    '✗ Downloaded AI models (~1.8GB)\n' +
    '✗ Model files in Chrome storage\n\n' +
    'To fully remove AI models:\n' +
    '1. Go to chrome://settings/content/all\n' +
    '2. Search for "browseback" or your extension\n' +
    '3. Clear site data\n' +
    'OR\n' +
    '1. Go to chrome://components\n' +
    '2. Find "Optimization Guide On Device Model"\n' +
    '3. Wait for Chrome to auto-clean (may take days)\n\n' +
    'Continue with data reset?'
  );

  if (!confirmed) return;

  try {
    // 1. Destroy AI sessions (free memory)
    console.log('🧹 Destroying AI sessions...');

    // Destroy global AI session if exists
    if (window.aiSession) {
      try {
        window.aiSession.destroy();
        window.aiSession = null;
        console.log('✅ AI session destroyed');
      } catch (e) {
        console.log('⚠️ AI session already destroyed or invalid');
      }
    }

    // Destroy proofreader session if exists
    if (window.proofreaderSession) {
      try {
        window.proofreaderSession.destroy();
        window.proofreaderSession = null;
        console.log('✅ Proofreader session destroyed');
      } catch (e) {
        console.log('⚠️ Proofreader session already destroyed or invalid');
      }
    }

    // 2. Clear all extension data
    console.log('🗑️ Clearing all extension data...');
    await chrome.runtime.sendMessage({ action: 'deleteAll' });

    // 3. Clear any cached sessions in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    // 4. Reset UI
    await loadStats();
    showState('empty');

    // 5. Show completion message with manual instructions
    alert(
      '✅ Reset Complete!\n\n' +
      'All data cleared and AI sessions destroyed.\n\n' +
      'Note: AI models remain downloaded (Chrome manages them).\n\n' +
      'To manually remove models:\n' +
      '• Clear Chrome cache: chrome://settings/privacy\n' +
      '• Or wait for Chrome to auto-clean unused models'
    );

    // 6. Reload extension to fresh state
    setTimeout(() => {
      location.reload();
    }, 1000);

  } catch (error) {
    console.error('Reset failed:', error);
    alert('Failed to reset. Error: ' + error.message);
  }
}

/**
 * Alternative: Provide instructions for manual model deletion
 */
function showModelDeletionGuide() {
  const guide = `
📚 HOW TO DELETE AI MODELS MANUALLY

The AI models (~1.8GB) are managed by Chrome and cannot be deleted programmatically.

OPTION 1: Clear Site Data
1. Open: chrome://settings/content/all
2. Search for this extension
3. Click "Clear data"

OPTION 2: Clear Chrome Cache
1. Open: chrome://settings/privacy
2. Click "Clear browsing data"
3. Select "Cached images and files"
4. Clear data

OPTION 3: Wait for Auto-Cleanup
Chrome automatically removes unused models after 30 days of inactivity.

OPTION 4: Check Components
1. Open: chrome://components
2. Find "Optimization Guide On Device Model"
3. Note the version and storage location

ADVANCED: Manual File Deletion (Windows)
%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\OptimizationGuidePredictionModels\\

ADVANCED: Manual File Deletion (Mac)
~/Library/Application Support/Google/Chrome/Default/OptimizationGuidePredictionModels/

⚠️ WARNING: Manual deletion may affect other Chrome AI features!
`;

  // Create a modal or new window with the guide
  const guideWindow = window.open('', 'Model Deletion Guide', 'width=600,height=700');
  guideWindow.document.write(`
    <html>
    <head>
      <title>AI Model Deletion Guide</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 20px;
          line-height: 1.6;
          background: #1a1a1a;
          color: #e0e0e0;
        }
        pre {
          background: #2a2a2a;
          padding: 15px;
          border-radius: 8px;
          white-space: pre-wrap;
        }
        h1 { color: #4CAF50; }
        code {
          background: #333;
          padding: 2px 6px;
          border-radius: 3px;
          color: #4CAF50;
        }
      </style>
    </head>
    <body>
      <h1>AI Model Management</h1>
      <pre>${guide}</pre>
      <button onclick="window.close()" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 20px;
      ">Close Guide</button>
    </body>
    </html>
  `);
}

// Usage: Add buttons in your settings panel
/*
<button onclick="clearEverythingIncludingAI()">
  🧹 Complete Reset (Clear Data + Sessions)
</button>

<button onclick="showModelDeletionGuide()">
  ℹ️ How to Delete AI Models
</button>
*/