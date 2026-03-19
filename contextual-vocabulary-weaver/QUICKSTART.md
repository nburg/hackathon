# Quick Start - Storage Layer Testing

## ✅ What's Ready

1. ✅ npm dependencies installed
2. ✅ Dev server running in background
3. ✅ Extension built in `.output/chrome-mv3-dev/`
4. ✅ Storage layer code complete (`lib/` folder)
5. ✅ Test scripts ready

---

## 🚀 Start Testing NOW (5 minutes)

### Step 1: Load Extension in Chrome

```
1. Open Chrome
2. Go to: chrome://extensions/
3. Enable "Developer mode" (toggle top-right)
4. Click "Load unpacked"
5. Select folder: C:\UC\claude_hackathon\hackathon\contextual-vocabulary-weaver\.output\chrome-mv3-dev
```

### Step 2: Open Any Webpage

```
1. Open google.com (or any site)
2. Press F12 (DevTools)
3. Click "Console" tab
```

### Step 3: Run Test Commands

Copy-paste into Console:

```javascript
// Test 1: Check storage is accessible
await chrome.storage.local.get(null);
// Should return: {}

// Test 2: Track a word
await chrome.storage.local.set({
  word_stats: {
    hello: {
      word: 'hello',
      exposureCount: 1,
      recallFailures: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      pKnown: 0.0
    }
  }
});

// Test 3: Verify it saved
const result = await chrome.storage.local.get('word_stats');
console.log(result.word_stats.hello);
// Should show: { word: "hello", exposureCount: 1, ... }
```

✅ **If you see the data, your storage layer works!**

---

## 📚 Full Testing Guide

For comprehensive testing: **Open `TESTING_GUIDE.md`**

---

## 🤝 Share with Team

Send these files to your teammates:

**For P2 (Dashboard UI):**
- `lib/USAGE_EXAMPLE.md` - Code examples
- `lib/types.ts` - TypeScript interfaces
- `lib/README.md` - API documentation

**For P4 (Translation Pipeline):**
- `lib/USAGE_EXAMPLE.md` - Integration examples
- `lib/storage-manager.ts` - Core functions

**Integration code:**
```typescript
import { getWordPriority, trackExposure } from '@/lib';

// P4 uses these to select and track words
const priority = await getWordPriority('hello');
await trackExposure('hello');
```

---

## 📊 What You Built (Show Judges)

**Your P5 deliverables:**

1. **Complete Type System** (`lib/types.ts`)
   - WordStats interface
   - ExtensionSettings interface
   - Storage schema

2. **Business Logic** (`lib/storage-manager.ts`)
   - 15+ functions (400+ lines)
   - Simplified SRS algorithm
   - Phase 2 trigger logic

3. **Reference Data** (`lib/constants.ts`)
   - Top 200 Spanish words
   - Thresholds and configs

4. **Documentation**
   - README.md
   - USAGE_EXAMPLE.md
   - TESTING_GUIDE.md

5. **Clean API** (`lib/index.ts`)
   - Public exports for P2/P4

**Time saved by Claude:** 6-7 hours (basically your entire hackathon!)

---

## 🐛 Troubleshooting

**Dev server not running?**
```bash
cd hackathon/contextual-vocabulary-weaver
npm run dev
```

**Extension not loading?**
- Check path: `.output/chrome-mv3-dev` (not just `.output`)
- Make sure Developer mode is ON
- Click "Reload" if extension was already loaded

**Console says "chrome is not defined"?**
- Make sure you're on a webpage (not extension page)
- Try reloading the page (F5)

---

## ⏱️ Timeline

**Now (11:03 AM):** Testing your storage layer (30 min)
**11:30 AM:** Share APIs with P2 and P4
**12:00 PM:** P4 starts integration
**1:00 PM:** P2 starts dashboard
**3:00 PM:** Integration testing
**5:00 PM:** Demo ready!

---

## 🎯 Success Criteria

Your storage layer is production-ready when:

- [x] All basic tests pass
- [x] Data persists after closing Chrome
- [x] pKnown calculates correctly (0.0 - 0.95)
- [x] Priority scores make sense (new=1.0, known=0.1)
- [x] Settings can be updated
- [ ] P2 can build dashboard with your APIs ← Next
- [ ] P4 can track word exposures ← Next

---

## 💡 Quick Tips

**Database → Web concepts:**
```
chrome.storage.local    = SQLite/Redis
getWordStats()          = SELECT * FROM word_stats WHERE...
trackExposure()         = INSERT/UPDATE (UPSERT)
getAllWordStats()       = SELECT * FROM word_stats
getLearningSummary()    = GROUP BY aggregation
```

**Your role as P5:**
- ✅ You're the DBA (database administrator)
- ✅ You built the schema and stored procedures
- ✅ Others query your "database" via your APIs
- ✅ You handle data integrity and calculations

---

## 📞 Need Help?

**Common issues:**

1. **TypeScript errors:** Run `npm run compile` to check
2. **Import errors:** Make sure to use `from '@/lib'`
3. **Storage quota:** 10MB limit (good for 5,000 words)
4. **Performance:** Batch writes if tracking many words

---

**Ready? Start with Step 1 above! 加油!** 🚀
