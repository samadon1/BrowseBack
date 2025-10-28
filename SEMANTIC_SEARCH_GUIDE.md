# Semantic Search Integration Guide

## Overview

BrowseBack now features **true semantic search** powered by TF-IDF embeddings and AI-powered query expansion. This goes far beyond simple keyword matching to understand the meaning and context of your searches.

## What's New

### 1. TF-IDF Embeddings
- **Term Frequency-Inverse Document Frequency (TF-IDF)** creates numerical vectors representing the semantic content of each captured page
- Documents are indexed based on word importance, not just word presence
- Cosine similarity measures how closely documents match your query semantically

### 2. AI-Powered Query Expansion
- Uses Chrome's Prompt API to automatically expand your search with synonyms and related terms
- Example: Searching "purchase" also finds pages about "buy", "shop", "order", "checkout"
- Makes search more intelligent and context-aware

### 3. Vector Similarity Ranking
- Results ranked by semantic similarity, not just keyword matches
- Finds conceptually related content even if exact words don't match
- Boosts exact matches in titles and URLs for precision

## How to Use

### Enabling Semantic Search

1. Open BrowseBack popup
2. Click the **🧠 Semantic Search** chip button
3. Button turns green when active (with pulsing animation)
4. Enter your search query and press Enter

### Disabling Semantic Search

- Click the **🧠 Semantic Search** button again to toggle off
- Returns to fast keyword search mode

## Technical Architecture

### Files Modified

1. **`background.js`**
   - Imports `SemanticSearch` class
   - Builds semantic index on startup from all existing captures
   - Adds new captures to index automatically
   - Handles both keyword and semantic search requests

2. **`lib/semantic-search.js`** (NEW)
   - `buildIndex()` - Creates TF-IDF vectors for all documents
   - `expandQuery()` - Uses Prompt API for query expansion
   - `search()` - Performs semantic search with cosine similarity
   - `cosineSimilarity()` - Calculates vector similarity scores
   - `addToIndex()` - Incrementally adds new captures

3. **`popup/popup.html`**
   - Added semantic search toggle button
   - Visual indicator for active semantic mode

4. **`popup/popup.js`**
   - `semanticSearchEnabled` state flag
   - Sends semantic flag with search requests
   - Displays semantic search indicator in results
   - Handles toggle button interactions

5. **`popup/popup.css`**
   - `.semantic-chip` - Toggle button styling
   - `.semantic-chip.active` - Active state with pulse animation
   - `.semantic-indicator` - Results banner styling

## How It Works

### 1. Index Building (On Startup)

```javascript
// Build vocabulary from all captures
captures.forEach(capture => {
  const words = extractWords(capture);
  words.forEach(word => vocabulary.add(word));
});

// Calculate IDF (Inverse Document Frequency)
vocabulary.forEach(word => {
  const docsWithWord = countDocsContaining(word);
  idf[word] = log(totalDocs / docsWithWord);
});

// Build TF-IDF vectors
captures.forEach(capture => {
  const vector = buildTFIDFVector(capture);
  documentVectors[capture.id] = vector;
});
```

### 2. Query Expansion (Per Search)

```javascript
// Ask AI to expand the query
const prompt = `For the search query "${query}", provide 3-5 related search terms...`;
const response = await ai.prompt(prompt);

// Example:
// Input: "shopping"
// Output: ["shopping", "buy", "purchase", "cart", "checkout", "store"]
```

### 3. Semantic Search (Per Search)

```javascript
// Build query vector from expanded terms
const queryVector = buildTFIDFVector(expandedQuery);

// Calculate similarity with each document
const scores = documents.map(doc => {
  const similarity = cosineSimilarity(queryVector, doc.vector);
  return { doc, similarity };
});

// Sort by similarity and return
return scores.sort((a, b) => b.similarity - a.similarity);
```

## Performance Considerations

### Index Building
- Runs once on extension startup
- Takes ~100-500ms for 100-500 captures
- Runs in background, doesn't block UI
- Console logs: `"🔍 Building semantic search index..."`

### Query Expansion
- Adds ~200-500ms per search (AI processing)
- Falls back to original query if AI unavailable
- Cached per session for repeated queries

