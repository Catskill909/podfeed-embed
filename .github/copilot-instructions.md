# PodFeed Embed - AI Coding Instructions

## Project Overview

A modern, embeddable podcast player that loads multiple podcasts from a master RSS feed. Features dark/light themes, custom dropdown UI, modal player overlay, and PHP proxy for CORS-free embedding anywhere.

**Tech Stack:** Vanilla JS, CSS3 (Material Design), HTML5 Audio API, PHP 7.0+ (proxy only)

## Architecture Patterns

### Master Feed + Lazy Loading System

The player uses a two-tier feed architecture for performance:

1. **Master feed** (`feed.php`) contains metadata for ~20 podcasts (title, cover, episode count)
2. **Individual feeds** load on-demand when podcast is selected
3. **First podcast** loads immediately (~3-5s), others load in background

```javascript
// In parseMasterFeed(): Extract ALL podcast metadata instantly
// Load first podcast episodes immediately
// Background-load remaining podcasts without blocking UI
```

**Critical workflow:** Never refetch master feed unnecessarily. Episodes are cached in `state.podcasts[index].episodes` after first load.

### CORS Proxy Cascade

Feed fetching tries multiple strategies in order:

1. **Local PHP proxy** (`proxy.php`) - preferred, server-side fetch
2. **CorsProxy.io** - fallback #1
3. **AllOrigins** - fallback #2 (handles base64 encoding)
4. **CodeTabs** - fallback #3

See `fetchWithFallback()` in `script.js`. Each proxy has different response formats - handle accordingly.

### State Management

Global `state` object tracks:
- `podcasts[]` - full podcast data including episodes
- `currentPodcast` - selected podcast object
- `currentEpisode` - loaded episode
- `isPlaying` - audio state
- `currentSpeed` - playback rate

Separate `modalState` for player overlay visibility.

**Pattern:** Always update state first, then sync UI from state. Don't read DOM as source of truth.

## Critical Development Rules

### 1. Local Server Required

**Never run from `file://` protocol.** CORS policies block all external requests from file:// origins.

```bash
# Start local server before testing
php -S localhost:8000
# or: python3 -m http.server 8000
# or: npx http-server -p 8000
```

Check protocol in code:
```javascript
if (window.location.protocol === 'file:') {
    showError('Please run from http://localhost...');
}
```

### 2. Episode Loading Pattern

**Never load all podcasts synchronously.** User sees frozen UI for 40-60 seconds.

**Correct approach:**
```javascript
// 1. Load master feed (1s)
// 2. Show first podcast immediately (3s total)
// 3. Background-load others in loadRemainingPodcastsInBackground()
// 4. Update dropdown as each loads
```

See `COMPLETE-AUDIT.md` for full architectural explanation.

### 3. Theme System

Theme stored in localStorage with key `'podcast-player-theme'`. Applied via `data-theme` attribute on `<html>`:

```css
:root { --primary: #BB86FC; /* dark mode */ }
[data-theme="light"] { --primary: #6750A4; }
```

**Always** use CSS custom properties for colors, never hardcoded hex values. Toggle preserves user preference across sessions.

### 4. Custom Dropdown (Not Native Select)

The podcast selector uses a custom-built dropdown, not `<select>`:

- `.dropdown-selected` - visible clickable element
- `.dropdown-options` - absolutely positioned list (z-index: 10000)
- Hidden `<select>` remains for form compatibility

**When updating:** Sync both custom dropdown AND hidden select. See `populatePodcastDropdown()`.

## Common Tasks

### Adding a New Podcast Feed

If using master feed system, add to server's `feed.php`. If hardcoding:

```javascript
// In parseMasterFeed() or use static list:
const podcasts = [
    { url: 'https://example.com/feed.xml', title: 'New Show', id: 0 }
];
```

### Fixing CORS Issues

1. Verify running from `http://localhost`, not `file://`
2. Check `proxy.php` exists and is accessible
3. Add domain to whitelist in `proxy.php`:

```php
$allowedDomains = [
    'podcast.supersoul.top',
    'your-new-domain.com', // Add here
];
```

### Customizing Player UI

**Spacing:** Use CSS custom properties `--space-1` through `--space-6` (4px to 24px scale)

**Typography:**
- Headers: `font-family: 'Oswald'` (600-700 weight, uppercase)
- Body: `font-family: 'Inter'` (400-600 weight)

**Icons:** Font Awesome 6.5.1 (CDN loaded in `<head>`)

## Embed System

### How Embeds Work

Player auto-detects base URL and uses same-origin `proxy.php`:

```javascript
const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
const proxyUrl = `${baseUrl}proxy.php?url=${encodeURIComponent(feedUrl)}`;
```

**Deployment requirement:** Must upload `proxy.php` along with HTML/CSS/JS. Works on any PHP host (7.0+) with cURL enabled.

**Testing embeds locally:**
```html
<!-- In test-embed.html -->
<iframe src="http://localhost:8000?podcast=0&episode=2" width="100%" height="650"></iframe>
```

### URL Parameters

- `?podcast=0` - Load specific podcast by index
- `?episode=5` - Load specific episode by index
- Combined: `?podcast=0&episode=5`

Parsed in `loadFromUrlParams()` function.

## File Structure & Responsibilities

- `index.html` - Main player interface, sticky header/selector layout
- `script.js` - All logic: feed parsing, audio controls, state management (~900 lines)
- `styles.css` - Material Design dark/light themes, custom dropdown, compact spacing
- `proxy.php` - Server-side CORS proxy with domain whitelist
- `test-embed.html` - Iframe embed testing page with theme toggle

**Documentation files** (read when troubleshooting):
- `COMPLETE-AUDIT.md` - Architecture, performance, lazy loading rationale
- `player-errors.md` - CORS troubleshooting, common issues
- `EMBED-SOLUTION.md` - Deployment guide, embed code examples
- `THE-REAL-PROBLEM.md` - Feed URL validation, testing tools

## Audio Player Specifics

### Modal Player Pattern

Player opens in fixed-position overlay (`.player-modal`) at bottom of screen:

1. Click episode play button → triggers `playEpisodeInModal()`
2. Modal slides up with episode loaded
3. Close button or click outside pauses and hides modal

**Important:** Audio element is global (`#audio-element`), not duplicated in modal. Modal controls sync with same `<audio>`.

### Progress Bar Implementation

Two progress overlays:
- `.progress-buffered` - shows how much is loaded
- `.progress-filled` - shows playback position

Both animate width as percentages. Slider (`input[type="range"]`) is invisible overlay for seeking.

Update in `timeupdate` event → `updateProgress()` function.

## Performance Considerations

### Lazy Episode Loading

Episodes only load when podcast is selected. Check before fetching:

```javascript
if (state.currentPodcast.episodes.length === 0) {
    // First time - load now
    await loadSinglePodcast(state.currentPodcast);
}
```

Prevents loading 20 feeds × 10-50 episodes each on initial page load.

### Dropdown Performance

With 20+ podcasts, dropdown uses:
- Virtual scrolling (CSS: `max-height: 400px; overflow-y: auto`)
- Custom scrollbar for smooth experience
- Debounced search (if search feature added)

## Testing Checklist

Before committing changes:

- [ ] Test with `http://localhost:8000` (not file://)
- [ ] Verify first podcast loads in < 5 seconds
- [ ] Check browser console for CORS errors
- [ ] Test theme toggle (dark ↔ light)
- [ ] Play/pause, skip, volume, speed controls work
- [ ] Test on mobile viewport (responsive)
- [ ] Verify embed works in `test-embed.html`
- [ ] Check episode descriptions expand/collapse

## Common Gotchas

1. **Dropdown z-index issues** - Custom dropdown must be z-index: 10000 to appear over modal player
2. **HTML entity encoding** - Episode titles/descriptions need `decodeHtmlEntities()` before display
3. **Auto-play restrictions** - Browser blocks auto-play unless user interacted. Modal uses delayed play after animation.
4. **File:// protocol** - Will fail silently with CORS. Always detect and warn user.
5. **Episode images** - Try episode-specific image first, fallback to podcast image
6. **Sticky positioning** - Header (z-index: 100) + Selector (z-index: 99) must stack correctly

## When Something Breaks

1. **Feed won't load** → Check `player-errors.md`, verify RSS URL is correct (not admin page)
2. **CORS errors** → Verify running from http:// not file://, check proxy.php exists
3. **Slow loading** → Review lazy loading implementation in `COMPLETE-AUDIT.md`
4. **Embed fails** → Check proxy.php deployed, test proxy URL directly
5. **Theme not persisting** → Check localStorage key `'podcast-player-theme'`

## Code Style Conventions

- Use `const`/`let`, never `var`
- Async/await preferred over Promise chains
- CSS custom properties for all theming
- Font Awesome for icons (class names like `fa-solid fa-play`)
- Modular functions: One responsibility per function
- Console logs for loading progress (helps debugging RSS issues)

---

**Project Status:** Production-ready. Main player works perfectly with standard RSS feeds. Embed system tested and functional. See README.md for deployment guide.
