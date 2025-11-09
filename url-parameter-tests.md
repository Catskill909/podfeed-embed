# URL Parameter Test Cases

## Test URLs to validate implementation:

### Basic Theme Testing:
- Light theme: `http://localhost:8000/index.html?theme=light`
- Dark theme: `http://localhost:8000/index.html?theme=dark`
- Auto theme: `http://localhost:8000/index.html?theme=auto`

### UI Component Hiding:
- Hide header: `http://localhost:8000/index.html?header=false`
- Hide selector: `http://localhost:8000/index.html?selector=false`
- Hide cover art: `http://localhost:8000/index.html?cover=false`
- Hide download buttons: `http://localhost:8000/index.html?download=false`
- Hide theme toggle: `http://localhost:8000/index.html?theme_toggle=false`

### Episode Controls:
- Alphabetical sort: `http://localhost:8000/index.html?sort=alphabetical`
- Oldest first: `http://localhost:8000/index.html?sort=oldest`
- Limit to 5 episodes: `http://localhost:8000/index.html?limit=5`

### Auto-play Testing:
- Auto-play first: `http://localhost:8000/index.html?autoplay=first`
- Auto-play latest: `http://localhost:8000/index.html?autoplay=latest`
- Auto-play specific: `http://localhost:8000/index.html?autoplay=specific&episode=2`

### Combined Testing:
- Full custom: `http://localhost:8000/index.html?theme=light&header=false&cover=false&sort=alphabetical&limit=10&autoplay=first`
- Minimal embed: `http://localhost:8000/index.html?header=false&selector=false&theme_toggle=false&download=false`

## Expected Results:

1. **Theme changes** should apply immediately on load
2. **Hidden components** should not be visible
3. **Episode sorting** should reorder the list
4. **Episode limiting** should show fewer episodes
5. **Auto-play** should start playing after a 1.5s delay
6. **Console logging** should show parameter processing

## Debug Tips:

1. Open browser developer tools (F12)
2. Check console for debug logs like:
   - "Loading URL parameters: theme=light&header=false"
   - "Applying theme from param: light"
   - "Applying UI visibility: {header: false, ...}"

3. If parameters aren't working:
   - Check if `loadFromUrlParams()` is being called
   - Verify parameters are being parsed correctly
   - Check if helper functions are executing