# 🔧 Fixing "Not Enough Space" Error (Even When You Have Space!)

## The Problem

Chrome shows this error even when you have plenty of disk space:
```
The device does not have enough space for downloading the on-device model
```

This is Chrome's **generic error message** that can mean several different things!

## Real Causes (Not Actually Space!)

### 1. **Optimization Guide Component Not Installed**
Chrome needs a separate component to be installed first.

**Fix:**
1. Go to: `chrome://components`
2. Find: **"Optimization Guide On Device Model"**
3. Check its status:
   - ✅ If it says "Up-to-date" or shows a version → Good!
   - ❌ If it says "Not installed" or "Component not updated" → This is the problem!
4. Click **"Check for update"** on that component
5. Wait for it to download (1.7GB - may take 10-20 minutes)
6. Restart Chrome completely

### 2. **Flag Not Actually Enabled**
Sometimes the flag appears enabled but isn't really.

**Fix:**
1. Go to: `chrome://flags/#prompt-api-for-gemini-nano`
2. Set to **"Enabled"**
3. Go to: `chrome://flags/#optimization-guide-on-device-model`
4. Set to **"Enabled BypassPerfRequirement"** (important!)
5. **Restart Chrome completely** (not just reload)
6. Try again

### 3. **Model Not Available in Your Region**
Gemini Nano is only available in certain regions.

**Check:**
1. Open DevTools Console
2. Run our diagnostic tool (see below)

### 4. **Chrome Version Too Old/New**
Canary builds can be unstable.

**Fix:**
- Try **Chrome Dev** instead of Canary (more stable)
- Or wait for next Canary update (updates daily)

## Diagnostic Steps

### Step 1: Use Our Diagnostic Tool

1. **Open in Chrome Canary:** `diagnose-ai.html`
2. Click **"Check API Availability"**
3. Read the results:
   - If availability = **"available"** → Model already downloaded!
   - If availability = **"downloadable"** → Ready to download
   - If availability = **"downloading"** → Already downloading in background
   - If availability = **"unavailable"** → Flag not enabled or region issue

### Step 2: Check Component Status

1. Open: `chrome://components`
2. Find: **"Optimization Guide On Device Model"**
3. Status should show:
   ```
   Version: X.X.XXXX.XX
   Status: Up-to-date
   ```
4. If not, click "Check for update"

### Step 3: Manual Download Method

If automatic download fails, try manual approach:

1. Open DevTools Console (F12)
2. Run this code:

```javascript
// Check availability first
const availability = await window.LanguageModel.availability({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }]
});

console.log('Status:', availability);

if (availability === 'downloadable' || availability === 'available') {
  // Try creating without monitor first
  const session = await window.LanguageModel.create({
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  });

  console.log('✅ Session created!');

  // Test it
  const result = await session.prompt('Say hello');
  console.log('Response:', result);
}
```

### Step 4: Check for Different Error

The actual error might be different. To see the real error:

1. Open diagnose-ai.html
2. Click "Try Model Download"
3. Check the console for the **actual error message**
4. Common real errors:
   - "Model not available" → Flag issue or region restriction
   - "Download failed" → Network or component issue
   - "Invalid parameters" → API syntax issue (we can fix)

## Solutions Based on Real Error

### If Error: "Model not available"
```
Cause: Flag not properly enabled or region restriction
Fix:
1. Re-enable flags (see above)
2. Restart Chrome COMPLETELY (quit and reopen)
3. Check chrome://components
```

### If Error: "Download failed"
```
Cause: Network issue or component corruption
Fix:
1. Check internet connection
2. Try on different network
3. Clear Chrome components: Delete ~/Library/Application Support/Google/Chrome Canary/OptimizationGuidePredictionModels
4. Restart Chrome
```

### If Error: Contains "space" but you have space
```
Cause: Chrome's misleading error - actually means something else
Fix:
1. Check chrome://components
2. Try the "simple create" method (no monitor callback)
3. Update Optimization Guide component manually
```

## Try Without Monitor Callback

The `monitor` callback might be causing issues. Let me update BrowseBack to try without it first:

**Test this in console:**
```javascript
// Simple version without monitor
const session = await window.LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }]
});

console.log('✅ Works without monitor!');
```

If this works but the monitor version doesn't, that's a Chrome bug.

## Last Resort: Use Without AI

If nothing works, BrowseBack still works great without AI:
- ✅ Screenshot capture
- ✅ Keyword search
- ✅ Semantic search (TF-IDF)
- ❌ Natural language AI answers

The core functionality is still impressive!

## Need More Help?

1. **Run diagnose-ai.html** and share the full output
2. Check `chrome://components` and tell me the status of "Optimization Guide On Device Model"
3. Share the exact error from DevTools console (not just the popup error)
4. Tell me:
   - Chrome version
   - macOS version
   - How much free disk space you actually have

## Quick Checklist

- [ ] Both flags enabled (prompt-api AND optimization-guide)
- [ ] Chrome restarted COMPLETELY after enabling flags
- [ ] chrome://components shows "Optimization Guide On Device Model" is installed
- [ ] At least 22GB free disk space (check with `df -h /`)
- [ ] Using Chrome Canary or Dev (not stable)
- [ ] Tried diagnose-ai.html tool
- [ ] Checked actual error in DevTools console

The "not enough space" error is almost never actually about space! It's Chrome's lazy error message for "something went wrong with model download/initialization."
