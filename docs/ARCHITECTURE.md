# 🏗️ BrowseBack Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Web Page   │    │   Web Page   │    │   Web Page   │  │
│  │              │    │              │    │              │  │
│  │  [Content    │    │  [Content    │    │  [Content    │  │
│  │   Script]    │    │   Script]    │    │   Script]    │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │           │
│         └───────────────────┴───────────────────┘           │
│                             │                               │
│                             │ Extract DOM Text              │
│                             ↓                               │
│         ┌────────────────────────────────────┐              │
│         │   Background Service Worker        │              │
│         │                                    │              │
│         │  • Monitor Active Tab              │              │
│         │  • Capture Screenshots (10s)       │              │
│         │  • Detect Content Changes          │              │
│         │  • Coordinate Storage              │              │
│         │  • Handle Cleanup Schedule         │              │
│         └─────────┬──────────────────┬───────┘              │
│                   │                  │                      │
│         ┌─────────▼────────┐   ┌─────▼──────────┐          │
│         │  Capture Module  │   │ Storage Module │          │
│         │                  │   │                │          │
│         │ • Screenshot API │   │ • IndexedDB    │          │
│         │ • WebP Compress  │   │ • CRUD Ops     │          │
│         │ • Change Hash    │   │ • Search Index │          │
│         └──────────────────┘   │ • Cleanup      │          │
│                                └────────────────┘          │
│                                                              │
│         ┌────────────────────────────────────┐              │
│         │        Popup Interface             │              │
│         │                                    │              │
│         │  • Search Input                    │              │
│         │  • Results Grid                    │              │
│         │  • Privacy Dashboard               │              │
│         │  • Settings Panel                  │              │
│         └─────────┬──────────────────────────┘              │
│                   │                                         │
│                   │ Query IndexedDB                         │
│                   ↓                                         │
│         ┌────────────────────────────────────┐              │
│         │      Local IndexedDB               │              │
│         │                                    │              │
│         │  Object Store: "captures"          │              │
│         │  ┌──────────────────────────────┐  │              │
│         │  │ id: auto-increment           │  │              │
│         │  │ timestamp: number            │  │              │
│         │  │ url: string                  │  │              │
│         │  │ title: string                │  │              │
│         │  │ screenshot: base64 WebP      │  │              │
│         │  │ domText: string              │  │              │
│         │  │ extractedText: string (OCR)  │  │              │
│         │  │ favIconUrl: string           │  │              │
│         │  └──────────────────────────────┘  │              │
│         │                                    │              │
│         │  Indexes:                          │              │
│         │  • timestamp                       │              │
│         │  • url                             │              │
│         │  • title                           │              │
│         └────────────────────────────────────┘              │
│                                                              │
│         ┌────────────────────────────────────┐              │
│         │     Chrome Prompt API              │              │
│         │                                    │              │
│         │                                    │              │
│         │  • OCR from screenshots            │              │
│         │  • Multimodal processing           │              │
│         │  • Local AI inference              │              │
│         │  • Privacy-preserving              │              │
│         └────────────────────────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

         🔒 ALL DATA STAYS ON DEVICE 🔒
         No Cloud • No Tracking • 100% Private
```

---

## Data Flow

### 1. Capture Flow

```
Active Tab
    │
    │ Every 10 seconds
    ↓