### Search Performance
- Semantic search: ~50-200ms for 100-500 captures
- Keyword search: ~10-50ms for 100-500 captures
- Trade-off: Better relevance vs. slightly slower

## Console Messages

### Successful Initialization
```
BrowseBack: Initializing...
BrowseBack: Building semantic search index...
✅ Indexed 127 documents with 2847 terms
BrowseBack: Semantic index built with 127 documents
```

### Semantic Search Active
```
✅ Semantic search enabled - using TF-IDF embeddings + AI query expansion
🔍 Expanded query: ["machine learning", "AI", "artificial intelligence", "neural networks", "ML"]
🧠 Semantic search results with AI query expansion
```

### Query Expansion (When Available)
```
🔍 Expanded query: ["shopping", "buy", "purchase", "cart", "checkout"]
```

### Fallback Behavior
```
⚠️ Query expansion failed, using original query: [error]
```

## Comparison: Keyword vs. Semantic

### Example Search: "machine learning"

**Keyword Search Results:**
- Exact matches for "machine" AND "learning"
- May miss "AI", "neural networks", "ML"
- Fast but narrow

**Semantic Search Results:**
- Finds "machine learning" (exact match)
- Also finds "artificial intelligence" (synonym)
- Finds "neural networks" (related concept)
- Finds "ML", "AI" (abbreviations)
- Slower but comprehensive

## Debugging

### Check If Index Built
```javascript
// In browser console after opening extension
chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
  console.log('Total captures:', response.stats.count);
});
```

### Test Query Expansion
1. Enable semantic search
2. Search for any term
3. Check console for "🔍 Expanded query: [...]"
4. If not present, Prompt API may not be available

### Verify Semantic Search Active
- Look for green pulsing button
- Console should show: "✅ Semantic search enabled..."
- Results should show: "🧠 Semantic Search Results" banner

## Graceful Degradation

The system gracefully handles missing dependencies:

1. **No Prompt API Available**
   - Query expansion disabled
   - Still uses TF-IDF similarity ranking
   - Falls back to original query only

2. **No Captures Yet**
   - Skips index building
   - Shows "Start browsing to build your memory"
   - Index builds automatically as captures accumulate

3. **Search Errors**
   - Automatically falls back to keyword search
   - Logs error to console for debugging
   - User sees results, just without semantic ranking

## Future Enhancements

Potential improvements for future versions:

1. **Persistent Index**
   - Save index to IndexedDB
   - Avoid rebuilding on every startup
   - Faster initialization

2. **Incremental Rebuilding**
   - Periodically recalculate IDF
   - Better accuracy as corpus grows
   - Background task every N captures

3. **Custom Weights**
   - User-adjustable title/URL/content weights
   - Personal relevance tuning
   - Settings panel integration

4. **Embedding API Integration**
   - Replace TF-IDF with true embeddings
   - When Chrome Embedding API launches
   - Even better semantic understanding

5. **Query History**
   - Learn from past searches
   - Personalized query expansion
   - Privacy-preserving on-device learning

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Console shows "Semantic index built with X documents"
- [ ] Semantic Search button appears in UI
- [ ] Button toggles green when clicked
- [ ] Search with semantic mode active
- [ ] Console shows "🔍 Expanded query: [...]"
- [ ] Results show "🧠 Semantic Search Results" banner
- [ ] Toggle off and search again (keyword mode)
- [ ] No banner appears in keyword mode
- [ ] Results differ between modes (more relevant in semantic)

## Troubleshooting

### "Semantic search failed, falling back to keyword search"
- Check if index was built successfully
- Look for "✅ Indexed X documents" in console
- May happen if captures are empty or corrupted

### No query expansion happening
- Prompt API may not be available
- Check console for "Prompt API not available"
- Semantic search still works, just without expansion

### Semantic button doesn't toggle
- Check browser console for JavaScript errors
- Verify popup.js loaded correctly
- Try reloading extension

### Results same as keyword search
- Query may not have expanded (check console)
- Try different search terms
- Ensure you have enough diverse captures

## Support

For issues or questions:
- Check browser console for error messages
- Review this guide's debugging section
- Check main README.md for general troubleshooting
- Open issue on GitHub (if applicable)

---

**Built for Google Chrome Built-in AI Challenge 2025**
🧠 Powered by Chrome's Prompt API and TF-IDF embeddings
