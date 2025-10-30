# Quick Test Guide - Semantic Search

## What Was Fixed

1. **Added `getAll()` method** to [lib/storage.js](lib/storage.js:305-319)
   - Returns all captures sorted by timestamp
   - Required for semantic index building

2. **Fixed search result format** in [lib/semantic-search.js](lib/semantic-search.js:193-199)
   - Now returns captures with `searchScore` property
   - Compatible with popup.js display logic

## How to Test

### Step 1: Reload Extension
1. Go to `chrome://extensions`
2. Find **BrowseBack**
3. Click the **reload** icon (circular arrow)

### Step 2: Open Developer Console
1. Click on BrowseBack extension icon
2. Right-click anywhere in popup
3. Select **Inspect** or **Inspect Element**
4. Go to **Console** tab

### Step 3: Check Initialization
You should see these messages in the console:

```
BrowseBack: Initializing...
🔍 Building semantic search index...
✅ Indexed 127 documents with 2847 terms
BrowseBack: Semantic index built with 127 documents
BrowseBack: Initialized successfully
```

If you see any errors, screenshot them and we'll fix them.

### Step 4: Test Semantic Search

1. **Enable Semantic Search**
   - Click the **🧠 Semantic Search** button
   - Button should turn **green** with a pulsing animation

2. **Search for Something**
   - Try: `github` or `email` or `shopping`
   - Press Enter

3. **Check Console Messages**
   ```
   ✅ Semantic search enabled - using TF-IDF embeddings + AI query expansion
   🔍 Expanded query: ["github", "git", "repository", "code", "repo"]
   🧠 Semantic search results with AI query expansion
   ```

4. **Check Results Display**
   - Should see blue banner: **"🧠 Semantic Search Results"**
   - Results should be different from keyword search

### Step 5: Compare With Keyword Search

1. Click **🧠 Semantic Search** again to **disable** it (turns back to blue)
2. Search for the same term
3. Notice the difference:
   - **Keyword**: Exact word matches only
   - **Semantic**: Related concepts and synonyms too

## Expected Behavior

### Semantic Search ON (Green Button)
- Blue banner at top of results
- Console shows expanded query terms
- More comprehensive results
- ~200-500ms slower (AI processing)

### Semantic Search OFF (Blue Button)
- No banner
- Faster results (~50ms)
- Only exact keyword matches

## Troubleshooting

### Error: "TypeError: storageManager.getAll is not a function"
✅ **FIXED** - Added getAll() method to storage.js

### Error: "Cannot read property 'searchScore'"
✅ **FIXED** - Updated semantic-search.js return format

### No Expanded Query in Console
- Prompt API may not be available yet
- Semantic search still works, just without AI expansion
- Normal behavior during Early Preview

### Button Doesn't Turn Green
- Check for JavaScript errors in console
- Try reloading the extension
- Check if semanticModeChip element exists in HTML

### Same Results for Keyword and Semantic
- Query might not have expanded (check console)
- Try different search terms
- Ensure you have diverse captures (127+)

## What to Look For

✅ **Success Indicators:**
- No errors in console during initialization
- Green pulsing button when semantic search active
- Blue results banner when searching
- Expanded query logged in console
- Different/better results vs keyword search

❌ **Problems to Report:**
- Any red errors in console
- Button not changing color
- No semantic indicator in results
- Same results for both search modes
- Performance issues (>2s search time)

## Next Steps After Testing

1. **Works perfectly?**
   - Start recording your demo video!
   - Show both keyword and semantic search modes
   - Highlight the query expansion feature

2. **Found bugs?**
   - Screenshot the console errors
   - Note which step failed
   - Share the error messages

3. **Performance issues?**
   - Check how many captures you have
   - Monitor search time in console
   - May need optimization for 500+ captures

---

**Ready to test!** Reload the extension and follow these steps. 🚀