Check URL (skip chrome://)
    │
    │ Valid URL
    ↓
Capture Screenshot (PNG)
    │
    │ Compress
    ↓
Convert to WebP
    │
    │ Hash comparison
    ↓
Content Changed?
    │
    ├─ No → Skip capture
    │
    └─ Yes → Continue
         │
         ↓
    Extract DOM Text (via content script)
         │
         ↓
    Create Capture Object
         │
         ↓
    Save to IndexedDB
         │
         ↓
    [Future: Process with Prompt API]
```

### 2. Search Flow

```
User Types Query
    │
    ↓
Query IndexedDB
    │
    ↓
Iterate All Captures
    │
    ↓
Filter by:
 • Title match
 • URL match
 • DOM text match
 • Extracted text match
    │
    ↓
Sort by Timestamp (newest first)
    │
    ↓
Display Results Grid
    │
    ↓
User Clicks Result
    │
    ↓
Open Original URL
```

### 3. Cleanup Flow

```
Daily at 3 AM
    │
    ↓
Check Retention Setting (e.g., 7 days)
    │
    ↓
Calculate Cutoff Date
    │
    ↓
Query captures older than cutoff
    │
    ↓
Delete old captures
    │
    ↓
Schedule next cleanup (24h)
```

---

## Component Breakdown

### Background Service Worker (`background.js`)

**Responsibilities:**
- Monitor active tab changes
- Schedule periodic captures
- Coordinate between modules
- Handle message passing
- Manage cleanup tasks

**Key APIs:**
- `chrome.tabs.query()` - Get active tab
- `chrome.tabs.captureVisibleTab()` - Screenshot
- `chrome.tabs.sendMessage()` - Communicate with content script
- `chrome.runtime.onMessage` - Receive messages
- `setInterval()` - Schedule captures

**Lifecycle:**
- Starts on browser launch
- Stays active while browser is open
- Handles events asynchronously

### Content Script (`content.js`)

**Responsibilities:**
- Extract visible text from DOM
- Parse page metadata
- Filter out hidden/script elements

**Key APIs:**
- `document.createTreeWalker()` - Traverse DOM
- `window.getComputedStyle()` - Check visibility
- `chrome.runtime.onMessage` - Receive requests

**Lifecycle:**
- Injected into every page
- Runs in page context
- Isolated from page scripts

### Storage Module (`lib/storage.js`)

**Responsibilities:**
- Initialize IndexedDB
- CRUD operations
- Search functionality
- Statistics calculation

**Key Methods:**
- `init()` - Set up database
- `saveCapture()` - Store data
- `search()` - Text search
- `getStats()` - Storage info
- `deleteAll()` - Clear data

**Schema:**
```javascript
{
  id: <auto-increment>,
  timestamp: <Date.now()>,
  url: <string>,
  title: <string>,
  screenshot: <base64 WebP>,
  domText: <string>,
  extractedText: <string>,
  favIconUrl: <string>
}
```

### Capture Module (`lib/capture.js`)

**Responsibilities:**
- Screenshot capture
- WebP compression
- Change detection
- URL filtering

**Key Methods:**
- `captureTab()` - Take screenshot
- `compressToWebP()` - Convert format
- `hasContentChanged()` - Hash comparison
- `shouldCapture()` - URL validation

**Compression:**
- Input: PNG (Chrome API default)
- Output: WebP at 0.7 quality
- Savings: ~60-70% file size

### AI Processor (`lib/ai-processor.js`)

**Responsibilities:**
- Initialize Prompt API session
- OCR text extraction
- Error handling for API unavailability

**Key Methods:**
- `init()` - Create AI session
- `extractTextFromImage()` - OCR
- `processCapture()` - Enhance data
- `checkAvailability()` - API status

**Note:** Currently in fallback mode. Full OCR pending Prompt API availability in Early Preview Program.

### Popup UI (`popup/`)

**Responsibilities:**
- User interface
- Search input handling
- Results display
- Settings management

**Key Files:**
- `popup.html` - Structure
- `popup.css` - Styling
- `popup.js` - Logic

**Features:**
- Real-time search
- Thumbnail grid
- Privacy dashboard
- Settings panel

---

## Privacy Architecture

### Local-Only Design

**No Network Requests:**
```
✅ All data in IndexedDB (browser storage)
✅ All processing in browser context
✅ Screenshots never leave device
✅ No external API calls (except Prompt API, which is local)
✅ No telemetry or analytics
```

**Data Isolation:**
```
User Device
    │
    └─ Chrome Browser
         │
         └─ BrowseBack Extension
              │
              └─ IndexedDB (encrypted by browser)
                   │
                   └─ Capture data (never synced)
```

**User Control:**
- Delete all data anytime
- Configure retention period
- Export data (future feature)
- No account required
- No cloud tie-in

---

## Performance Optimizations

### 1. Efficient Capture

**Change Detection:**
- Hash-based comparison
- Samples every 100th character
- Skips duplicate captures
- Reduces storage waste

**Compression:**
- WebP format (smaller than PNG)
- 0.7 quality setting (imperceptible loss)
- Async processing (non-blocking)

### 2. Fast Search

**In-Memory Index:**
- IndexedDB indexes on common fields
- Full-text search via JavaScript iteration
- Results limited to 50 (configurable)

**Optimization Opportunities:**
- Add Fuse.js for fuzzy search
- Implement virtual scrolling for results
- Cache recent searches

### 3. Storage Management

**Automatic Cleanup:**
- Daily scheduled job
- Respects retention settings
- Deletes oldest first

**Quota Monitoring:**
- Storage API estimates
- Warning at 80% usage
- Prompt user to reduce retention

---

## Extension Manifest V3

### Permissions Explained

**Required Permissions:**
- `activeTab` - Capture current tab screenshot
- `tabs` - Query active tabs, get tab info
- `storage` - Save user settings (sync.storage)
- `unlimitedStorage` - Bypass IndexedDB quota limits
- `offscreen` - Future: AI processing in offscreen document

**Host Permissions:**
- `<all_urls>` - Access all websites for capture

### Security Model

**Content Security Policy:**
- No inline scripts
- No eval()
- External resources blocked
- Strict module imports

**Isolation:**
- Service worker isolated from web pages
- Content scripts can't access extension internals
- Popup runs in separate context

---

## Future Enhancements

### Phase 2: AI Integration

**Prompt API OCR:**
```javascript
const session = await window.ai.languageModel.create({
  systemPrompt: 'OCR assistant'
});

const text = await session.prompt('Extract text', {
  image: screenshotDataUrl
});
```

**Benefits:**
- Extract text from images
- Transcribe video captions
- Identify visual elements

### Phase 3: Summarization

**Summarizer API:**
```javascript
const summarizer = await window.ai.summarizer.create();
const summary = await summarizer.summarize(longText);
```

**Use Cases:**
- Daily browsing digest
- Capture summaries
- Quick preview on hover

### Phase 4: Translation

**Translator API:**
```javascript
const translator = await window.ai.translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});
const translated = await translator.translate(text);
```

**Use Cases:**
- Multilingual search
- Cross-language results
- Auto-detect content language

---

## Error Handling

### Graceful Degradation

**Prompt API Unavailable:**
- Fall back to DOM text extraction
- Show warning in settings
- Extension still functional

**IndexedDB Full:**
- Warn user in popup
- Suggest reducing retention
- Prevent new captures until space

**Screenshot Fails:**
- Log error, continue
- Don't crash service worker
- Retry on next interval

**Content Script Blocked:**
- Return empty text
- Don't fail capture
- Capture screenshot only

---

## Testing Strategy

### Unit Tests (Future)

**Storage Module:**
- Test CRUD operations
- Test search logic
- Test cleanup job

**Capture Module:**
- Test compression
- Test change detection
- Test URL filtering

### Integration Tests

**End-to-End:**
- Install extension
- Browse pages
- Search content
- Verify results

**Performance:**
- Measure capture time
- Measure search speed
- Monitor storage growth

---

## Deployment

### Development

```bash
# Load unpacked extension
1. chrome://extensions/
2. Enable Developer mode
3. Load unpacked → select folder
```

### Production (Chrome Web Store)

```bash
# Create ZIP
zip -r browseback.zip . -x "*.git*" "*.DS_Store"

