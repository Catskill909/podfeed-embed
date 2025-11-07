# 🎧 PodFeed Embed - Modern Podcast Player

A sleek, Material Design-inspired podcast player with dark mode theme and full embed support. Load multiple podcasts from a master feed and embed them anywhere!

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
- **Dropdown Selector:** Easy podcast switching
- **Progressive Loading:** First podcast loads instantly, others in background
- **Episode Images:** Displays episode artwork with podcast fallback
- **Expandable Descriptions:** Click arrow to expand full episode descriptions

### 🎨 Modern Design
- **Material Design:** Dark mode with purple/teal accent colors
- **Fully Responsive:** Works perfectly on mobile, tablet, and desktop
- **Smooth Animations:** Polished transitions and interactions
- **Accessibility:** Keyboard shortcuts and ARIA labels

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
