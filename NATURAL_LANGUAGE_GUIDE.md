# Natural Language Search Guide

## What Changed

BrowseBack now **automatically detects** when you're asking a question and gives you a **conversational AI answer** instead of just search results!

## Before vs. After

### ❌ Before (Manual AI Mode)
1. Type question: "what was I searching for at 3pm?"
2. Click the 🤖 "Ask AI" button
3. Get results

### ✅ After (Automatic Detection)
1. Just type: "what was I searching for at 3pm?"
2. Press Enter
3. **Automatically** get AI answer in natural language!

## Examples

### Questions That Trigger AI Answers

**Time-based questions:**
- "what was I reading this morning?"
- "what did I look at yesterday?"
- "show me what I searched for at 2pm"

**Topic questions:**
- "what was I learning about machine learning?"
- "what articles did I read about AI?"
- "where was I shopping?"

**Action questions:**
- "did I visit GitHub today?"
- "was I looking at emails?"
- "how many coding tutorials did I view?"

**Open-ended questions:**
- "what was I doing earlier?"
- "tell me about my browsing today"
- "summarize what I was researching"

### Searches That Stay As Keyword Search

**Simple keywords:**
- `github`
- `email`
- `shopping`
- `python tutorial`

These will give you the fast search results grid instead.

## How It Works

### 1. Question Detection

The system automatically detects questions by looking for:

✅ **Question words at start:**
- what, when, where, who, why, how, which
- was, were, did, do, does, is, are
- can, could, would, should

✅ **Question mark:**
- "what was I reading?"

✅ **Command patterns:**
- "tell me about..."
- "show me..."
- "find me..."
- "help me..."
- "explain..."
- "summarize..."

✅ **Long conversational queries:**
- Queries with 5+ words containing question words

### 2. AI Answer Generation

When a question is detected:

1. **Search** for relevant pages from your browsing history
2. **Extract** content from top 5 most relevant pages
3. **Send to AI** with conversational instructions
4. **Get natural response** like: "You were searching for..."
5. **Show answer** with sources you can click

### 3. Response Style

The AI is instructed to be **conversational and natural**:

**Good responses:**
- "You were reading about machine learning on GitHub, specifically looking at TensorFlow tutorials about 2 hours ago."
- "Based on your browsing, you visited several email-related pages this morning, including Gmail and Outlook settings."
- "You were shopping for laptops on Amazon and Best Buy around 3pm today."

**Avoid:**
- "The search results show..."
- "According to the data..."
- Robotic or technical language

## User Experience

### Natural Language Question
```
User types: "what was I reading about AI?"
↓
🤖 Auto-detected as question
↓
🔄 AI generates answer
↓
💬 "You were reading about artificial intelligence on two pages:
    1. 'Introduction to Machine Learning' on Medium (2 hours ago)
    2. 'GPT-4 Technical Report' on OpenAI (3 hours ago)

    You seem particularly interested in neural networks and transformers."
↓
📚 Shows clickable sources below
```

### Keyword Search
```
User types: "github"
↓
🔍 Detected as keyword search
↓
⚡ Fast results grid
↓
📊 Shows all GitHub pages with relevance scores
```

## Visual Indicators

### When AI Answer Mode Activates:

1. **Loading screen** shows: "🤖 AI is analyzing your browsing history..."
2. **Answer appears** in purple/pink gradient box
3. **Sources listed** below with timestamps
4. **Can click** any source to view that capture

### When Keyword Search Runs:

1. **Loading screen** shows: "Searching your memory..."
2. **Results grid** appears with thumbnails
3. **Yellow highlights** on matching terms
4. **Relevance scores** as badges

## Settings & Control

### Force AI Mode
- Click the **🤖 Ask AI** button
- Even keyword searches will get AI answers

### Force Keyword Mode
- Just type simple keywords (1-3 words)
- No question words
- System stays in keyword search

### Toggle Semantic Search
- Click **🧠 Semantic Search** chip
- Works with both AI and keyword modes
- Finds related concepts, not just exact words

## Performance

### AI Answer Mode
- **Speed:** ~1-3 seconds (AI processing)
- **Best for:** Questions about your activity
- **Requires:** Chrome Prompt API (Early Preview)

### Keyword Search
- **Speed:** ~50-200ms (instant)
- **Best for:** Finding specific pages
- **Always available:** No dependencies

## Troubleshooting

### "AI model not available yet"
- Prompt API not enabled
- Join Chrome Built-in AI Early Preview Program
- Keyword search still works perfectly

### Question detected but no AI answer
- Check console for error messages
- AI might not be initialized
- Falls back to keyword search automatically

### Keyword search when I wanted AI
- Add question word at start ("what is github?")
- Add question mark ("github?")
- Use "tell me about github"

### AI answer when I wanted keywords
- Use 1-3 word queries only
- Remove question words
- Remove question marks

## Examples to Try

Copy and paste these into BrowseBack:

### Questions (AI Answers)
```
what was I reading this morning?
where was I shopping yesterday?
did I visit any coding tutorials?
what articles did I read about machine learning?
show me what I was researching earlier
tell me about my browsing activity today
was I looking at emails?
how many GitHub repos did I visit?
what was I learning about?
```

### Keywords (Search Results)
```
github
email
shopping
python
machine learning
tutorials
articles
```

## Benefits

### For Users
✅ **Natural conversation** - Ask questions like you would a person
✅ **Automatic routing** - No need to click buttons
✅ **Time context** - Understands "this morning", "yesterday", "at 3pm"
✅ **Smart summaries** - Synthesizes info from multiple pages
✅ **Fast when needed** - Keywords bypass AI for instant results

### For Demo Video
✅ **Show AI power** - Natural language understanding
✅ **Conversational UX** - More impressive than keyword search
✅ **Multimodal AI** - Chrome's Prompt API in action
✅ **Practical use case** - Actually useful for memory recall

## Technical Details

### Detection Algorithm
Located in [popup/popup.js](popup/popup.js:168-190)

```javascript
function isNaturalLanguageQuestion(query) {
  // Checks for:
  // 1. Starts with question word
  // 2. Ends with ?
  // 3. Contains command pattern
  // 4. Long query with embedded questions
}
```

### Prompt Engineering
Located in [popup/popup.js](popup/popup.js:633-665)

- **System prompt:** Sets conversational tone
- **Context building:** Includes titles, URLs, timestamps
- **User prompt:** Clear instruction for natural response

### Fallback Logic
- Question detected → Try AI answer
- AI fails → Automatic fallback to keyword search
- No Prompt API → Skip detection, use keywords only

---

## Demo Script

**For your hackathon video:**

1. **Show keyword search:**
   - Type: `github`
   - Fast results appear

2. **Show natural question:**
   - Type: `what was I reading about machine learning?`
   - AI automatically activates
   - Conversational answer appears
   - Click sources to show they're real

3. **Show time context:**
   - Type: `what did I look at this morning?`
   - AI understands temporal context
   - Lists pages with timestamps

4. **Highlight the magic:**
   - "Notice I didn't click any buttons"
   - "It automatically detected my question"
   - "Gave me a natural answer, not just results"
   - "This is the future of browsing memory"

---

**Built for Google Chrome Built-in AI Challenge 2025**
🤖 Powered by Chrome's Prompt API with automatic natural language detection
