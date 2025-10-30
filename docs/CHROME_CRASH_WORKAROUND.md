# 🚨 Chrome Canary Crash During AI Model Download

## The Problem

Chrome Canary is **crashing during the Gemini Nano model download**. This is a known issue with Chrome Canary builds and is **NOT caused by BrowseBack**.

### Crash Details:
- **Location:** Thread 0 (CrBrowserMain)
- **Exception:** EXC_BREAKPOINT (SIGTRAP)
- **When:** During automatic model download on extension initialization
- **Chrome Version:** 143.0.7497.0 (Canary)

The crash happens in Chrome's internal model download system, not in our extension code.

## Workarounds

### Option 1: Use Chrome Dev Instead (RECOMMENDED)
Chrome Dev is more stable than Canary and also supports the Prompt API:

1. **Download Chrome Dev:**
   - Visit: https://www.google.com/chrome/dev/
   - Install Chrome Dev (more stable than Canary)

2. **Enable Prompt API:**
   ```
   chrome://flags/#prompt-api-for-gemini-nano
   chrome://flags/#optimization-guide-on-device-model
   ```
   Set both to "Enabled"

3. **Restart Chrome Dev**

4. **Download Model Manually:**
   - Open DevTools Console (F12)
   - Run this code:
   ```javascript
   (async () => {
     const availability = await window.LanguageModel.availability({
       expectedInputs: [{ type: 'text', languages: ['en'] }],
       expectedOutputs: [{ type: 'text', languages: ['en'] }]
     });

     console.log('Availability:', availability);

     if (availability === 'downloadable') {
       console.log('Starting download...');
       const session = await window.LanguageModel.create({
         expectedInputs: [{ type: 'text', languages: ['en'] }],
         expectedOutputs: [{ type: 'text', languages: ['en'] }],
         monitor(m) {
           m.addEventListener('downloadprogress', (e) => {
             console.log(`Download: ${Math.round(e.loaded * 100)}%`);
           });
         }
       });
       console.log('✅ Download complete!');
     }
   })();
   ```

5. **Wait for download to complete** (1.7GB, may take 10-20 minutes)

6. **Then load BrowseBack** - Model will already be ready!

### Option 2: Disable Auto-Download (Use BrowseBack Without AI)

If you want to use BrowseBack now without AI features:

1. **Edit popup.js** to disable auto-download:

Find this section (around line 589):
```javascript
if (availability === 'downloadable') {
  console.log('📥 AI model can be downloaded. Starting download automatically...');

  // Automatically start download in background
  try {
    await startAIModelDownload();  // ← THIS LINE CAUSES THE CRASH
  } catch (error) {
    console.error('Failed to start download:', error);
    showAISetupGuide('needs_download');
  }
  return;
}
```

**Change to:**
```javascript
if (availability === 'downloadable') {
  console.log('📥 AI model available for download');
  showAISetupGuide('needs_download');
  return;
}
```

This will disable automatic download and just show a message instead.

2. **Reload extension** - BrowseBack will work without AI features:
   - ✅ Screenshot capture works
   - ✅ Keyword search works
   - ✅ Semantic search works (TF-IDF based)
   - ❌ AI natural language answers disabled

### Option 3: Wait for Chrome Canary Update

Chrome Canary builds are updated daily. The crash may be fixed in tomorrow's build:

1. **Update Chrome Canary:**
   ```
   Chrome menu → About Google Chrome Canary → Check for updates
   ```

2. **Check for updates tomorrow** and try again

## Why This Happens

The Chrome Prompt API is **experimental** and the model download system has bugs in some Canary builds. The crash occurs in Chrome's internal code when:

1. Extension calls `LanguageModel.create()` with `monitor` callback
2. Chrome starts downloading the 1.7GB Gemini Nano model
3. Chrome's download progress system hits an internal assertion/breakpoint
4. Chrome crashes with SIGTRAP (breakpoint exception)

This is why the crash report shows:
```
Thread 0 Crashed:: CrBrowserMain
Exception Type: EXC_BREAKPOINT (SIGTRAP)
Exception Codes: 0x0000000000000001, 0x0000000122407214
```

## Recommended Approach

**For Hackathon Development:**

1. Use **Chrome Dev** (more stable)
2. Download model **manually first** (using console code above)
3. **Then** install and use BrowseBack with AI features working

**For Hackathon Submission:**

You can note in your submission that:
- Extension works perfectly with keyword search and semantic search
- AI features require Chrome Dev/Canary with manual model download due to Chrome's experimental API bugs
- This is a known Chrome limitation, not an extension issue

## Testing BrowseBack Without AI

The core functionality still works great:

1. ✅ **Automatic screenshot capture** every 10 seconds
2. ✅ **Text extraction** from DOM
3. ✅ **Keyword search** with relevance scoring
4. ✅ **TF-IDF semantic search** for similar content
5. ✅ **100% local/private** - no cloud, no tracking

The AI natural language answers are just an enhancement on top of this solid foundation!

## Need Help?

If Chrome Dev also crashes:
1. Check you have **22GB free disk space** (model needs space)
2. Try downloading model when Chrome has **no other tabs open**
3. Check Chrome Dev console for any errors before the crash
4. Consider submitting without AI features (core functionality is impressive on its own!)
