# 🚀 Enable AI in 3 Minutes

## What You're Seeing

```
❌ "Failed to generate AI answer. The Prompt API may not be fully available yet."
```

## What You Need To Do

### ⚡ Quick Fix (Copy & Paste These URLs)

**Step 1:** Enable the flag
```
chrome://flags/#prompt-api-for-gemini-nano
```
→ Set to "Enabled" → Click "Relaunch"

**Step 2:** Check if model is downloaded
```
chrome://components
```
→ Find "Optimization Guide On Device Model"
→ If version is `0.0.0.0`, click "Check for update"

**Step 3:** Reload BrowseBack
```
chrome://extensions
```
→ Find BrowseBack → Click reload icon (⟳)

**Done!** Open BrowseBack and check the console.

## Expected Console Output

### ✅ If Working:
```
🔍 Prompt API availability: readily
✅ BrowseBack: Prompt API ready! AI answers enabled.
```

### 📥 If Needs Download:
```
============================================================
🤖 BROWSEBACK AI SETUP GUIDE
============================================================
📥 AI model needs to be downloaded first (~1.7GB)

1. Click the 🤖 Ask AI button above
2. Model will start downloading (~1.7GB)
3. Takes 5-10 minutes on fast connection
4. Watch chrome://components for progress
============================================================
```

### 📋 If Needs Flag:
```
============================================================
🤖 BROWSEBACK AI SETUP GUIDE
============================================================
📋 Setup needed: Enable chrome://flags/#prompt-api-for-gemini-nano

1. Open: chrome://flags/#prompt-api-for-gemini-nano
2. Set to "Enabled"
3. Click "Relaunch" button
4. Reload this extension
============================================================
```

## Requirements

✅ Chrome Dev (130+) or Canary
✅ 22GB free disk space
✅ 16GB RAM or 4GB GPU VRAM
✅ Desktop (Mac/Windows/Linux)

**Don't have these?** No problem! Semantic search still works great without AI.

## Download Chrome Dev

If you're on regular Chrome, download Chrome Dev:
```
https://www.google.com/chrome/dev/
```

Or Chrome Canary (most up-to-date):
```
https://www.google.com/chrome/canary/
```

## Test If It's Working

After enabling and reloading:

1. Open BrowseBack
2. Type: `what was I reading?`
3. Press Enter

**If working:** AI answer appears
**If not:** Check console for setup guide

## Debug in Console

Open DevTools Console and run:

```javascript
// Check availability
const avail = await window.ai.languageModel.availability();
console.log('Availability:', avail);

// Should show: "readily" (ready) or "after-download" (needs download)
```

## Still Stuck?

**Check:**
1. Chrome version: `chrome://version` (need 130+)
2. Flag enabled: `chrome://flags/#prompt-api-for-gemini-nano`
3. Model downloaded: `chrome://components` (version should NOT be 0.0.0.0)
4. Extension reloaded: `chrome://extensions`

**The console will guide you!** Just open BrowseBack and read the console output.

---

**TL;DR:**
1. `chrome://flags/#prompt-api-for-gemini-nano` → Enable → Relaunch
2. `chrome://components` → Check model version → Download if needed
3. `chrome://extensions` → Reload BrowseBack
4. Open BrowseBack → Check console for status
