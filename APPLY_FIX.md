# How to Apply the API Fix

## The Problem

The code was using `window.ai.languageModel` but the **official Chrome API** is just `window.LanguageModel` (global).

## The Official API (Per Chrome Docs)

```javascript
// ✅ CORRECT (per official docs)
const availability = await window.LanguageModel.availability();
const session = await window.LanguageModel.create();

// ❌ WRONG (what we had before)
const availability = await window.ai.languageModel.availability();
const session = await window.ai.languageModel.create();
```

## Quick Fix Option 1: Replace Functions

1. **Open** `popup/popup.js`
2. **Find** the `initializeAI()` function (around line 588)
3. **Replace** it with the version from `popup-ai-fixed.js`
4. **Find** the `startAIModelDownload()` function (around line 640)
5. **Replace** it with the version from `popup-ai-fixed.js`
6. **Find** the `generateAIAnswer()` function (around line 821)
7. **Replace** it with the version from `popup-ai-fixed.js`
8. **Delete** the `getAIAPI()` function (around line 569) - no longer needed
9. **Save** the file
10. **Reload** the extension

## Quick Fix Option 2: Find & Replace

Open `popup/popup.js` and do these find/replaces:

### Replace 1:
**Find:**
```javascript
window.ai.languageModel
```

**Replace with:**
```javascript
window.LanguageModel
```

### Replace 2:
**Find:**
```javascript
const AI = getAIAPI();
if (!AI) {
```

**Replace with:**
```javascript
if (typeof window.LanguageModel === 'undefined') {
```

### Replace 3:
**Find:**
```javascript
await AI.create
```

**Replace with:**
```javascript
await window.LanguageModel.create
```

### Replace 4:
**Find:**
```javascript
await AI.availability()
```

**Replace with:**
```javascript
await window.LanguageModel.availability()
```

## Availability States (Per Docs)

The official API returns these states:

- `"unavailable"` - Cannot use on this device
- `"downloadable"` - Model available but needs download
- `"downloading"` - Currently downloading
- `"available"` - Ready to use immediately

## After Applying Fix

1. **Reload extension** in `chrome://extensions`
2. **Open test-api.html** to verify
3. **Should see**: `"LanguageModel API (Chrome 138+)"`
4. **Check console** for availability status

## Testing the Fix

Open `test-api.html` in Chrome Canary:

```
file:///Users/mac/Downloads/Timely%20OS/test-api.html
```

You should see:
```
Test 2: window.LanguageModel
EXISTS ✓

Test 5: Availability (window.LanguageModel)
available (or downloadable/downloading)
```

## If Still Not Working

Check these:

1. **Chrome version**: Must be Canary or Dev 138+
   - Go to `chrome://version`
   - Should say "Canary" or "Dev" with version 138+

2. **Flag enabled**:
   - Go to `chrome://flags/#prompt-api-for-gemini-nano`
   - Should be "Enabled"

3. **Restarted Chrome**:
   - After enabling flag, you MUST click "Relaunch"
   - Better yet: Quit Chrome completely and reopen

4. **Extension reloaded**:
   - Go to `chrome://extensions`
   - Click reload icon on BrowseBack

## Expected Console Output After Fix

```
✅ LanguageModel API found
🔍 Prompt API availability: downloadable
📥 AI model can be downloaded. Starting download...
⏬ Initiating AI model download...
📊 Monitor progress at: chrome://components
📥 Downloading AI model: 5% complete
📥 Downloading AI model: 15% complete
...
✅ AI model download complete!
💡 AI answers now available
```

---

**TL;DR**: Change `window.ai.languageModel` to `window.LanguageModel` everywhere in the code.
