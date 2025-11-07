# 🎧 PodFeed Embed - Modern Podcast Player

A sleek, ultra-compact podcast player with custom-styled dropdown, dark mode theme, and full embed support. Load multiple podcasts from a master feed and embed them anywhere!

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.0%2B-purple.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)

---

## ✨ Features

### 🎵 Full-Featured Audio Player
- **Playback Controls:** Play/pause, skip forward/backward (15s/30s)
- **Volume Control:** Slider with mute toggle
- **Playback Speed:** 0.5x to 2x speed control
- **Progress Scrubber:** Visual progress with buffering indicator
- **Time Display:** Current time and total duration
- **Download:** Direct episode download
- **Auto-play:** Automatically plays next episode

### 📻 Multi-Podcast Support
- **Master Feed System:** Load multiple podcasts from a single feed
- **Custom Styled Dropdown:** Beautiful Material Design dropdown (not native browser select)
- **Instant Loading:** All 20 podcast titles appear immediately
- **On-Demand Episodes:** Episodes load only when podcast is selected
- **Episode Images:** Displays episode artwork with podcast fallback
- **Expandable Descriptions:** Click arrow to expand full episode descriptions
- **Smart Scrolling:** Episodes list resets to top when switching podcasts

### 🎨 Modern Ultra-Compact Design
- **Oswald Headers:** Bold, uppercase headers (600-700 weight)
- **Inter Body Text:** Clean, readable body text (400-600 weight)
- **Font Awesome 6.5.1:** Modern icon system
- **Dark Mode:** Black background (#0A0A0A) with purple accents
- **Minimal Spacing:** Compact design with 4px-24px spacing scale
- **Sharp Corners:** No rounded borders on images for modern look
- **Sticky Navigation:** Header and dropdown stay visible while scrolling
- **Fully Responsive:** Works perfectly on mobile, tablet, and desktop

### 🔽 Custom Dropdown
- **Material Design:** Subtle borders with hint of purple on hover
- **Smooth Animations:** Fade in/out, chevron rotates when open
- **Styled Options:** Dark background (#1E1E1E) with white text
- **Purple Highlights:** Selected item shows purple text (not bright background)
- **Custom Scrollbar:** Matches dark theme
- **High Z-Index:** Always appears above all content

### 🔗 Embed Anywhere
- **Universal Embeds:** Works on any website via iframe
- **No CORS Issues:** Built-in PHP proxy for seamless feed fetching
- **Copy to Clipboard:** One-click embed code generation
- **Customizable:** Support for URL parameters (podcast/episode selection)

---

## 🚀 Quick Start

### Local Development

**Option 1: PHP (Recommended for Embed Testing)**
```bash
cd custom-audio
php -S localhost:8000
```

**Option 2: Python**
```bash
cd custom-audio
python3 -m http.server 8000
```

**Option 3: Node.js**
```bash
cd custom-audio
npx http-server -p 8000
```

Then open: **http://localhost:8000**

---

## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/Catskill909/podfeed-embed.git
cd podfeed-embed
```

### 2. Start Development Server
```bash
php -S localhost:8000
```

### 3. Open Browser
```
http://localhost:8000
```

### 4. Test Embeds
```
http://localhost:8000/test-embed.html
```

---

## 🌐 Deployment

### Requirements
- PHP 7.0 or higher
- cURL extension enabled
- Web server (Apache, Nginx, etc.)

### Deploy Steps

1. **Upload Files** to your web host:
   ```
   your-domain.com/
   ├── index.html
   ├── styles.css
   ├── script.js
   ├── proxy.php          ⭐ Required for embeds!
   ├── test-embed.html
   └── (other files)
   ```

2. **Verify PHP & cURL:**
   ```bash
   php -v                 # Check PHP version
   php -m | grep curl     # Check cURL is enabled
   ```

3. **Test Proxy:**
   ```
   https://your-domain.com/proxy.php?url=https://podcast.supersoul.top/feed.php
   ```
   Should return XML (not error).

4. **Done!** Player auto-detects its location and works everywhere.

---

## 🎯 How It Works

### Master Feed Architecture

```
Master Feed (feed.php)
  ├── Podcast 1 → Individual RSS Feed
  ├── Podcast 2 → Individual RSS Feed
  ├── Podcast 3 → Individual RSS Feed
  └── ... (20+ podcasts)
```

1. Player fetches master feed from `https://podcast.supersoul.top/feed.php`
2. Each `<item>` contains a `<link>` to an individual podcast RSS feed
3. First podcast loads immediately (3-5 seconds)
4. Remaining podcasts load in background
5. Each podcast appears in dropdown as it loads

### Proxy System

```
Browser → Your Player → proxy.php → RSS Feeds
                         ↓
                   No CORS Issues! ✓
```

- **Local proxy first:** Direct server-side fetching
- **Fallback proxies:** CorsProxy.io, AllOrigins, CodeTabs
- **Automatic:** No configuration needed
- **Secure:** Domain whitelist protection

---

## 🔗 Embed Code

### Basic Embed
```html
<iframe 
    src="https://your-domain.com/player/" 
    width="100%" 
    height="600" 
    frameborder="0">
</iframe>
```

### Specific Podcast
```html
<iframe 
    src="https://your-domain.com/player/?podcast=0" 
    width="100%" 
    height="600" 
    frameborder="0">
</iframe>
```

### Specific Episode
```html
<iframe 
    src="https://your-domain.com/player/?podcast=0&episode=5" 
    width="100%" 
    height="600" 
    frameborder="0">
</iframe>
```

### Responsive (16:9)
```html
<div style="position: relative; padding-bottom: 56.25%; height: 0;">
    <iframe 
        src="https://your-domain.com/player/" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        frameborder="0">
    </iframe>
</div>
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Skip backward 15s |
| `→` | Skip forward 30s |
| `M` | Mute/Unmute |

---

## � Project Structure

```
podfeed-embed/
├── index.html              # Main player interface
├── styles.css              # Material Design styling
├── script.js               # Player logic and feed parsing
├── proxy.php               # RSS feed proxy (CORS solution)
├── test-embed.html         # Embed testing page
├── README.md               # This file
├── EMBED-SOLUTION.md       # Detailed embed guide
├── COMPLETE-AUDIT.md       # Architecture documentation
├── player-errors.md        # Troubleshooting guide
└── THE-REAL-PROBLEM.md     # Feed architecture explanation
```

---

## �️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Design:** Material Design (Dark Mode)
- **Fonts:** Google Fonts (Roboto)
- **Icons:** Material Symbols
- **Backend:** PHP 7.0+ (for proxy)
- **RSS Parsing:** DOMParser API
- **Audio:** HTML5 Audio API

---

## 🎨 Customization

### Change Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #BB86FC;        /* Purple accent */
    --secondary: #03DAC6;      /* Teal accent */
    --background: #121212;     /* Dark background */
}
```

### Change Master Feed
Edit in `script.js`:
```javascript
const masterFeedUrl = 'https://your-feed-url.com/feed.php';
```

### Add Allowed Domains
Edit in `proxy.php`:
```php
$allowedDomains = [
    'podcast.supersoul.top',
    'your-domain.com',
    // Add more domains here
];
```

---

## 🐛 Troubleshooting

### Player Won't Load
✅ Run from `http://localhost`, not `file://`  
✅ Check browser console (F12) for errors  
✅ Verify internet connection  

### CORS Errors
✅ Ensure PHP server is running (not Python/Node)  
✅ Check `proxy.php` exists in correct location  
✅ Verify cURL is enabled: `php -m | grep curl`  

### Embeds Not Working
✅ Upload `proxy.php` to server  
✅ Test proxy URL directly in browser  
✅ Check PHP error logs  
✅ See `EMBED-SOLUTION.md` for detailed guide  

### Episodes Not Loading
✅ Check master feed is accessible  
✅ Verify individual feed URLs are valid  
✅ Look for console errors during loading  

---

## � Documentation

- **[EMBED-SOLUTION.md](EMBED-SOLUTION.md)** - Complete embed guide
- **[COMPLETE-AUDIT.md](COMPLETE-AUDIT.md)** - Architecture & performance
- **[player-errors.md](player-errors.md)** - Error troubleshooting
- **[THE-REAL-PROBLEM.md](THE-REAL-PROBLEM.md)** - Feed architecture explained

---

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - Feel free to use in personal and commercial projects.

---

## 🙏 Acknowledgments

- Material Design by Google
- RSS feed architecture by SuperSoul.top
- Podcast feeds from various sources (Democracy Now, WPFW, etc.)

---

## � Support

- **Issues:** [GitHub Issues](https://github.com/Catskill909/podfeed-embed/issues)
- **Docs:** See documentation files in repository
- **Testing:** Use `test-embed.html` for local testing

---

## 🚀 Live Demo

*Coming soon - deploy your own instance!*

---


**Built with ❤️ for podcast enthusiasts**

---

## 📝 Recent Updates (November 2025)

### Custom Dropdown Implementation
- ✅ **Replaced native `<select>`** with custom Material Design dropdown
- ✅ **Instant loading**: All 20 podcast titles appear immediately from master feed
- ✅ **On-demand episodes**: Episodes load only when podcast selected (faster UI)
- ✅ **Beautiful styling**: Dark theme (#1E1E1E) with white text and purple highlights
- ✅ **Smooth animations**: Fade in/out, chevron rotation, subtle shadows
- ✅ **High z-index (10000)**: Dropdown always appears above all content
- ✅ **Material Design borders**: Subtle gray with purple hint on hover

### Ultra-Compact Design Overhaul
- ✅ **Typography upgrade**: Oswald bold headers + Inter body text
- ✅ **Font Awesome 6.5.1**: Replaced Material Symbols with modern FA icons
- ✅ **Minimal spacing scale**: 4px-24px (reduced from previous larger spacing)
- ✅ **Sharp corners**: Removed border-radius from images for modern aesthetic
- ✅ **Sticky navigation**: Header (z-index: 100) and dropdown stay visible
- ✅ **Optimized layout**: Reduced vertical space while maintaining readability

### Performance & UX Improvements
- ✅ **Master feed optimization**: Extracts all podcast data instantly (<100ms)
- ✅ **Smart loading**: Background pre-caching while first podcast plays
- ✅ **Episode scroll reset**: List scrolls to top when switching podcasts
- ✅ **Memory efficiency**: Episodes cached after first load
- ✅ **Proper z-index hierarchy**: Dropdown (10000) > Selector (100) > Player (50)
- ✅ **Embed-ready padding**: Proper alignment in iframe embeds

### Bug Fixes
- ✅ Fixed dropdown text stuck on "Loading podcasts..."
- ✅ Fixed dropdown appearing behind player/episodes content
- ✅ Fixed chevron icon touching dropdown border
- ✅ Fixed "SELECT PODCAST" label alignment with content below
- ✅ Fixed episodes not refreshing when switching podcasts
- ✅ Removed overly bright purple backgrounds (subtle highlights only)

````