# Upload to Chrome Web Store
https://chrome.google.com/webstore/devconsole
```

**Requirements:**
- Developer account ($5 one-time fee)
- Privacy policy (can host on GitHub)
- Screenshots for listing
- Detailed description

---

## Metrics & Analytics

### Privacy-Friendly Metrics

**Local-Only:**
- Capture count
- Storage used
- Search frequency (not query content)
- Average captures per day

**No Telemetry:**
- Never send data externally
- Never track user behavior
- Never log queries
- Never phone home

---

## Open Source License

**MIT License:**
- Free to use
- Free to modify
- Free to distribute
- Commercial use allowed
- Attribution required

---

## Contributing Guidelines

**How to Contribute:**
1. Fork repository
2. Create feature branch
3. Implement changes
4. Test thoroughly
5. Submit pull request

**Code Standards:**
- ES6+ JavaScript
- JSDoc comments
- Meaningful variable names
- Error handling
- No external dependencies (vanilla JS)

---

**Architecture Summary:**

BrowseBack is a privacy-first Chrome extension that uses:
- **Local storage** (IndexedDB)
- **Local AI** (Chrome Prompt API)
- **Local processing** (service workers)

Zero cloud. Zero tracking. 100% user ownership.

**Simple. Private. Powerful.** 🚀
