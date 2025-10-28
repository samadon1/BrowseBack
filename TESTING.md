# 🧪 BrowseBack Testing Guide

## Pre-Testing Checklist

- [ ] Chrome version 127+ installed
- [ ] Enrolled in Chrome Built-in AI Early Preview Program
- [ ] Flags enabled:
  - `chrome://flags/#optimization-guide-on-device-model` → Enabled
  - `chrome://flags/#prompt-api-for-gemini-nano` → Enabled
- [ ] Chrome restarted after enabling flags
- [ ] Icons created and placed in `/icons/` folder

---

## Installation Testing

### 1. Load Extension

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the BrowseBack folder
5. **Expected**: Extension appears with icon (or default puzzle piece)

**✅ Pass Criteria**: Extension loads without errors

### 2. Check Permissions

1. Click BrowseBack icon in toolbar
2. **Expected**: Popup opens showing empty state
3. Check console for errors (right-click icon → Inspect popup)

**✅ Pass Criteria**: No console errors, popup displays correctly

---

## Core Functionality Testing

### 3. Automatic Capture

1. Open a new tab and visit a website (e.g., `https://github.com`)
2. Wait 10 seconds
3. Switch to another website
4. Wait another 10 seconds
5. Click BrowseBack icon
6. Check "Recent" captures

**✅ Pass Criteria**: See at least 2 captures in the results

**Debug**:
- Check service worker logs: `chrome://extensions/` → BrowseBack → "service worker"
- Look for "BrowseBack: Captured..." messages

### 4. Manual Capture

1. Open BrowseBack popup
2. Click **Capture Now** button
3. Wait 2 seconds
4. **Expected**: Button returns to normal, capture count increases

**✅ Pass Criteria**: New capture appears in results immediately

### 5. Text Search

1. Visit a page with distinct text (e.g., "quantum computing tutorial")
2. Wait for automatic capture (10s)
3. Open BrowseBack popup
4. Search for "quantum"
5. **Expected**: Recently visited page appears in results

**✅ Pass Criteria**: Search finds relevant captures

### 6. Time-Based Search

1. Click "Today" chip
2. **Expected**: Only today's captures shown
3. Click "Yesterday" chip
4. **Expected**: Yesterday's captures (or none if first day)

**✅ Pass Criteria**: Filters work correctly

### 7. Result Interaction

1. Search for any query with results
2. Click on a result card
3. **Expected**: Opens the original URL in a new tab

**✅ Pass Criteria**: Clicking result navigates to correct page

---

## Storage & Privacy Testing

### 8. Statistics Display

1. Open BrowseBack popup
2. Check stats bar:
   - Capture count (should be > 0)
   - Storage used (should show MB value)
   - Privacy badge (should say "100% Local")

**✅ Pass Criteria**: All stats display correctly

### 9. Settings Panel

1. Click **Settings** button
2. **Expected**: Settings panel slides in
3. Change capture interval to "Every 30 seconds"
4. Close settings
5. Wait and verify captures happen every 30s (check service worker logs)

**✅ Pass Criteria**: Settings persist and affect behavior

### 10. Data Deletion

1. Open Settings
2. Scroll to "Danger Zone"
3. Click **Delete All Captures**
4. Confirm dialog
5. **Expected**:
   - Capture count resets to 0
   - Results show empty state
   - Storage used resets

**✅ Pass Criteria**: All data deleted successfully

---

## Edge Cases & Error Handling

### 11. Internal Pages

1. Visit `chrome://extensions/`
2. Wait 10 seconds
3. Check if capture was created
4. **Expected**: NO capture (internal pages skipped)

**✅ Pass Criteria**: Extension doesn't capture chrome:// pages

### 12. Empty Search

1. Open popup
2. Leave search box empty
3. Press Enter or click search
4. **Expected**: Shows recent captures (not empty state)

**✅ Pass Criteria**: Empty search returns recent results

### 13. No Results

1. Search for gibberish: "xyzabc123notreal"
2. **Expected**: "No results found" state displayed

**✅ Pass Criteria**: Proper no-results handling

### 14. Rapid Tab Switching

1. Open 5 different websites in tabs
2. Rapidly switch between them (2-3 seconds each)
3. Wait 15 seconds
4. Check BrowseBack
5. **Expected**: Only captures from tabs where content changed

**✅ Pass Criteria**: Duplicate prevention works

---

## Performance Testing

### 15. Storage Growth

1. Browse normally for 1 hour
2. Check storage stats
3. **Expected**: Storage increases proportionally to activity
4. Verify it doesn't exceed reasonable limits (~100-200 KB per capture)

**✅ Pass Criteria**: Storage growth is reasonable

