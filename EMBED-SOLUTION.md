# 🚀 Embed Solution Guide

## ✅ How This Works

Your podcast player now uses a **local PHP proxy** that solves ALL CORS issues for embeds!

### Architecture:

```
Browser → Your Player → proxy.php → RSS Feeds
  ↓
No CORS Issues! ✓
```

---

## 🧪 Local Testing (RIGHT NOW)

### Current Setup:
- ✅ PHP server running on `http://localhost:8000`
- ✅ `proxy.php` handling all feed requests
- ✅ Zero CORS errors
- ✅ Works in embeds locally

### Test Locally:

**1. Main Player:**
```
http://localhost:8000
```

**2. Test Embed:**
Create `test-embed.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Embed Test</title>
</head>
<body>
    <h1>Testing Embedded Player</h1>
    <iframe 
        src="http://localhost:8000?podcast=0&episode=0" 
        width="100%" 
        height="600" 
        frameborder="0">
    </iframe>
</body>
</html>
```

Open `test-embed.html` in browser - player works in iframe!

---

## 🌐 Production Deployment

### When You Deploy to Live Server:

**Upload these files:**
```
your-domain.com/
  ├── index.html
  ├── styles.css
  ├── script.js
  ├── proxy.php ⭐ (This is the magic!)
  └── (other files)
```

**That's it!** No code changes needed.

### How It Works in Production:

1. **Player automatically detects its own URL:**
   ```javascript
   const baseUrl = window.location.origin + window.location.pathname;
   // On localhost: http://localhost:8000/proxy.php
   // On live site: https://your-domain.com/player/proxy.php
   ```

2. **Proxy fetches feeds server-side:**
   - No CORS issues
   - Works in any iframe
   - Works on any website

3. **Fallback system:**
   - Tries local proxy first (best)
   - Falls back to CorsProxy.io
   - Falls back to AllOrigins
   - Falls back to CodeTabs

---

## 🔒 Security Features

### Built-in Protection:

**1. Domain Whitelist:**
```php
$allowedDomains = [
    'podcast.supersoul.top',
    'democracynow.org',
    'wpfwfm.org',
    // Only these domains allowed
];
```

**2. URL Validation:**
- Checks for valid URL format
- Prevents malicious requests
- Blocks non-HTTP protocols

**3. Rate Limiting (Optional):**
Add to `proxy.php` if needed:
```php
// Add at top of file
session_start();
$_SESSION['requests'] = ($_SESSION['requests'] ?? 0) + 1;
if ($_SESSION['requests'] > 100) {
    die('Rate limit exceeded');
}
```

---

## 📋 Deployment Checklist

### For ANY Web Host:

- [ ] Upload all files including `proxy.php`
- [ ] Ensure PHP 7.0+ is enabled
- [ ] Ensure cURL extension is enabled
- [ ] Test: `https://your-domain.com/proxy.php?url=https://podcast.supersoul.top/feed.php`
- [ ] Should return XML, not error

### Platform-Specific:

**Shared Hosting (cPanel, Bluehost, etc.):**
- ✅ Works out of the box
- ✅ PHP + cURL already enabled

**VPS/Cloud (AWS, DigitalOcean, etc.):**
```bash
# Install PHP if needed
sudo apt update
sudo apt install php php-curl
```

**Netlify/Vercel (Static Hosts):**
- ❌ Can't run PHP
- ✅ Use Netlify Functions or Vercel Serverless
- OR use external CORS proxy only

---

## 🎯 Embed Code Examples

### Basic Embed:
```html
<iframe 
    src="https://your-domain.com/player/" 
    width="100%" 
    height="600" 
    frameborder="0"
    allowfullscreen>
</iframe>
```

### Embed Specific Podcast:
```html
<iframe 
    src="https://your-domain.com/player/?podcast=0" 
    width="100%" 
    height="600" 
    frameborder="0">
</iframe>
```

### Embed Specific Episode:
```html
<iframe 
    src="https://your-domain.com/player/?podcast=0&episode=5" 
    width="100%" 
    height="600" 
    frameborder="0">
</iframe>
```

### Responsive Embed:
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

## 🧪 Testing Flow

### Development (Local):
1. ✅ Run PHP server: `php -S localhost:8000`
2. ✅ Test player: `http://localhost:8000`
3. ✅ Test embed: Create test HTML file
4. ✅ Verify no CORS errors in console

### Staging (Optional):
1. Upload to test subdomain: `test.your-domain.com`
2. Test all functionality
3. Test embeds from different domains

### Production:
1. Upload to live domain
2. Update embed codes (replace localhost with domain)
3. Test on actual embedding sites

---

## 🔧 Troubleshooting

### "proxy.php not found"
**Problem:** File not uploaded or wrong path  
**Solution:** Ensure `proxy.php` is in same directory as `index.html`

### "Domain not allowed"
**Problem:** Feed domain not in whitelist  
**Solution:** Add domain to `$allowedDomains` array in `proxy.php`

### "Failed to fetch feed"
**Problem:** cURL not enabled or timeout  
**Solution:** 
```bash
# Check PHP modules
php -m | grep curl

# Enable cURL
sudo apt install php-curl
```

### "Still getting CORS errors"
**Problem:** PHP proxy not being used  
**Solution:** Check browser console - should see "Attempting to fetch via Local Proxy"

---

## 📊 Performance

### Local Proxy Benefits:
- ⚡ **Faster:** No external proxy overhead
- 🔒 **Reliable:** No rate limits from third-party services
- 🎯 **Direct:** Straight to RSS source
- 💾 **Cacheable:** Add caching to proxy.php if needed

### Optional: Add Caching
```php
// At top of proxy.php
$cacheFile = 'cache/' . md5($feedUrl) . '.xml';
if (file_exists($cacheFile) && time() - filemtime($cacheFile) < 3600) {
    echo file_get_contents($cacheFile);
    exit;
}

// After curl_exec:
file_put_contents($cacheFile, $response);
```

---

## ✅ Summary

### Current Status:
- ✅ Works locally with PHP server
- ✅ Ready for production deployment
- ✅ No code changes needed when deploying
- ✅ Embeds work anywhere
- ✅ Secure with domain whitelist
- ✅ Fallback system for reliability

### To Deploy:
1. Upload all files to web host
2. Ensure PHP + cURL enabled
3. Test player URL
4. Generate embed codes
5. Done! 🎉

**You can test embeds RIGHT NOW locally, then deploy with confidence!**
