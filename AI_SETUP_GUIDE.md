# Chrome Built-in AI Setup Guide

## Current Issue

You're seeing: **"Failed to generate AI answer. The Prompt API may not be fully available yet."**

This means Chrome's built-in AI needs to be set up first.

## Quick Setup (5 Steps)

### Step 1: Check Chrome Version
You need **Chrome Dev (130+)** or **Chrome Canary**

**Check your version:**
1. Open Chrome
2. Go to `chrome://version`
3. Look for version number

**Need to update?**
- Download Chrome Dev: https://www.google.com/chrome/dev/
- Or Chrome Canary: https://www.google.com/chrome/canary/

### Step 2: Enable the Chrome Flag

1. **Open:** `chrome://flags/#prompt-api-for-gemini-nano`
2. **Set to:** "Enabled"
3. **Click:** "Relaunch" button at bottom
4. **Wait:** Chrome will restart

### Step 3: Check If Model Needs Download

1. **Open:** `chrome://components`
2. **Find:** "Optimization Guide On Device Model"
3. **Look at version:**
   - If version is `0.0.0.0` → Model not downloaded
   - If version is `2024.10.x.x` → Model downloaded ✅

### Step 4: Download the AI Model (if needed)

If version shows `0.0.0.0`:

1. **Click:** "Check for update" button next to it
2. **Wait:** ~5-10 minutes for 1.7GB download
3. **Refresh** the `chrome://components` page
4. **Verify:** Version changed to `2024.10.x.x`

**Alternative method:**
1. Open DevTools Console (F12)
2. Run this code:
```javascript
const session = await window.ai.languageModel.create();
console.log('Model downloaded!');
```
3. This will trigger download if needed
4. Wait for progress in chrome://components

### Step 5: Verify Setup

1. **Reload BrowseBack extension** (chrome://extensions)
2. **Open console** when extension opens
3. **Look for:**
   ```
   🔍 Prompt API availability: readily
   ✅ BrowseBack: Prompt API ready! AI answers enabled.
   ```

## Troubleshooting

### "Prompt API not yet available"

**Problem:** Flag not enabled

**Solution:**
```
1. chrome://flags/#prompt-api-for-gemini-nano
2. Set to "Enabled"
3. Relaunch Chrome
```

### "AI model not available"

**Problem:** System requirements not met

**Check:**
- ✓ 22GB+ free disk space
- ✓ 4GB+ GPU VRAM or 16GB RAM
- ✓ Desktop (not mobile/tablet)
- ✓ Windows 10/11, macOS 13+, or Linux

### "after-download" status

**Problem:** Model not downloaded yet

**Solution:**
```
1. chrome://components
2. Find "Optimization Guide On Device Model"
3. Click "Check for update"
4. Wait 5-10 minutes
5. Reload extension
```

### Model won't download

**Try:**
1. Make sure you have 22GB+ free space
2. Use unmetered WiFi connection
3. Check firewall isn't blocking
4. Try Chrome Canary instead of Dev
5. Restart Chrome completely

### Still not working?

**Debug checklist:**
```javascript
// Run in DevTools console:

// 1. Check if API exists
console.log('API exists:', !!window.ai?.languageModel);

// 2. Check availability
const avail = await window.ai.languageModel.availability();
console.log('Availability:', avail);

// 3. Check capabilities
const caps = await window.ai.languageModel.capabilities();
console.log('Capabilities:', caps);

// 4. Try creating session
const session = await window.ai.languageModel.create();
console.log('Session created!', session);
```

## System Requirements

### Minimum:
- **OS:** Windows 10/11, macOS 13+, Linux, ChromeOS
- **Chrome:** Dev 130+ or Canary
- **Storage:** 22GB free space
- **RAM:** 16GB (if no GPU)
- **GPU:** 4GB+ VRAM (recommended)

### Recommended:
- **Chrome:** Canary (most up-to-date)
- **Storage:** 30GB+ free
- **RAM:** 16GB+
- **GPU:** 8GB+ VRAM
- **Connection:** Fast, unmetered WiFi

## What Gets Downloaded?

**Model Name:** Gemini Nano
**Size:** ~1.7GB
**Location:** Chrome components folder
**Language Support:** English, Spanish, Japanese
**Offline:** Yes! Works without internet after download

## Verification Commands

### Check availability:
```javascript
const avail = await window.ai.languageModel.availability();
// Should return: "readily"
```

### Test model:
```javascript
const session = await window.ai.languageModel.create();
const result = await session.prompt('Say hello!');
console.log(result); // Should get a response
```

### Monitor download:
```javascript
const session = await window.ai.languageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  }
});
```

## BrowseBack Console Messages

### ✅ Success:
```
🔍 Prompt API availability: readily
✅ BrowseBack: Prompt API ready! AI answers enabled.
```

### 📋 Needs setup:
```
============================================================
🤖 BROWSEBACK AI SETUP GUIDE
============================================================
📋 Setup needed: Enable chrome://flags/#prompt-api-for-gemini-nano

1. Open: chrome://flags/#prompt-api-for-gemini-nano
2. Set to "Enabled"
3. Click "Relaunch" button
4. Reload this extension

📚 More info: chrome://components (check "Optimization Guide On Device Model")
============================================================
```

### 📥 Needs download:
```
============================================================
🤖 BROWSEBACK AI SETUP GUIDE
============================================================
📥 AI model needs to be downloaded first (~1.7GB)

1. Click the 🤖 Ask AI button above
2. Model will start downloading (~1.7GB)
3. Takes 5-10 minutes on fast connection
4. Watch chrome://components for progress

💡 Download happens once, then AI works offline!
============================================================
```

## Demo Without AI

**Don't have time to set up AI for the demo?**

BrowseBack still works great with:
- ✅ **Semantic Search** - TF-IDF embeddings + query expansion
- ✅ **Keyword Search** - Fast, accurate, relevance-ranked
- ✅ **Visual Timeline** - Screenshot-based memory
- ✅ **100% Local** - All processing on-device

You can mention in your demo:
> "AI answers will work once you enable Chrome's Prompt API flag and download the model - the setup takes about 10 minutes but then works completely offline!"

## For Hackathon Submission

### If AI is working:
- ✅ Show natural language questions
- ✅ Show conversational answers
- ✅ Highlight the Prompt API integration

### If AI isn't working yet:
- ✅ Show semantic search (still impressive!)
- ✅ Show keyword search with relevance scoring
- ✅ Explain AI feature in submission text
- ✅ Include screenshots of what AI answers look like

**Note for judges:** The extension works great without AI, but the AI feature adds natural language understanding when Chrome's Prompt API is available.

## Quick Reference Links

- **Chrome flags:** `chrome://flags/#prompt-api-for-gemini-nano`
- **Components:** `chrome://components`
- **Version:** `chrome://version`
- **Extensions:** `chrome://extensions`
- **Official guide:** https://developer.chrome.com/docs/ai/built-in
- **Prompt API docs:** https://developer.chrome.com/docs/ai/prompt-api

## Timeline

**First time setup:**
- Enable flag: 1 minute
- Restart Chrome: 30 seconds
- Download model: 5-10 minutes
- **Total: ~15 minutes**

**After setup:**
- AI works instantly ✅
- No internet required ✅
- Privacy preserved ✅

---

**Questions?** Check the console output when you reload BrowseBack - it will guide you step by step!
