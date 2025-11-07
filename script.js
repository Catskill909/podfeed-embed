// ==========================================
// STATE MANAGEMENT
// ==========================================
const state = {
    podcasts: [],
    currentPodcast: null,
    currentEpisode: null,
    isPlaying: false,
    currentSpeed: 1
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const elements = {
    podcastSelect: document.getElementById('podcast-select'),
    coverArt: document.getElementById('cover-art'),
    episodeTitle: document.getElementById('episode-title'),
    podcastTitle: document.getElementById('podcast-title'),
    episodeDate: document.getElementById('episode-date'),
    episodeCount: document.getElementById('episode-count'),
    audioElement: document.getElementById('audio-element'),
    playPauseBtn: document.getElementById('play-pause'),
    playIcon: document.getElementById('play-icon'),
    skipBackwardBtn: document.getElementById('skip-backward'),
    skipForwardBtn: document.getElementById('skip-forward'),
    progressSlider: document.getElementById('progress-slider'),
    progressFilled: document.getElementById('progress-filled'),
    progressBuffered: document.getElementById('progress-buffered'),
    currentTime: document.getElementById('current-time'),
    durationTime: document.getElementById('duration-time'),
    volumeBtn: document.getElementById('volume-btn'),
    volumeIcon: document.getElementById('volume-icon'),
    volumeSlider: document.getElementById('volume-slider'),
    speedBtn: document.getElementById('speed-btn'),
    speedMenu: document.getElementById('speed-menu'),
    downloadBtn: document.getElementById('download-btn'),
    episodesList: document.getElementById('episodes-list'),
    embedCode: document.getElementById('embed-code'),
    copyEmbedBtn: document.getElementById('copy-embed'),
    copyNotification: document.getElementById('copy-notification'),
    loadingOverlay: document.getElementById('loading-overlay'),
    errorToast: document.getElementById('error-toast'),
    errorMessage: document.getElementById('error-message')
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorToast.classList.remove('hidden');
    setTimeout(() => {
        elements.errorToast.classList.add('hidden');
    }, 5000);
}

function showLoading(show = true, message = 'Loading podcasts...') {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
        const loadingText = elements.loadingOverlay.querySelector('p');
        if (loadingText) loadingText.textContent = message;
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

// ==========================================
// RSS FEED PARSING
// ==========================================
async function fetchWithFallback(url) {
    // Determine base URL for local proxy
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    
    const proxies = [
        { 
            name: 'Local Proxy', 
            url: `${baseUrl}proxy.php?url=${encodeURIComponent(url)}`, 
            parseJson: false,
            getContents: (data) => data
        },
        { 
            name: 'CorsProxy.io', 
            url: `https://corsproxy.io/?${encodeURIComponent(url)}`, 
            parseJson: false,
            getContents: (data) => data
        },
        { 
            name: 'AllOrigins', 
            url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, 
            parseJson: true,
            getContents: (data) => {
                // Check if content is base64 encoded (starts with data:)
                if (data.contents && data.contents.startsWith('data:')) {
                    try {
                        const base64Match = data.contents.match(/base64,(.+)/);
                        if (base64Match) {
                            return atob(base64Match[1]);
                        }
                    } catch (e) {
                        console.warn('Failed to decode base64:', e);
                    }
                }
                return data.contents;
            }
        },
        { 
            name: 'CodeTabs', 
            url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, 
            parseJson: false,
            getContents: (data) => data
        }
    ];
    
    let lastError;
    for (const proxy of proxies) {
        try {
            console.log(`Attempting to fetch via ${proxy.name}...`);
            const response = await fetch(proxy.url);
            if (!response.ok) {
                console.warn(`${proxy.name} returned status ${response.status}`);
                continue;
            }
            
            const data = proxy.parseJson ? await response.json() : await response.text();
            const contents = proxy.getContents(data);
            console.log(`✓ Successfully fetched via ${proxy.name}`);
            return contents;
        } catch (error) {
            console.warn(`${proxy.name} failed:`, error.message);
            lastError = error;
        }
    }
    
    throw new Error(`All CORS proxies failed. Last error: ${lastError?.message}`);
}

async function parseMasterFeed(xmlDoc) {
    const items = xmlDoc.querySelectorAll('item');
    
    console.log(`Found ${items.length} podcast feeds in master list`);
    
    // Extract all feed URLs first
    const feedList = [];
    items.forEach((item, i) => {
        const feedUrl = item.querySelector('link')?.textContent?.trim();
        const title = item.querySelector('title')?.textContent || `Podcast ${i + 1}`;
        const description = item.querySelector('description')?.textContent || '';
        
        if (feedUrl) {
            feedList.push({ url: feedUrl, title, description, id: i });
        }
    });
    
    if (feedList.length === 0) {
        console.error('No valid podcast feeds found in master list');
        return [];
    }
    
    // Load FIRST podcast immediately so user sees content quickly
    console.log(`📻 Loading first podcast: ${feedList[0].title}`);
    showLoading(true, `Loading ${feedList[0].title}...`);
    
    const firstPodcast = await loadSinglePodcast(feedList[0]);
    const podcasts = firstPodcast ? [firstPodcast] : [];
    
    // Start loading remaining podcasts in background
    if (feedList.length > 1) {
        console.log(`🔄 Loading ${feedList.length - 1} more podcasts in background...`);
        loadRemainingPodcastsInBackground(feedList.slice(1));
    }
    
    return podcasts;
}

async function loadSinglePodcast(feedInfo) {
    try {
        const feedText = await fetchWithFallback(feedInfo.url);
        const feedParser = new DOMParser();
        const feedXml = feedParser.parseFromString(feedText, 'text/xml');
        
        const parserError = feedXml.querySelector('parsererror');
        if (parserError) {
            console.warn(`❌ Failed to parse ${feedInfo.title}`);
            return null;
        }
        
        const podcastData = parsePodcastFeed(feedXml, feedInfo.id);
        if (podcastData && podcastData.episodes.length > 0) {
            podcastData.title = feedInfo.title;
            console.log(`✅ Loaded ${podcastData.episodes.length} episodes from ${feedInfo.title}`);
            return podcastData;
        }
    } catch (error) {
        console.warn(`❌ Failed to load ${feedInfo.title}:`, error.message);
    }
    return null;
}

function loadRemainingPodcastsInBackground(feedList) {
    let loaded = 1; // First podcast already loaded
    const total = feedList.length + 1;
    
    // Load podcasts one at a time in background
    (async () => {
        for (const feedInfo of feedList) {
            const podcast = await loadSinglePodcast(feedInfo);
            if (podcast) {
                state.podcasts.push(podcast);
                loaded++;
                
                // Add to dropdown dynamically
                const option = document.createElement('option');
                option.value = state.podcasts.length - 1;
                option.textContent = podcast.title;
                elements.podcastSelect.appendChild(option);
                
                console.log(`📥 Progress: ${loaded}/${total} podcasts loaded`);
            }
        }
        console.log(`🎉 All ${loaded} podcasts loaded successfully!`);
    })();
}

function parsePodcastFeed(xmlDoc, podcastId) {
    const channel = xmlDoc.querySelector('channel');
    if (!channel) {
        console.warn('No channel found in feed');
        return null;
    }
    
    const podcast = {
        id: podcastId,
        title: channel.querySelector('title')?.textContent || 'Untitled Podcast',
        description: channel.querySelector('description')?.textContent || '',
        image: getChannelImage(channel),
        link: channel.querySelector('link')?.textContent || '',
        episodes: []
    };
    
    const items = channel.querySelectorAll('item');
    items.forEach((item, episodeIndex) => {
        const episode = parseEpisode(item, episodeIndex);
        if (episode && episode.audioUrl) {
            podcast.episodes.push(episode);
        }
    });
    
    return podcast;
}

async function fetchRSSFeed() {
    showLoading(true);
    
    // Check if running from file:// protocol
    if (window.location.protocol === 'file:') {
        const errorMsg = 'Please run from a local server (http://localhost) not directly from file system. See player-errors.md for setup instructions.';
        console.error('❌ FILE PROTOCOL DETECTED');
        console.info('💡 Solution: Run "python3 -m http.server 8000" in terminal, then open http://localhost:8000');
        showError(errorMsg);
        showLoading(false);
        return;
    }
    
    try {
        // Master feed containing links to individual podcast feeds
        const masterFeedUrl = 'https://podcast.supersoul.top/feed.php';
        console.log('Fetching master feed from:', masterFeedUrl);
        
        const text = await fetchWithFallback(masterFeedUrl);
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('Parser error:', parserError.textContent);
            console.log('XML content:', text.substring(0, 500));
            throw new Error('Error parsing master feed');
        }
        
        // Parse master feed to get list of podcast feed URLs
        state.podcasts = await parseMasterFeed(xmlDoc);
        
        if (state.podcasts.length === 0) {
            console.log('Parsed XML:', xmlDoc);
            throw new Error('No podcasts found in feed');
        }
        
        populatePodcastDropdown();
        selectPodcast(0); // Load first podcast by default
        showLoading(false);
    } catch (error) {
        console.error('❌ Error fetching RSS feed:', error);
        
        let userMessage = 'Failed to load podcasts: ';
        if (error.message.includes('CORS') || error.message.includes('fetch')) {
            userMessage += 'Network access blocked. Make sure you\'re running from http://localhost (see player-errors.md)';
        } else if (error.message.includes('parsing')) {
            userMessage += 'Unable to read feed format';
        } else {
            userMessage += error.message;
        }
        
        showError(userMessage);
        showLoading(false);
    }
}



function getChannelImage(channel) {
    // Try multiple ways to get the image
    const imageUrl = channel.querySelector('image url')?.textContent;
    if (imageUrl) return imageUrl;
    
    const itunesImage = channel.querySelector('itunes\\:image, image[href]');
    if (itunesImage) {
        return itunesImage.getAttribute('href') || itunesImage.textContent;
    }
    
    return '';
}

function parseEpisode(item, episodeIndex) {
    const enclosure = item.querySelector('enclosure');
    
    // Get description from multiple possible elements
    let description = item.querySelector('description')?.textContent || 
                     item.querySelector('content\\:encoded')?.textContent || 
                     item.querySelector('summary')?.textContent || '';
    
    description = stripHtml(description);
    
    // Get duration
    let duration = item.querySelector('itunes\\:duration')?.textContent || 
                  item.querySelector('duration')?.textContent || '';
    
    // Get episode image (iTunes compliant)
    let image = item.querySelector('itunes\\:image')?.getAttribute('href') || '';
    
    const episode = {
        id: episodeIndex,
        title: item.querySelector('title')?.textContent || 'Untitled Episode',
        description: description,
        pubDate: item.querySelector('pubDate')?.textContent || '',
        audioUrl: enclosure?.getAttribute('url') || item.querySelector('link')?.textContent || '',
        duration: duration,
        type: enclosure?.getAttribute('type') || 'audio/mpeg',
        image: image
    };
    
    return episode;
}

// ==========================================
// PODCAST DROPDOWN
// ==========================================
function populatePodcastDropdown() {
    elements.podcastSelect.innerHTML = '';
    
    state.podcasts.forEach((podcast, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = podcast.title;
        elements.podcastSelect.appendChild(option);
    });
}

function selectPodcast(index) {
    state.currentPodcast = state.podcasts[index];
    if (!state.currentPodcast) return;
    
    // Pause any currently playing audio
    if (state.isPlaying) {
        elements.audioElement.pause();
    }
    
    elements.podcastSelect.value = index;
    updatePodcastMetadata();
    renderEpisodesList();
    
    // Load first episode
    if (state.currentPodcast.episodes.length > 0) {
        loadEpisode(state.currentPodcast.episodes[0]);
    }
}

function updatePodcastMetadata() {
    if (!state.currentPodcast) return;
    
    // Update cover art
    if (state.currentPodcast.image) {
        elements.coverArt.src = state.currentPodcast.image;
        elements.coverArt.classList.add('loaded');
        elements.coverArt.onerror = () => {
            elements.coverArt.classList.remove('loaded');
        };
    } else {
        elements.coverArt.classList.remove('loaded');
    }
    
    // Update episode count
    const episodeCount = state.currentPodcast.episodes.length;
    elements.episodeCount.textContent = `${episodeCount} episode${episodeCount !== 1 ? 's' : ''}`;
}

// ==========================================
// EPISODES LIST
// ==========================================
function renderEpisodesList() {
    if (!state.currentPodcast || state.currentPodcast.episodes.length === 0) {
        elements.episodesList.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">library_music</span>
                <p>No episodes available</p>
            </div>
        `;
        return;
    }
    
    elements.episodesList.innerHTML = '';
    
    state.currentPodcast.episodes.forEach(episode => {
        const episodeElement = createEpisodeElement(episode);
        elements.episodesList.appendChild(episodeElement);
    });
}

function createEpisodeElement(episode) {
    const div = document.createElement('div');
    div.className = 'episode-item';
    div.setAttribute('data-episode-id', episode.id);
    
    if (state.currentEpisode && state.currentEpisode.id === episode.id) {
        div.classList.add('active');
    }
    
    const formattedDate = episode.pubDate ? formatDate(episode.pubDate) : '';
    const description = episode.description || 'No description available';
    const duration = episode.duration ? formatDuration(episode.duration) : '';
    
    // Use episode image or fallback to podcast image
    const episodeImage = episode.image || state.currentPodcast.image || '';
    
    div.innerHTML = `
        ${episodeImage ? `<img src="${episodeImage}" alt="${episode.title}" class="episode-image" onerror="this.style.display='none'">` : ''}
        <div class="episode-content">
            <div class="episode-header">
                <h4 class="episode-item-title">${episode.title}</h4>
                <span class="episode-item-date">${formattedDate}</span>
            </div>
            <div class="episode-description-wrapper">
                <p class="episode-description" data-full-text="${description.replace(/"/g, '&quot;')}">${description}</p>
                <button class="expand-description-btn hidden" aria-label="Expand description">
                    <span class="material-symbols-outlined">expand_more</span>
                </button>
            </div>
            ${duration ? `<div class="episode-duration">${duration}</div>` : ''}
        </div>
    `;
    
    // Check if description is truncated and show expand button
    const descriptionEl = div.querySelector('.episode-description');
    const expandBtn = div.querySelector('.expand-description-btn');
    
    // Wait for next frame to check if text is truncated
    setTimeout(() => {
        if (descriptionEl.scrollHeight > descriptionEl.clientHeight) {
            expandBtn.classList.remove('hidden');
        }
    }, 0);
    
    // Handle expand/collapse
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger episode load
        descriptionEl.classList.toggle('expanded');
        const icon = expandBtn.querySelector('.material-symbols-outlined');
        if (descriptionEl.classList.contains('expanded')) {
            icon.textContent = 'expand_less';
            expandBtn.setAttribute('aria-label', 'Collapse description');
        } else {
            icon.textContent = 'expand_more';
            expandBtn.setAttribute('aria-label', 'Expand description');
        }
    });
    
    // Load episode on click (but not on expand button)
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.expand-description-btn')) {
            loadEpisode(episode);
        }
    });
    
    return div;
}

function formatDuration(duration) {
    // Duration can be in seconds or HH:MM:SS format
    if (duration.includes(':')) {
        return duration;
    }
    const seconds = parseInt(duration);
    return formatTime(seconds);
}

// ==========================================
// AUDIO PLAYER
// ==========================================
function loadEpisode(episode) {
    state.currentEpisode = episode;
    
    // Pause current audio if playing
    if (state.isPlaying) {
        elements.audioElement.pause();
    }
    
    // Reset audio state
    state.isPlaying = false;
    elements.audioElement.currentTime = 0;
    
    // Update metadata
    elements.episodeTitle.textContent = episode.title;
    elements.podcastTitle.textContent = state.currentPodcast.title;
    elements.episodeDate.textContent = episode.pubDate ? formatDate(episode.pubDate) : '';
    
    // Update active episode in list
    document.querySelectorAll('.episode-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.getAttribute('data-episode-id')) === episode.id) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    // Load audio
    elements.audioElement.src = episode.audioUrl;
    elements.audioElement.load();
    
    // Reset UI to stopped state
    updatePlayPauseButton(false);
    elements.progressFilled.style.width = '0%';
    elements.progressSlider.value = 0;
    elements.progressBuffered.style.width = '0%';
    elements.currentTime.textContent = '0:00';
    elements.durationTime.textContent = '0:00';
    
    // Enable download button
    elements.downloadBtn.disabled = false;
    
    // Update embed code
    updateEmbedCode();
}

function togglePlayPause() {
    if (!state.currentEpisode) return;
    
    if (state.isPlaying) {
        elements.audioElement.pause();
    } else {
        elements.audioElement.play();
    }
}

function updatePlayPauseButton(playing) {
    state.isPlaying = playing;
    elements.playIcon.textContent = playing ? 'pause' : 'play_arrow';
    elements.playPauseBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

function skipBackward() {
    elements.audioElement.currentTime = Math.max(0, elements.audioElement.currentTime - 15);
}

function skipForward() {
    elements.audioElement.currentTime = Math.min(
        elements.audioElement.duration,
        elements.audioElement.currentTime + 30
    );
}

function updateProgress() {
    const { currentTime, duration } = elements.audioElement;
    
    if (!isNaN(duration) && duration > 0) {
        const percent = (currentTime / duration) * 100;
        elements.progressFilled.style.width = `${percent}%`;
        elements.progressSlider.value = percent;
        elements.currentTime.textContent = formatTime(currentTime);
        elements.durationTime.textContent = formatTime(duration);
    }
}

function updateBuffered() {
    const { buffered, duration } = elements.audioElement;
    
    if (buffered.length > 0 && !isNaN(duration) && duration > 0) {
        const bufferedEnd = buffered.end(buffered.length - 1);
        const percent = (bufferedEnd / duration) * 100;
        elements.progressBuffered.style.width = `${percent}%`;
    }
}

function seekAudio(event) {
    const percent = parseFloat(event.target.value);
    const time = (percent / 100) * elements.audioElement.duration;
    elements.audioElement.currentTime = time;
}

// ==========================================
// VOLUME CONTROL
// ==========================================
function updateVolume(event) {
    const volume = parseInt(event.target.value) / 100;
    elements.audioElement.volume = volume;
    updateVolumeIcon(volume);
    
    // Update CSS variable for slider track
    elements.volumeSlider.style.setProperty('--volume-percent', `${event.target.value}%`);
}

function updateVolumeIcon(volume) {
    if (volume === 0) {
        elements.volumeIcon.textContent = 'volume_off';
    } else if (volume < 0.5) {
        elements.volumeIcon.textContent = 'volume_down';
    } else {
        elements.volumeIcon.textContent = 'volume_up';
    }
}

function toggleMute() {
    if (elements.audioElement.volume > 0) {
        elements.audioElement.dataset.previousVolume = elements.audioElement.volume;
        elements.audioElement.volume = 0;
        elements.volumeSlider.value = 0;
        updateVolumeIcon(0);
    } else {
        const previousVolume = parseFloat(elements.audioElement.dataset.previousVolume) || 1;
        elements.audioElement.volume = previousVolume;
        elements.volumeSlider.value = previousVolume * 100;
        updateVolumeIcon(previousVolume);
    }
    elements.volumeSlider.style.setProperty('--volume-percent', `${elements.volumeSlider.value}%`);
}

// ==========================================
// PLAYBACK SPEED
// ==========================================
function toggleSpeedMenu() {
    elements.speedMenu.classList.toggle('hidden');
}

function setPlaybackSpeed(speed) {
    state.currentSpeed = speed;
    elements.audioElement.playbackRate = speed;
    elements.speedBtn.querySelector('.speed-text').textContent = `${speed}x`;
    
    // Update active state
    document.querySelectorAll('.speed-option').forEach(option => {
        option.classList.remove('active');
        if (parseFloat(option.dataset.speed) === speed) {
            option.classList.add('active');
        }
    });
    
    elements.speedMenu.classList.add('hidden');
}

// ==========================================
// DOWNLOAD
// ==========================================
function downloadEpisode() {
    if (!state.currentEpisode) return;
    
    const a = document.createElement('a');
    a.href = state.currentEpisode.audioUrl;
    a.download = `${state.currentEpisode.title}.mp3`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==========================================
// EMBED CODE
// ==========================================
function updateEmbedCode() {
    const currentUrl = window.location.href.split('?')[0];
    const podcastId = state.currentPodcast.id;
    const episodeId = state.currentEpisode ? state.currentEpisode.id : 0;
    const embedUrl = `${currentUrl}?podcast=${podcastId}&episode=${episodeId}`;
    
    const embedCodeText = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
    elements.embedCode.querySelector('code').textContent = embedCodeText;
}

async function copyEmbedCode() {
    const codeText = elements.embedCode.textContent;
    
    try {
        await navigator.clipboard.writeText(codeText);
        elements.copyNotification.classList.remove('hidden');
        elements.copyEmbedBtn.querySelector('.copy-text').textContent = 'Copied!';
        
        setTimeout(() => {
            elements.copyNotification.classList.add('hidden');
            elements.copyEmbedBtn.querySelector('.copy-text').textContent = 'Copy';
        }, 3000);
    } catch (error) {
        console.error('Failed to copy:', error);
        showError('Failed to copy to clipboard');
    }
}

// ==========================================
// URL PARAMETERS
// ==========================================
function loadFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const podcastId = params.get('podcast');
    const episodeId = params.get('episode');
    
    if (podcastId !== null) {
        const podcast = state.podcasts[parseInt(podcastId)];
        if (podcast) {
            selectPodcast(parseInt(podcastId));
            
            if (episodeId !== null) {
                const episode = podcast.episodes[parseInt(episodeId)];
                if (episode) {
                    loadEpisode(episode);
                }
            }
        }
    }
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
function handleKeyboardShortcuts(event) {
    // Space: Play/Pause
    if (event.code === 'Space' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'SELECT') {
        event.preventDefault();
        togglePlayPause();
    }
    
    // Arrow Left: Skip backward
    if (event.code === 'ArrowLeft') {
        skipBackward();
    }
    
    // Arrow Right: Skip forward
    if (event.code === 'ArrowRight') {
        skipForward();
    }
    
    // M: Mute/Unmute
    if (event.code === 'KeyM') {
        toggleMute();
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function initEventListeners() {
    // Podcast selection
    elements.podcastSelect.addEventListener('change', (e) => {
        selectPodcast(parseInt(e.target.value));
    });
    
    // Audio events
    elements.audioElement.addEventListener('play', () => updatePlayPauseButton(true));
    elements.audioElement.addEventListener('pause', () => updatePlayPauseButton(false));
    elements.audioElement.addEventListener('timeupdate', updateProgress);
    elements.audioElement.addEventListener('progress', updateBuffered);
    elements.audioElement.addEventListener('loadedmetadata', () => {
        elements.durationTime.textContent = formatTime(elements.audioElement.duration);
    });
    elements.audioElement.addEventListener('ended', () => {
        // Auto-play next episode
        if (state.currentPodcast && state.currentEpisode) {
            const currentIndex = state.currentPodcast.episodes.findIndex(ep => ep.id === state.currentEpisode.id);
            if (currentIndex < state.currentPodcast.episodes.length - 1) {
                loadEpisode(state.currentPodcast.episodes[currentIndex + 1]);
                elements.audioElement.play();
            }
        }
    });
    
    // Player controls
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    elements.skipBackwardBtn.addEventListener('click', skipBackward);
    elements.skipForwardBtn.addEventListener('click', skipForward);
    elements.progressSlider.addEventListener('input', seekAudio);
    
    // Volume controls
    elements.volumeSlider.addEventListener('input', updateVolume);
    elements.volumeBtn.addEventListener('click', toggleMute);
    
    // Speed controls
    elements.speedBtn.addEventListener('click', toggleSpeedMenu);
    document.querySelectorAll('.speed-option').forEach(option => {
        option.addEventListener('click', () => {
            setPlaybackSpeed(parseFloat(option.dataset.speed));
        });
    });
    
    // Close speed menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.speedBtn.contains(e.target) && !elements.speedMenu.contains(e.target)) {
            elements.speedMenu.classList.add('hidden');
        }
    });
    
    // Download
    elements.downloadBtn.addEventListener('click', downloadEpisode);
    
    // Embed code
    elements.copyEmbedBtn.addEventListener('click', copyEmbedCode);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
    initEventListeners();
    await fetchRSSFeed();
    
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('podcast')) {
        loadFromUrlParams();
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
