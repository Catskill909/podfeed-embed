# Iframe Embed Control System
## Planning Document for Custom Podcast Player Embeds

### Overview
Create a comprehensive control panel that allows users to customize and preview iframe embeds of the podcast player in real-time. This will be similar to YouTube's embed generator or WordPress widget customizers.

---

## Current State Analysis

### Existing URL Parameters (script.js)
- `?podcast=0` - Select default podcast by index
- `?episode=1` - Select specific episode by index
- Basic functionality exists but limited

### Current Player Features
- Dark/Light theme toggle
- Custom dropdown podcast selector
- Episode list with play buttons
- Modal player with full controls
- Responsive design

---

## Proposed Control Panel Features

### 1. **Iframe Dimensions Control**
```html
<!-- Width Controls -->
<label>Width:</label>
<input type="number" id="iframe-width-value" value="100" min="200" max="1200">
<select id="iframe-width-unit">
    <option value="%">%</option>
    <option value="px">px</option>
</select>

<!-- Height Controls -->
<label>Height:</label>
<input type="number" id="iframe-height-value" value="600" min="400" max="1000">
<select id="iframe-height-unit">
    <option value="px">px</option>
    <option value="vh">vh</option>
</select>
```

### 2. **Content & Behavior Controls**

#### **Default Podcast Selection**
```html
<label>Default Podcast:</label>
<select id="default-podcast">
    <option value="">First Available</option>
    <option value="0">Podcast 1</option>
    <option value="1">Podcast 2</option>
    <!-- Populated dynamically -->
</select>
```

#### **Episode Sorting**
```html
<label>Episode Order:</label>
<select id="episode-sort">
    <option value="newest">Newest First (Default)</option>
    <option value="oldest">Oldest First</option>
    <option value="alphabetical">Alphabetical</option>
</select>
```

#### **Auto-Play Behavior**
```html
<label>Auto-Play:</label>
<select id="autoplay-mode">
    <option value="none">No Auto-Play</option>
    <option value="first">Auto-Play First Episode</option>
    <option value="latest">Auto-Play Latest Episode</option>
    <option value="specific">Auto-Play Specific Episode</option>
</select>

<!-- Conditional specific episode selector -->
<div id="specific-episode-controls" class="hidden">
    <label>Episode Index:</label>
    <input type="number" id="autoplay-episode" value="0" min="0">
</div>
```

### 3. **UI Customization Controls**

#### **Theme Control**
```html
<label>Default Theme:</label>
<select id="default-theme">
    <option value="dark">Dark (Default)</option>
    <option value="light">Light</option>
    <option value="auto">System Preference</option>
</select>

<label>
    <input type="checkbox" id="hide-theme-toggle">
    Hide Theme Toggle Button
</label>
```

#### **Player Components Visibility**
```html
<fieldset>
    <legend>Show/Hide Components:</legend>
    
    <label>
        <input type="checkbox" id="show-header" checked>
        Show Header & Title
    </label>
    
    <label>
        <input type="checkbox" id="show-podcast-selector" checked>
        Show Podcast Selector
    </label>
    
    <label>
        <input type="checkbox" id="show-cover-art" checked>
        Show Podcast Cover Art
    </label>
    
    <label>
        <input type="checkbox" id="show-episode-metadata" checked>
        Show Episode Count & Info
    </label>
    
    <label>
        <input type="checkbox" id="show-download-buttons" checked>
        Show Download Buttons
    </label>
    
    <label>
        <input type="checkbox" id="show-episode-images">
        Show Individual Episode Images
    </label>
</fieldset>
```

#### **Player Behavior**
```html
<fieldset>
    <legend>Player Behavior:</legend>
    
    <label>
        <input type="checkbox" id="modal-player" checked>
        Use Modal Player (vs Inline)
    </label>
    
    <label>
        <input type="checkbox" id="continuous-play" checked>
        Auto-Play Next Episode
    </label>
    
    <label>
        <input type="checkbox" id="remember-position">
        Remember Playback Position
    </label>
    
    <label>
        <input type="checkbox" id="keyboard-shortcuts" checked>
        Enable Keyboard Shortcuts
    </label>
</fieldset>
```

### 4. **Advanced Display Controls**

#### **Episode List Limits**
```html
<label>Max Episodes Shown:</label>
<select id="episode-limit">
    <option value="">All Episodes</option>
    <option value="5">Latest 5</option>
    <option value="10">Latest 10</option>
    <option value="25">Latest 25</option>
    <option value="50">Latest 50</option>
</select>
```

