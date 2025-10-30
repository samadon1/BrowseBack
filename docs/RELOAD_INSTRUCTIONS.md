# How to Properly Reload the Extension

The error you're seeing means Chrome is using the **old cached version** of the code. Here's how to force a complete reload:

## Method 1: Hard Reload (Recommended)

1. Go to `chrome://extensions`
2. Find **BrowseBack**
3. Toggle the extension **OFF** (switch to the left)
4. Wait 2 seconds
5. Toggle the extension **ON** (switch to the right)
6. Click the **reload icon** (circular arrow) next to the toggle
7. Close any open BrowseBack popups
8. Click the extension icon again to open a fresh popup

## Method 2: Remove and Reload (If Method 1 Doesn't Work)

1. Go to `chrome://extensions`
2. Find **BrowseBack**
3. Click **Remove** button
4. Click **Load unpacked** button
5. Select the folder: `/Users/mac/Downloads/Timely OS`
6. Extension should reload with fresh code

## Method 3: Clear Service Worker Cache

1. Go to `chrome://extensions`
2. Find **BrowseBack**
3. Click **service worker** link (blue text)
4. A DevTools window will open
5. In the DevTools, go to **Application** tab
6. In left sidebar, find **Storage**
7. Click **Clear site data**
8. Close DevTools
9. Go back to `chrome://extensions`
10. Click the **reload icon** for BrowseBack
11. Open extension popup

## Verification Steps

After reloading, open the extension and check the console:

### ✅ Success - You should see:
```
BrowseBack: Initializing...
BrowseBack: Building semantic search index...
✅ Indexed 127 documents with 2847 terms
BrowseBack: Semantic index built with 127 documents
BrowseBack: Initialized successfully
```

### ❌ Still Broken - You'll see:
```
BrowseBack: Error building semantic index: TypeError: storageManager.getAll is not a function
```

## Quick Debug Test

To verify the new code is loaded, open the DevTools console and run:

```javascript
chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
  console.log('Stats:', response);
});
```

If this works without errors, the new code is loaded.

## If Still Not Working

The file is definitely updated (verified with grep). If you're still seeing the error after trying all 3 methods above, there might be a module caching issue. Try this:

1. **Add a version check** - I can add a console log to verify which version is running
2. **Check the actual file** - Open `chrome://extensions`, click "service worker" under BrowseBack, and check if the Sources tab shows the new code
3. **Hard refresh everything** - Close ALL Chrome windows, quit Chrome completely, reopen

## Why This Happens

Chrome aggressively caches JavaScript modules for performance. Service workers in particular can persist even after clicking "reload" because they run in the background. The toggle OFF/ON forces Chrome to fully restart the service worker with fresh code.

---

**Try Method 1 first** - it works 95% of the time!
