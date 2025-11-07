// ==========================================
// THEME MANAGEMENT
// ==========================================
const THEME_KEY = 'podcast-player-theme';

function initTheme() {
    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeToggle(next);
}

function updateThemeToggle(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
}

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
    dropdownSelected: document.getElementById('dropdown-selected'),
    dropdownOptions: document.getElementById('dropdown-options'),
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

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
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

    console.log(`Found ${items.length} podcasts in master feed`);

    // Extract ALL podcast info from master feed
    const podcasts = [];
    items.forEach((item, i) => {
        const feedUrl = item.querySelector('link')?.textContent?.trim();
        const title = item.querySelector('title')?.textContent || `Podcast ${i + 1}`;
        const description = item.querySelector('description')?.textContent || '';
        const coverImage = item.querySelector('enclosure[type="image/jpeg"]')?.getAttribute('url') || '';
        const episodeCount = item.querySelector('episodeCount')?.textContent || '0';
        const latestDate = item.querySelector('latestEpisodeDate')?.textContent || '';

        if (feedUrl) {
            podcasts.push({
                url: feedUrl,
                title,
                description,
                id: i,
                coverImage,
                episodeCount: parseInt(episodeCount) || 0,
                latestDate,
                episodes: [] // Episodes will be loaded on demand
            });
        }
    });

    console.log(`✅ Loaded ${podcasts.length} podcasts instantly from master feed`);

    if (podcasts.length === 0) {
        console.error('No valid podcasts found in master feed');
        return [];
    }

    // Populate dropdown immediately with ALL podcast titles
    populatePodcastDropdown(podcasts);

    // Load FIRST podcast's episodes only
    console.log(`📻 Loading episodes for: ${podcasts[0].title}`);
    showLoading(true, `Loading ${podcasts[0].title}...`);

    const firstWithEpisodes = await loadSinglePodcast(podcasts[0]);
    if (firstWithEpisodes) {
        podcasts[0].episodes = firstWithEpisodes.episodes;
        podcasts[0].image = firstWithEpisodes.image;
    }

    // Background load episodes for remaining podcasts (NO DROPDOWN TOUCHING!)
    if (podcasts.length > 1) {
        console.log(`🔄 Loading episodes for ${podcasts.length - 1} more podcasts in background...`);
        loadRemainingPodcastsInBackground(podcasts);
    }

    return podcasts; // Return ALL podcasts with first one's episodes loaded
}

