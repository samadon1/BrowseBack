// Add this to your popup.js for easy splash screen testing

/**
 * Developer Testing Configuration
 * Set these flags to test different splash screen states
 */
const DEV_CONFIG = {
  // Set to true to always show splash screen
  FORCE_SPLASH: false,

  // Simulate different AI states:
  // 'api_not_available', 'not_available', 'downloadable', 'downloading', 'available'
  SIMULATE_STATE: null,

  // Skip auto-download for testing
  SKIP_AUTO_DOWNLOAD: false,

  // Add delay to simulate slow checks (milliseconds)
  SIMULATE_DELAY: 0
};

// Check URL parameters for testing
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('test')) {
  DEV_CONFIG.FORCE_SPLASH = true;
  DEV_CONFIG.SIMULATE_STATE = urlParams.get('state') || 'downloadable';
}

/**
 * Modified initializeSplash for testing
 */
async function initializeSplashWithTesting() {
  // ... your existing splash initialization code ...

  // Developer mode override
  if (DEV_CONFIG.FORCE_SPLASH) {
    console.log('🔧 DEVELOPER MODE: Forcing splash screen');
    console.log('   State:', DEV_CONFIG.SIMULATE_STATE);

    // Add artificial delay if configured
    if (DEV_CONFIG.SIMULATE_DELAY > 0) {
      await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.SIMULATE_DELAY));
    }

    // Simulate different states for testing
    switch (DEV_CONFIG.SIMULATE_STATE) {
      case 'api_not_available':
        splashCheckAPI.innerHTML = '<span class="error-icon">✕</span>';
        splashAPIText.textContent = 'API not available - Enable chrome://flags';
        splashActions.style.display = 'flex';
        splashSetup.style.display = 'inline-flex';
        break;

      case 'not_available':
        splashCheckAPI.innerHTML = '<span class="check-icon">✓</span>';
        splashAPIText.textContent = 'API available';
        splashModelStatus.style.display = 'flex';
        splashCheckModel.innerHTML = '<span class="error-icon">✕</span>';
        splashModelText.textContent = 'Model not supported on this device';
        splashActions.style.display = 'flex';
        break;

      case 'downloadable':
        splashCheckAPI.innerHTML = '<span class="check-icon">✓</span>';
        splashAPIText.textContent = 'API available';
        splashModelStatus.style.display = 'flex';
        splashCheckModel.innerHTML = '<span class="warning-icon">⚠</span>';
        splashModelText.textContent = 'Models not downloaded';
        splashActions.style.display = 'flex';
        splashDownload.style.display = 'inline-flex';

        if (!DEV_CONFIG.SKIP_AUTO_DOWNLOAD) {
          // Allow actual download in test mode
          splashDownload.onclick = async () => {
            console.log('🔧 TEST: Simulating download...');
            splashDownloadStatus.style.display = 'flex';

            // Simulate download progress
            for (let i = 0; i <= 100; i += 10) {
              splashProgress.style.width = `${i}%`;
              splashProgressText.textContent = `${i}%`;
              splashDownloadText.textContent = `Downloading AI model... ${i}%`;
              await new Promise(resolve => setTimeout(resolve, 200));
            }

            splashDownloadText.textContent = 'Download complete!';
            setTimeout(() => {
              splashScreen.style.display = 'none';
              mainApp.style.display = 'flex';
            }, 1000);
          };
        }
        break;

      case 'downloading':
        splashCheckAPI.innerHTML = '<span class="check-icon">✓</span>';
        splashAPIText.textContent = 'API available';
        splashModelStatus.style.display = 'flex';
        splashCheckModel.innerHTML = '<span class="loading-icon">⏳</span>';
        splashModelText.textContent = 'Model downloading...';
        splashDownloadStatus.style.display = 'flex';

        // Simulate active download
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          splashProgress.style.width = `${progress}%`;
          splashProgressText.textContent = `${progress}%`;
          if (progress >= 100) {
            clearInterval(interval);
            splashDownloadText.textContent = 'Download complete!';
          }
        }, 500);
        break;

      case 'available':
      default:
        splashCheckAPI.innerHTML = '<span class="check-icon">✓</span>';
        splashAPIText.textContent = 'API available';
        splashModelStatus.style.display = 'flex';
        splashCheckModel.innerHTML = '<span class="check-icon">✓</span>';
        splashModelText.textContent = 'Models ready';
        splashActions.style.display = 'flex';
        splashContinue.style.display = 'inline-flex';
        break;
    }

    return; // Skip actual AI checks
  }

  // Normal initialization continues here...
  await checkAIAvailability();
}

/**
 * Testing URLs - Add these to your README or testing docs
 *
 * Test API not available:
 * chrome-extension://[id]/popup/popup.html?test=1&state=api_not_available
 *
 * Test models downloadable:
 * chrome-extension://[id]/popup/popup.html?test=1&state=downloadable
 *
 * Test downloading state:
 * chrome-extension://[id]/popup/popup.html?test=1&state=downloading
 *
 * Test everything ready:
 * chrome-extension://[id]/popup/popup.html?test=1&state=available
 */

// Quick testing helper for console
window.testSplash = (state = 'downloadable') => {
  DEV_CONFIG.FORCE_SPLASH = true;
  DEV_CONFIG.SIMULATE_STATE = state;
  location.reload();
};

console.log(`
🔧 SPLASH SCREEN TESTING ENABLED
Use these commands in console:
- testSplash('api_not_available')
- testSplash('downloadable')
- testSplash('downloading')
- testSplash('available')

Or use URL parameters:
?test=1&state=downloadable
`);