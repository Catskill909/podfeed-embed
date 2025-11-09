// Iframe Generator JavaScript
class IframeGenerator {
    constructor() {
        this.baseUrl = window.location.href.replace('iframe-generator.html', 'index.html');
        this.controls = {
            // Dimensions
            widthValue: document.getElementById('iframe-width-value'),
            widthUnit: document.getElementById('iframe-width-unit'),
            heightValue: document.getElementById('iframe-height-value'),
            heightUnit: document.getElementById('iframe-height-unit'),

            // Content
            defaultPodcast: document.getElementById('default-podcast'),
            episodeSort: document.getElementById('episode-sort'),
            episodeLimit: document.getElementById('episode-limit'),
            podcastDropdownOrder: document.getElementById('podcast-dropdown-order'),

            // Theme & UI
            defaultTheme: document.getElementById('default-theme'),
            hideThemeToggle: document.getElementById('hide-theme-toggle'),
            showHeader: document.getElementById('show-header'),
            showPodcastSelector: document.getElementById('show-podcast-selector'),
            showCoverArt: document.getElementById('show-cover-art'),
            showDownloadButtons: document.getElementById('show-download-buttons'),

            // Preview
            previewIframe: document.getElementById('preview-iframe'),
            iframeContainer: document.getElementById('iframe-container'),
            embedCodeDisplay: document.getElementById('embed-code-display'),

            // Actions
            copyEmbedCode: document.getElementById('copy-embed-code'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            toast: document.getElementById('toast')
        };

        this.deviceButtons = document.querySelectorAll('.device-btn');

        this.init();
    }

    init() {
        this.loadPodcastList();
        this.setupEventListeners();
        this.updatePreview();
    }

    async loadPodcastList() {
        try {
            console.log('Loading real podcast data from master feed...');

            // Use the same master feed URL as the main player
            const masterFeedUrl = 'https://podcast.supersoul.top/feed.php';

            // Try multiple CORS proxies like the main player does
            const proxies = [
                `https://corsproxy.io/?${encodeURIComponent(masterFeedUrl)}`,
                `https://api.allorigins.win/get?url=${encodeURIComponent(masterFeedUrl)}`
            ];

            let text = null;
            for (const proxyUrl of proxies) {
                try {
                    console.log('Trying proxy:', proxyUrl);
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        if (proxyUrl.includes('allorigins')) {
                            const json = await response.json();
                            text = json.contents;
                        } else {
                            text = await response.text();
                        }
                        break;
                    }
                } catch (proxyError) {
                    console.warn('Proxy failed:', proxyError);
                    continue;
                }
            }

            if (!text) {
                throw new Error('All proxies failed');
            }

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');

            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Failed to parse RSS feed');
            }

            const items = xmlDoc.querySelectorAll('item');
            const select = this.controls.defaultPodcast;

            // Clear existing options except first
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            // Add real podcast options exactly like the main player
            items.forEach((item, index) => {
                const title = item.querySelector('title')?.textContent || `Podcast ${index + 1}`;
                // Clean title - strip HTML and decode entities (same as main player)
                const cleanTitle = this.stripHtml(this.decodeHtmlEntities(title));

                const option = document.createElement('option');
                option.value = index; // Use index to match main player
                option.textContent = cleanTitle;
                select.appendChild(option);
            });

            console.log(`✅ Loaded ${items.length} podcasts for generator (matching main player)`);

        } catch (error) {
            console.error('Failed to load podcast list:', error);
            // Fall back to placeholder data
            this.loadPlaceholderPodcasts();
        }
    }

    loadPlaceholderPodcasts() {
        console.log('Using placeholder podcast data...');
        const podcasts = [
            { id: 1, title: 'Sample Podcast 1' },
            { id: 2, title: 'Sample Podcast 2' },
            { id: 3, title: 'Sample Podcast 3' }
        ];

        const select = this.controls.defaultPodcast;

        podcasts.forEach(podcast => {
            const option = document.createElement('option');
            option.value = podcast.id;
            option.textContent = podcast.title;
            select.appendChild(option);
        });
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    setupEventListeners() {
        // Dimension controls
        this.controls.widthValue.addEventListener('input', this.debounce(() => this.updatePreview(), 300));
        this.controls.widthUnit.addEventListener('change', () => this.updatePreview());
        this.controls.heightValue.addEventListener('input', this.debounce(() => this.updatePreview(), 300));
        this.controls.heightUnit.addEventListener('change', () => this.updatePreview());

        // Content controls
        this.controls.defaultPodcast.addEventListener('change', () => this.updatePreview());
        this.controls.episodeSort.addEventListener('change', () => this.updatePreview());
        this.controls.episodeLimit.addEventListener('change', () => this.updatePreview());
        this.controls.podcastDropdownOrder.addEventListener('change', () => this.updatePreview());

        // Theme & UI controls
        this.controls.defaultTheme.addEventListener('change', () => this.updatePreview());
        this.controls.hideThemeToggle.addEventListener('change', () => this.updatePreview());
        this.controls.showHeader.addEventListener('change', () => this.updatePreview());
        this.controls.showPodcastSelector.addEventListener('change', () => this.updatePreview());
        this.controls.showCoverArt.addEventListener('change', () => this.updatePreview());
        this.controls.showDownloadButtons.addEventListener('change', () => this.updatePreview());

        // Device preview buttons
        this.deviceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setPreviewDevice(btn.dataset.device);
            });
        });

        // Copy buttons
        this.controls.copyEmbedCode.addEventListener('click', () => this.copyToClipboard());
        this.controls.copyCodeBtn.addEventListener('click', () => this.copyToClipboard());
    }

    setPreviewDevice(device) {
        // Update active button
        this.deviceButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-device="${device}"]`).classList.add('active');

        // Update iframe container class
        const container = this.controls.iframeContainer;
        container.className = 'iframe-container';

        if (device === 'tablet') {
            container.classList.add('tablet');
        } else if (device === 'mobile') {
            container.classList.add('mobile');
        }
    }

    generateUrlParams() {
        const params = new URLSearchParams();

        // Default podcast
        if (this.controls.defaultPodcast.value) {
            params.append('podcast', this.controls.defaultPodcast.value);
        }

        // Episode sorting
        if (this.controls.episodeSort.value !== 'newest') {
            params.append('sort', this.controls.episodeSort.value);
        }

        // Episode limit
        if (this.controls.episodeLimit.value) {
            params.append('limit', this.controls.episodeLimit.value);
        }

        // Podcast dropdown order
        if (this.controls.podcastDropdownOrder.value !== 'feed') {
            params.append('podcast_order', this.controls.podcastDropdownOrder.value);
        }

        // Theme
        if (this.controls.defaultTheme.value !== 'dark') {
            params.append('theme', this.controls.defaultTheme.value);
        }

        // UI toggles
        if (this.controls.hideThemeToggle.checked) {
            params.append('theme_toggle', 'false');
        }

        if (!this.controls.showHeader.checked) {
            params.append('header', 'false');
        }

        if (!this.controls.showPodcastSelector.checked) {
            params.append('selector', 'false');
        }

        if (!this.controls.showCoverArt.checked) {
            params.append('cover', 'false');
        }

        if (!this.controls.showDownloadButtons.checked) {
            params.append('download', 'false');
        }

        return params.toString();
    }

    updatePreview() {
        const params = this.generateUrlParams();
        const embedUrl = params ? `${this.baseUrl}?${params}` : this.baseUrl;

        console.log('Updating preview with URL:', embedUrl);

        // Force iframe reload with timestamp to avoid caching
        const iframe = this.controls.previewIframe;
        const cacheBuster = Date.now();
        const finalUrl = params ? `${embedUrl}&_t=${cacheBuster}` : `${embedUrl}?_t=${cacheBuster}`;

        // Force complete reload
        iframe.src = 'about:blank';

        setTimeout(() => {
            iframe.src = finalUrl;
        }, 150);

        // Update iframe dimensions
        const width = this.controls.widthValue.value + this.controls.widthUnit.value;
        const height = this.controls.heightValue.value + this.controls.heightUnit.value;

        // Apply dimensions to iframe itself for accurate preview
        iframe.style.width = width;
        iframe.style.height = height;

        // Update embed code display (without cache buster)
        this.updateEmbedCode(embedUrl, width, height);
    }

    updateEmbedCode(url, width, height) {
        const embedCode = `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;

        // Update the code display with syntax highlighting
        this.controls.embedCodeDisplay.innerHTML = this.highlightCode(embedCode);
    }

    highlightCode(code) {
        // Simple syntax highlighting for HTML
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(&lt;\/?)(\\w+)/g, '$1<span style="color: var(--md-primary)">$2</span>')
            .replace(/(\\w+)(=)/g, '<span style="color: #e91e63">$1</span>$2')
            .replace(/(=)(&quot;[^&]*&quot;)/g, '$1<span style="color: #4caf50">$2</span>');
    }

    async copyToClipboard() {
        const embedCode = this.controls.embedCodeDisplay.textContent;

        try {
            await navigator.clipboard.writeText(embedCode);
            this.showToast('Copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);

            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = embedCode;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                this.showToast('Copied to clipboard!');
            } catch (fallbackError) {
                this.showToast('Failed to copy to clipboard', 'error');
            }

            document.body.removeChild(textArea);
        }
    }

    showToast(message, type = 'success') {
        const toast = this.controls.toast;
        const toastText = toast.querySelector('.toast-text');
        const toastIcon = toast.querySelector('.material-icons');

        toastText.textContent = message;

        if (type === 'error') {
            toastIcon.textContent = 'error';
            toastIcon.style.color = 'var(--md-error)';
        } else {
            toastIcon.textContent = 'check_circle';
            toastIcon.style.color = 'var(--md-success)';
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Utility function to debounce rapid input changes
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new IframeGenerator();
});

// Add some smooth animations
document.addEventListener('DOMContentLoaded', () => {
    // Animate controls on load
    const controlSections = document.querySelectorAll('.control-section');
    controlSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';

        setTimeout(() => {
            section.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Animate preview panel
    const previewPanel = document.querySelector('.preview-panel');
    previewPanel.style.opacity = '0';
    previewPanel.style.transform = 'translateX(20px)';

    setTimeout(() => {
        previewPanel.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        previewPanel.style.opacity = '1';
        previewPanel.style.transform = 'translateX(0)';
    }, 200);
});