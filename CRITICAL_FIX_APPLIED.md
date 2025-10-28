# 🔧 CRITICAL FIX APPLIED - Language Specification Error

## Problem Found
The "No output language was specified" error was occurring because **semantic-search.js** was still using the OLD API and had no language specifications!

## Root Cause
While we fixed `popup.js`, the semantic search feature (which runs in the background) was still using:
- ❌ `window.ai.languageModel` (OLD API)
- ❌ No `expectedInputs` or `expectedOutputs` parameters

## Files Fixed

### 1. ✅ lib/semantic-search.js (Line 123-140)
**BEFORE:**
```javascript
if (!window.ai || !window.ai.languageModel) {
  return [query];
}

const capabilities = await window.ai.languageModel.capabilities();
if (capabilities.available === 'no') {
  return [query];
}

this.aiSession = await window.ai.languageModel.create({
  systemPrompt: '...'
});
```

**AFTER:**
```javascript
if (typeof window.LanguageModel === 'undefined') {
  return [query];
}

const availability = await window.LanguageModel.availability();
if (availability === 'unavailable') {
  return [query];
}

this.aiSession = await window.LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
  systemPrompt: '...'
});
```

### 2. ✅ lib/ai-processor.js (Line 15-37)
**BEFORE:**
```javascript
if (!window.ai || !window.ai.languageModel) {
  console.warn('Chrome Prompt API not available');
  return false;
}

const capabilities = await window.ai.languageModel.capabilities();

this.session = await window.ai.languageModel.create({
  systemPrompt: '...'
});
```

**AFTER:**
```javascript
if (typeof window.LanguageModel === 'undefined') {
  console.warn('Chrome Prompt API not available');
  return false;
}

const availability = await window.LanguageModel.availability();

this.session = await window.LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
  systemPrompt: '...'
});
```

### 3. ✅ popup/popup.js (Already Fixed)
- Line 635-637: `startAIModelDownload()` has language specs
- Line 817-819: `generateAIAnswer()` has language specs

## Summary of All Changes

### API Migration
- ❌ `window.ai.languageModel` → ✅ `window.LanguageModel`
- ❌ `.capabilities()` → ✅ `.availability()`
- ❌ `available === 'no'` → ✅ `availability === 'unavailable'`

### Language Specification Added
All `LanguageModel.create()` calls now include:
```javascript
{
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
  systemPrompt: '...'
}
```

## Verification
✅ No more old API calls in any code files
✅ All LanguageModel.create() calls have language specifications
✅ All availability checks use correct method

## Testing Steps

1. **Reload Extension:**
   - Go to `chrome://extensions`
   - Click the reload icon on BrowseBack
   - Click "Clear all" to clear console

2. **Test AI Answer:**
   - Open BrowseBack popup
   - Type: "what was I searching for?"
   - Click the AI button (🤖)
   - Should now work without language error!

3. **Test Semantic Search:**
   - Enable "Semantic Search" mode
   - Search for something
   - AI should expand your query without errors

4. **Check Console:**
   - Right-click popup → Inspect
   - Console should show:
     - ✅ "LanguageModel API found"
     - ✅ "Prompt API availability: available"
     - ✅ No language specification errors

## Why This Happened
When we initially fixed `popup.js`, we missed that:
1. Semantic search runs independently and has its own AI session
2. The semantic search file was never updated to use the new API
3. When semantic search tried to expand queries, it triggered the old API without language specs

This is why the error persisted even after fixing popup.js!