#### **Custom CSS Injection**
```html
<label>Custom CSS (Advanced):</label>
<textarea id="custom-css" placeholder="/* Add custom styles here */
.episode-item { 
    border-radius: 10px; 
}"></textarea>
```

#### **Branding Options**
```html
<fieldset>
    <legend>Branding:</legend>
    
    <label>Custom Title:</label>
    <input type="text" id="custom-title" placeholder="Override default title">
    
    <label>
        <input type="checkbox" id="hide-branding">
        Hide "Podcast Player" Branding
    </label>
    
    <label>Custom Logo URL:</label>
    <input type="url" id="custom-logo" placeholder="https://example.com/logo.png">
</fieldset>
```

### 5. **Responsive & Accessibility**

#### **Mobile Optimization**
```html
<fieldset>
    <legend>Mobile Settings:</legend>
    
    <label>Mobile Height:</label>
    <input type="number" id="mobile-height" value="500" min="300" max="800">px
    
    <label>
        <input type="checkbox" id="mobile-fullscreen">
        Mobile Fullscreen Mode
    </label>
    
    <label>
        <input type="checkbox" id="hide-on-mobile">
        Hide Episode Images on Mobile
    </label>
</fieldset>
```

---

## Implementation Plan

### Phase 1: Basic Controls
1. **Create `iframe-generator.html`** - Main control panel page
2. **Iframe dimensions** (width/height with units)
3. **Basic URL parameters** (podcast, episode, theme)
4. **Real-time preview** iframe
5. **Copy embed code** button

### Phase 2: Content Controls
1. **Episode sorting** options
2. **Auto-play** controls
3. **Component visibility** toggles
4. **Episode limit** controls

### Phase 3: Advanced Features
1. **Custom CSS** injection
2. **Branding** options
3. **Mobile responsiveness** controls
4. **Accessibility** options

### Phase 4: Expert Features
1. **API integration** for custom feeds
2. **Analytics tracking** parameters
3. **Custom color schemes**
4. **Advanced layout options**

---

## URL Parameter Schema

### Proposed Complete URL Structure:
```
index.html?
podcast=0&              // Default podcast index
episode=1&              // Default episode index
theme=dark&             // dark|light|auto
autoplay=first&         // none|first|latest|specific
sort=newest&            // newest|oldest|alphabetical
limit=10&               // Number of episodes to show
header=false&           // Show/hide header
selector=true&          // Show/hide podcast selector
cover=true&             // Show/hide cover art
download=false&         // Show/hide download buttons
modal=true&             // Modal vs inline player
continuous=true&        // Auto-play next episode
custom_title=My%20Pod&  // Custom title
custom_css=base64...    // Base64 encoded CSS
```

---

## File Structure Plan

```
📁 custom-audio/
├── index.html                 // Main player (embed target)
├── iframe-generator.html      // NEW: Control panel
├── iframe-generator.css       // NEW: Control panel styles  
├── iframe-generator.js        // NEW: Control panel logic
├── script.js                  // Enhanced with new URL params
├── styles.css                 // Existing player styles
└── iframe-control.md          // This document
```

---

## Expert Web Engineering Recommendations

### 1. **Performance Optimizations**
- **Lazy loading** for episode images
- **Virtual scrolling** for large episode lists  
- **Debounced preview** updates (300ms delay)
- **Compressed URL parameters** using short codes

### 2. **Security Considerations**
- **Content Security Policy** for iframe embeds
- **HTTPS enforcement** for all embeds
- **Input sanitization** for custom CSS
- **XSS protection** for custom titles

### 3. **SEO & Analytics**
- **Structured data** for podcast episodes
- **Meta tags** for social media sharing
- **Google Analytics** integration option
- **Custom tracking** parameters

### 4. **Developer Experience**
- **JSON export/import** of configurations
- **Preset templates** (minimal, full-featured, mobile-only)
- **Preview device** simulation (desktop, tablet, mobile)
- **Code validation** and error handling

### 5. **Advanced Features**
- **Multi-language** support with i18n
- **Keyboard navigation** for accessibility
- **Screen reader** compatibility
- **High contrast** mode support

### 6. **Integration Features**
- **WordPress plugin** compatibility
- **React/Vue component** generation
- **AMP page** support
- **Progressive Web App** features

---

## Next Steps

1. **Create the iframe generator page** with basic controls
2. **Enhance index.html** to support new URL parameters
3. **Add real-time preview** functionality
4. **Implement responsive preview** modes
5. **Add preset templates** for common use cases

This system will make your podcast player extremely flexible for embedding across different websites with customized appearances and behaviors!