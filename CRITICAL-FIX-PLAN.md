# CRITICAL FIX PLAN - DROPDOWN BROKEN

## THE BREAKING CHANGE
We changed the data flow but didn't update all the dependent functions.

## ROOT CAUSE
**Line 350:** `state.podcasts = await parseMasterFeed(xmlDoc);`
- Returns array of 20 podcasts with EMPTY `episodes: []` arrays
- Only first podcast has episodes loaded

**Line 357:** `selectPodcast(0);`
- Expects `state.podcasts[0].episodes` to be populated
- Works for first podcast (episodes loaded)

**Problem:** When user clicks dropdown to select podcast 2-19:
- `selectPodcast(index)` is called
- That podcast has `episodes: []` (empty - not loaded yet!)
- `renderEpisodesList()` shows "No episodes available"
- Dropdown appears broken

## THE FIX

### Option 1: Load episodes on-demand (RECOMMENDED)
When user selects a podcast:
1. Check if `episodes.length === 0`
2. If empty, show loading spinner
3. Call `loadSinglePodcast(podcast)` to fetch episodes
4. Update podcast object with episodes
5. Render episodes list

### Option 2: Wait for all to load (SLOW)
Revert to old behavior - wait for all 20 podcasts to load before enabling dropdown
- Slow (20+ seconds)
- Bad UX
- Not recommended

## IMPLEMENTATION - Option 1

Modify `selectPodcast()` function:
```javascript
async function selectPodcast(index) {
    state.currentPodcast = state.podcasts[index];
    if (!state.currentPodcast) return;

    // Pause any currently playing audio
    if (state.isPlaying) {
        elements.audioElement.pause();
    }

    elements.podcastSelect.value = index;
    
    // If episodes not loaded yet, load them now
    if (state.currentPodcast.episodes.length === 0) {
        showLoading(true, `Loading ${state.currentPodcast.title}...`);
        
        const podcastWithEpisodes = await loadSinglePodcast(state.currentPodcast);
        if (podcastWithEpisodes) {
            state.currentPodcast.episodes = podcastWithEpisodes.episodes;
            state.currentPodcast.image = podcastWithEpisodes.image;
        }
        
        showLoading(false);
    }
    
    updatePodcastMetadata();
    renderEpisodesList();

    // Load first episode
    if (state.currentPodcast.episodes.length > 0) {
        loadEpisode(state.currentPodcast.episodes[0]);
    }
}
```

This way:
- Dropdown shows all 20 titles instantly ✅
- First podcast loads immediately ✅
- Other podcasts load ONLY when user selects them ✅
- Background loading still works for pre-caching ✅
- User experience is smooth ✅