### 16. Search Speed

1. Build up 50+ captures (browse for a while)
2. Search for common terms
3. **Expected**: Results appear in < 1 second

**✅ Pass Criteria**: Search is fast and responsive

---

## AI Integration Testing

### 17. DOM Text Extraction

1. Visit a text-heavy page (e.g., Wikipedia article)
2. Let it capture
3. Search for a phrase from the article
4. **Expected**: Page appears in results

**✅ Pass Criteria**: DOM text extraction works

### 18. Prompt API OCR (If Available)

> **Note**: This requires Prompt API to be fully available in your Chrome build

1. Visit a page with text in images
2. Let it capture
3. Search for text visible in images
4. **Expected**: OCR extracts text from images

**⚠️ Known Limitation**: OCR may not work if Prompt API isn't fully enabled

---

## Browser Compatibility

### 19. Multi-Window Support

1. Open BrowseBack in multiple Chrome windows
2. Browse in Window A
3. Open popup in Window B
4. **Expected**: Sees captures from Window A

**✅ Pass Criteria**: Works across windows

### 20. Incognito Mode

1. Open Incognito window
2. Check if BrowseBack is available
3. **Expected**: Extension disabled (or doesn't capture if allowed)

**✅ Pass Criteria**: Respects incognito settings

---

## Cleanup & Maintenance

### 21. Retention Policy

> **Note**: This test requires changing system time or waiting

1. Set retention to "3 days" in settings
2. Create test captures
3. Advance system time by 4 days (or wait)
4. **Expected**: Old captures are auto-deleted

**✅ Pass Criteria**: Cleanup job runs successfully

---

## Demo Video Testing

### 22. Record Full Workflow

Create a 3-minute demo showing:

1. **Installation** (15s)
   - Load extension
   - Show it's enabled

2. **Automatic Capture** (30s)
   - Browse 3-4 different websites
   - Show capture count increasing
   - Highlight "100% Local" badge

3. **Search Demonstration** (90s)
   - Content search: Find specific text
   - Time search: Use "Today" filter
   - Visual browsing: Scroll through timeline
   - Click result to navigate

4. **Privacy Features** (30s)
   - Open settings
   - Show storage stats
   - Emphasize local-only processing
   - Show delete all option

5. **Closing** (15s)
   - Recap: automatic, private, searchable
   - Call to action: GitHub repo link

**✅ Pass Criteria**: Video is clear, under 3 minutes, shows all features

---

## Submission Checklist

Before submitting to the hackathon:

### Code Quality
- [ ] No console errors in normal operation
- [ ] All features work as described
- [ ] Code is commented and clean
- [ ] README is comprehensive

### Documentation
- [ ] README includes API usage description
- [ ] Installation instructions are clear
- [ ] Screenshots/demo GIFs included
- [ ] LICENSE file present (MIT)

### Hackathon Requirements
- [ ] Uses Prompt API (documented, even if pending availability)
- [ ] Problem statement is clear in README
- [ ] Demo video uploaded to YouTube/Vimeo
- [ ] Video is public and < 3 minutes
- [ ] GitHub repository is public
- [ ] Repository has open source license
- [ ] Testing instructions included

### Optional Enhancements
- [ ] Feedback form completed (for "Most Valuable Feedback" prize)
- [ ] Social media posts (tag #ChromeAI)
- [ ] Additional APIs explored (Summarizer, Translator, etc.)

---

## Common Issues & Solutions

### Extension Won't Load
- **Solution**: Check manifest.json syntax, ensure all file paths are correct

### No Captures Appearing
- **Solution**: Check service worker logs, verify permissions granted

### Search Not Working
- **Solution**: Check IndexedDB in DevTools → Application → IndexedDB

### High Storage Usage
- **Solution**: Reduce retention period, lower capture interval

### Prompt API Not Available
- **Solution**: Verify flag settings, check Chrome version, enrollment status

---

## Performance Benchmarks

Target metrics for a healthy installation:

| Metric | Target | Acceptable | Concerning |
|--------|--------|------------|------------|
| Capture time | < 500ms | < 1s | > 2s |
| Search speed | < 200ms | < 500ms | > 1s |
| Storage/capture | 100-200 KB | 300 KB | > 500 KB |
| Popup load time | < 100ms | < 300ms | > 500ms |

---

## Report Issues

If you find bugs during testing:

1. Check the browser console for errors
2. Note the steps to reproduce
3. Create a GitHub issue with:
   - Chrome version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console logs/screenshots

---

**Happy Testing! 🚀**

Remember: The goal is to showcase Chrome Built-in AI capabilities while delivering a genuinely useful tool. Focus on the privacy and local-first benefits in your demo!