function populatePodcastDropdown(podcasts) {
    // Clear custom dropdown options
    elements.dropdownOptions.innerHTML = '';

    // Clear hidden select options
    while (elements.podcastSelect.options.length > 1) {
        elements.podcastSelect.remove(1);
    }

    // Add all podcasts to both dropdowns
    podcasts.forEach((podcast, index) => {
        // Custom dropdown option
        const div = document.createElement('div');
        div.className = 'dropdown-option';
        if (index === 0) div.classList.add('selected');
        div.textContent = podcast.title;
        div.dataset.index = index;
        div.dataset.feedUrl = podcast.url;
        elements.dropdownOptions.appendChild(div);

        // Hidden select option (for compatibility)
        const option = document.createElement('option');
        option.value = podcast.id;
        option.textContent = podcast.title;
        option.dataset.feedUrl = podcast.url;
        elements.podcastSelect.appendChild(option);
    });

    // Set first podcast as selected in the dropdown display
    if (podcasts.length > 0) {
        elements.dropdownSelected.querySelector('.selected-text').textContent = podcasts[0].title;
    }

    console.log(`📋 Added ${podcasts.length} podcasts to dropdown`);

    // Initialize custom dropdown listeners
    initCustomDropdown();
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

async function loadRemainingPodcastsInBackground(podcastList) {
    console.log(`Starting background load of episodes for ${podcastList.length - 1} podcasts...`);

    for (let i = 1; i < podcastList.length; i++) {
        const podcast = podcastList[i];

        console.log(`Progress: ${i}/${podcastList.length - 1} - Loading episodes for ${podcast.title}`);

        try {
            const podcastWithEpisodes = await loadSinglePodcast(podcast);

            if (podcastWithEpisodes) {
                // Update the podcast in the list with episode data
                podcast.episodes = podcastWithEpisodes.episodes;
                podcast.image = podcastWithEpisodes.image;
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.warn(`Failed to load episodes for ${podcast.title}:`, error.message);
        }
    }

    console.log(`✅ All podcast episodes loaded successfully!`);
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

        // Dropdown already populated in parseMasterFeed()
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
    description = decodeHtmlEntities(description);

    // Get duration
    let duration = item.querySelector('itunes\\:duration')?.textContent ||
        item.querySelector('duration')?.textContent || '';

    // Get episode image (iTunes compliant)
    let image = item.querySelector('itunes\\:image')?.getAttribute('href') || '';

    // Get title and decode HTML entities
    let title = item.querySelector('title')?.textContent || 'Untitled Episode';
    title = decodeHtmlEntities(title);

    const episode = {
        id: episodeIndex,
        title: title,
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
async function selectPodcast(index) {
    state.currentPodcast = state.podcasts[index];
    if (!state.currentPodcast) return;

    // Pause any currently playing audio
    if (state.isPlaying) {
        elements.audioElement.pause();
    }

    elements.podcastSelect.value = index;

    // If episodes not loaded yet, load them now (on-demand loading)
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

    // Load first episode and scroll to top of episodes list
    if (state.currentPodcast.episodes.length > 0) {
        loadEpisode(state.currentPodcast.episodes[0]);

        // Scroll episodes list to top
        if (elements.episodesList) {
            elements.episodesList.scrollTop = 0;
        }
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
                <button class="expand-description-btn" aria-label="Expand description">
                    <i class="fa-solid fa-chevron-down"></i>
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
            expandBtn.classList.add('visible');
        } else {
            expandBtn.classList.remove('visible');
        }
    }, 0);

    // Handle expand/collapse
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger episode load
        descriptionEl.classList.toggle('expanded');
        expandBtn.classList.toggle('expanded');
        const icon = expandBtn.querySelector('i');
        if (descriptionEl.classList.contains('expanded')) {
            icon.className = 'fa-solid fa-chevron-up';
            expandBtn.setAttribute('aria-label', 'Collapse description');
        } else {
            icon.className = 'fa-solid fa-chevron-down';
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
    // Font Awesome icons: fa-circle-play for play, fa-circle-pause for pause
    elements.playIcon.className = playing ? 'fa-solid fa-circle-pause' : 'fa-solid fa-circle-play';
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
    // Font Awesome volume icons
    if (volume === 0) {
        elements.volumeIcon.className = 'fa-solid fa-volume-xmark';
    } else if (volume < 0.5) {
        elements.volumeIcon.className = 'fa-solid fa-volume-low';
    } else {
        elements.volumeIcon.className = 'fa-solid fa-volume-high';
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
// CUSTOM DROPDOWN
// ==========================================
function initCustomDropdown() {
    // Toggle dropdown
    elements.dropdownSelected.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.dropdownOptions.classList.toggle('open');
        elements.dropdownSelected.classList.toggle('active');
    });

    // Select option
    elements.dropdownOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-option')) {
            const index = parseInt(e.target.dataset.index);
            const text = e.target.textContent;

            // Update selected text
            elements.dropdownSelected.querySelector('.selected-text').textContent = text;

            // Update selected state
            document.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');

            // Close dropdown
            elements.dropdownOptions.classList.remove('open');
            elements.dropdownSelected.classList.remove('active');

            // Trigger podcast selection
            selectPodcast(index);
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.dropdownSelected.contains(e.target) && !elements.dropdownOptions.contains(e.target)) {
            elements.dropdownOptions.classList.remove('open');
            elements.dropdownSelected.classList.remove('active');
        }
    });
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function initEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

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
    initTheme(); // Initialize theme before anything else
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
