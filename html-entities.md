# HTML Entity Decoding Implementation Plan

## Current Issue
Episode titles and descriptions from RSS feeds contain HTML entities like:
- `&#160;` (non-breaking space)
- `&#8211;` (en dash –)
- `&amp;` (ampersand &)
- `&quot;` (quotation mark ")

These display as raw codes instead of the intended characters.

---

## Code Architecture Analysis

### Current Data Flow
```
RSS Feed (XML) 
  ↓
fetchWithFallback() - gets XML text
  ↓
DOMParser - parses XML
  ↓
parseEpisode() - extracts episode data
  ↓
  • title: item.querySelector('title')?.textContent
  • description: stripHtml(description)
  ↓
Episode object stored in state.podcasts
  ↓
createEpisodeElement() - renders to DOM
  ↓
div.innerHTML = `<h4>${episode.title}</h4>`
```

### Key Functions

**parseEpisode() - Lines 391-418**
- Extracts episode data from XML `<item>` nodes
- Gets title from `<title>` tag
- Gets description from `<description>`, `<content:encoded>`, or `<summary>`
- Calls `stripHtml()` on description only
- Returns episode object

**stripHtml() - Lines 68-72**
```javascript
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}
```
- Creates temporary div
- Sets innerHTML (which DOES decode HTML entities!)
- Returns textContent (plain text)

**createEpisodeElement() - Lines 500-578**
- Creates HTML for episode list items
- Inserts episode.title and episode.description via template literal
- Uses `div.innerHTML = ...` to inject content

**loadEpisode() - Lines 593-631**
- Sets episode title in player metadata
- Uses `textContent` assignment (safe, auto-decodes)

---

## Problem Analysis

### Why stripHtml() Works But Title Doesn't

**stripHtml() DOES decode entities:**
```javascript
tmp.innerHTML = html;  // Browser decodes &#160; → space
return tmp.textContent; // Returns decoded text
```

**Title has NO decoding:**
```javascript
title: item.querySelector('title')?.textContent  // Raw from XML parser
```

The XML parser's `.textContent` returns the RAW text with entities UNdecoded.

---

## Solution: Add HTML Entity Decoder

### Standard Approach (Used by Billions of Sites)

```javascript
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}
```

**Why textarea instead of div:**
- `textarea.value` is safer - no script execution risk
- Standard DOM API approach
- Works identically to stripHtml() mechanism
- Zero dependencies, native browser support

---

## Implementation Plan

### Step 1: Add Utility Function
**Location:** After `stripHtml()` function (around line 73)

```javascript
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}
```

**Impact:** None - just adds new function
**Risk:** Zero - not called yet

---

### Step 2: Update parseEpisode() Function
**Location:** Lines 391-418

**Current code:**
```javascript
const episode = {
    id: episodeIndex,
    title: item.querySelector('title')?.textContent || 'Untitled Episode',
    description: description,
    // ...
};
```

**New code:**
```javascript
// Get title and decode HTML entities
let title = item.querySelector('title')?.textContent || 'Untitled Episode';
title = decodeHtmlEntities(title);

const episode = {
    id: episodeIndex,
    title: title,
    description: description,
    // ...
};
```

**And for description (after stripHtml call):**
```javascript
description = stripHtml(description);
description = decodeHtmlEntities(description);
```

**Impact:** Episode data now has decoded text
**Risk:** Very low - just text transformation

---

### Step 3: Test Points

**After Step 1:**
- Run app, verify no errors
- Nothing should change visually

**After Step 2:**
- Check episode titles in dropdown
- Check episode descriptions
- Check main player title display
- Verify HTML entities are gone

---

## Files Modified
- `script.js` only
- No HTML changes
- No CSS changes

## Lines to Modify
1. **~Line 73:** Add `decodeHtmlEntities()` function (5 lines)
2. **~Line 405:** Decode title in `parseEpisode()` (3 lines)
3. **~Line 401:** Decode description in `parseEpisode()` (1 line)

**Total:** 9 lines added/modified in 1 file

---

## Safety Measures

### Before Starting
1. Commit current working state to git
2. Note current git commit hash for easy revert

### During Implementation
1. Add function first, test
2. Add title decoding, test
3. Add description decoding, test

### After Each Change
1. Refresh browser
2. Check console for errors
3. Verify player loads
4. Check episode titles display

### If Anything Breaks
```bash
git diff script.js  # See what changed
git checkout script.js  # Revert if needed
```

---

## Why This Won't Break Anything

1. **New function is isolated** - doesn't affect existing code
2. **Only modifies text content** - no DOM structure changes
3. **Same mechanism as stripHtml()** - already proven to work
4. **Applied after XML parsing** - doesn't affect feed fetching
5. **Before rendering** - ensures clean data throughout app
6. **Standard web API** - used by billions of sites
7. **No external dependencies** - pure DOM API

---

## Expected Results

**Before:**
```
Thursday, November 6, 2025 - RMM&#160;&#8211;&#160;ENCORE
```

**After:**
```
Thursday, November 6, 2025 - RMM – ENCORE
```

Proper spacing and en-dash character displayed.
