document.addEventListener('DOMContentLoaded', async () => {
    // State
    const state = {
        enabled: false,
        search: '',
        selectedFont: '', // This will now store the KEY (e.g., 'courierNew')
        theme: 'none', // 'none', 'dark', 'sepia', 'gray'
        currentHost: '',
        allFonts: {},
        filteredFonts: []
    };

    // Elements
    const toggleExtension = document.getElementById('toggleExtension');
    const searchInput = document.getElementById('searchInput');
    const fontList = document.getElementById('fontList');
    const statusActive = document.getElementById('statusActive');
    const statusDisabled = document.getElementById('statusDisabled');
    const fontItemTemplate = document.getElementById('fontItemTemplate');
    const themeBtns = document.querySelectorAll('.theme-btn');

    // Initialization
    try {
        const response = await fetch('fonts.json');
        if (!response.ok) throw new Error('Failed to load fonts.json');
        state.allFonts = await response.json();
    } catch (e) {
        console.error('Failed to load fonts:', e);
        state.allFonts = {
            "inter": { "name": "Inter", "type": "google", "url": "" },
            "arial": { "name": "Arial", "type": "system", "url": "" }
        };
    }

    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
        try {
            const url = new URL(tab.url);
            state.currentHost = url.hostname;
        } catch (e) {
            console.error('Invalid URL:', e);
            state.currentHost = 'unknown';
        }
    }

    // Load saved settings
    loadSettings();

    // Event Listeners
    toggleExtension.addEventListener('change', (e) => {
        state.enabled = e.target.checked;
        saveState();
        updateStatusUI();
    });



    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.theme = btn.dataset.theme;
            saveState();
            updateThemeUI();
        });
    });

    searchInput.addEventListener('input', (e) => {
        state.search = e.target.value.toLowerCase();
        renderFonts();
    });

    // Functions
    function loadSettings() {
        chrome.storage.local.get(['siteSettings'], (result) => {
            const siteSettings = result.siteSettings || {};
            const currentSiteSettings = siteSettings[state.currentHost];

            if (currentSiteSettings) {
                // Load site specific settings
                state.enabled = currentSiteSettings.enabled;
                state.selectedFont = currentSiteSettings.selectedFont;
                state.theme = currentSiteSettings.theme || 'none';
            } else {
                // Default to disabled/none if no settings for this site
                state.enabled = false;
                state.selectedFont = '';
                state.theme = 'none';
            }

            // Migration check: if selectedFont is a name (old format) and not in keys, try to find key
            if (state.selectedFont && !state.allFonts[state.selectedFont]) {
                const foundEntry = Object.entries(state.allFonts).find(([key, val]) => val.name === state.selectedFont);
                if (foundEntry) {
                    state.selectedFont = foundEntry[0]; // Update to key
                    saveState(); // Save migration
                }
            }

            updateUI();
            renderFonts();
        });
    }

    function saveState() {
        chrome.storage.local.get(['siteSettings'], (result) => {
            let siteSettings = result.siteSettings || {};

            // Determine font type from selected font
            const fontData = state.allFonts[state.selectedFont];
            const fontType = fontData ? fontData.type : 'google';

            const newSettings = {
                enabled: state.enabled,
                fontType: fontType,
                selectedFont: state.selectedFont,
                fontData: fontData,
                theme: state.theme
            };

            siteSettings[state.currentHost] = newSettings;
            chrome.storage.local.set({ siteSettings });

            updateContentScript();
        });
    }

    function updateUI() {
        toggleExtension.checked = state.enabled;
        updateThemeUI();
        updateStatusUI();
    }

    function updateThemeUI() {
        themeBtns.forEach(btn => {
            if (btn.dataset.theme === state.theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function updateStatusUI() {
        if (state.enabled) {
            statusActive.style.display = 'inline';
            statusDisabled.style.display = 'none';
        } else {
            statusActive.style.display = 'none';
            statusDisabled.style.display = 'inline';
        }
    }

    function renderFonts() {
        fontList.innerHTML = '';

        // Use Object.entries to get keys
        const fonts = Object.entries(state.allFonts)
            .map(([key, font]) => ({ key, ...font }))
            .filter(font => font.name.toLowerCase().includes(state.search))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (fonts.length === 0) {
            const li = document.createElement('li');
            li.className = 'font-item';
            li.style.justifyContent = 'center';
            li.style.color = 'var(--pico-muted-color)';
            li.style.cursor = 'default';
            li.textContent = 'No fonts found';
            fontList.appendChild(li);
            return;
        }

        fonts.forEach(font => {
            const clone = fontItemTemplate.content.cloneNode(true);
            const li = clone.querySelector('.font-item');
            const nameSpan = clone.querySelector('.font-name');
            const badgeSpan = clone.querySelector('.font-badge');
            const radio = clone.querySelector('.font-radio');

            nameSpan.textContent = font.name;

            // Badge logic
            if (font.type === 'google') {
                badgeSpan.textContent = 'Google';
                badgeSpan.style.backgroundColor = '#e0e7ff'; // Light indigo
                badgeSpan.style.color = '#4338ca'; // Indigo 700
            } else {
                badgeSpan.textContent = 'System';
                badgeSpan.style.backgroundColor = '#f3f4f6'; // Gray 100
                badgeSpan.style.color = '#374151'; // Gray 700
            }

            // Selection logic
            if (state.selectedFont === font.key) {
                radio.checked = true;
            }

            // Event listener
            radio.addEventListener('change', () => {
                state.selectedFont = font.key;
                saveState();
                // No need to re-render immediately if using radios, 
                // but checking ensures only one is active relative to state if we had complex logic.
                // For now, let's keep it simple.
            });

            fontList.appendChild(li);
        });
    }

    function updateContentScript() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const fontData = state.allFonts[state.selectedFont];
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateFont',
                    enabled: state.enabled,
                    font: fontData,
                    theme: state.theme
                });
            }
        });
    }
});
