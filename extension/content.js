// content.js

let styleElement = null;
let themeLink = null;

async function applyFont(fontData, enabled) {
    // Remove existing elements 
    if (styleElement) {
        styleElement.remove();
        styleElement = null;
    }

    if (!enabled || !fontData) return;

    // Create Style Element
    styleElement = document.createElement('style');
    styleElement.id = 'font-changer-style';

    let css = '';

    // Check cache for Google Fonts
    if (fontData.type === 'google') {
        const cachedCSS = await getCachedFont(fontData.name);
        if (cachedCSS) {
            console.log('Using cached font:', fontData.name);
            css += cachedCSS + '\n';
        } else if (fontData.url) {
            console.log('Using online font:', fontData.name);
            css += fontData.url + '\n';
            // Cache in background
            cacheFont(fontData);
        }
    }

    // Use the font name in quotes, and add !important to override existing styles
    // Exclude common icon classes to prevent breaking icons
    const excludeSelectors = [
        ':not(.fa)',
        ':not(.fas)',
        ':not(.far)',
        ':not(.fab)',
        ':not(.fal)',
        ':not(.material-icons)',
        ':not(.material-icons-outlined)',
        ':not(.material-icons-round)',
        ':not(.material-icons-sharp)',
        ':not(.material-icons-two-tone)',
        ':not(.material-symbols-outlined)',
        ':not(.material-symbols-rounded)',
        ':not(.material-symbols-sharp)',
        ':not([class*="icon"])',
        ':not([class*="Icon"])',
        ':not([class*="fa-"])',
        ':not(math)',
        ':not([class*="math"])',
        ':not([class*="Math"])',
        ':not(.katex)',
        ':not([class*="katex"])',
        ':not(.MathJax)',
        ':not([class*="MathJax"])',
        ':not(code)',
        ':not(pre)',
        ':not([class*="symbol"])',
        ':not([class*="Symbol"])',
        ':not(.ph)',
        ':not([class*="ph-"])',
        ':not(.bi)',
        ':not([class*="bi-"])',
        ':not(.ri)',
        ':not([class*="ri-"])',
        ':not(.bx)',
        ':not([class*="bx-"])',
        ':not(.ti)',
        ':not([class*="ti-"])',
        ':not(.ion)',
        ':not([class*="ion-"])',
        ':not([class*="icon-"])',
        ':not(.glyphicon)',
        ':not([class*="glyphicon-"])',
        ':not(.octicon)',
        ':not([class*="octicon-"])'
    ];

    const selector = '*' + excludeSelectors.join('');
    css += `${selector} { font-family: '${fontData.name}', sans-serif !important; }`;

    styleElement.textContent = css;

    injectElement(styleElement);
}

async function getCachedFont(fontName) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['fontCache'], (result) => {
            const cache = result.fontCache || {};
            resolve(cache[fontName]);
        });
    });
}

async function cacheFont(fontData) {
    if (!fontData.url) return;

    try {
        // Extract URL from @import
        const match = fontData.url.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (!match) return;
        const cssUrl = match[1];

        // Fetch CSS
        const response = await fetch(cssUrl);
        let cssText = await response.text();

        // Find all font URLs in the CSS
        const fontUrlMatches = [...cssText.matchAll(/url\(([^)]+)\)/g)];

        // Fetch and replace each font URL with Data URI
        for (const match of fontUrlMatches) {
            const originalUrl = match[0]; // url(...)
            const rawUrl = match[1].replace(/['"]/g, ''); // Clean URL

            try {
                const fontResponse = await fetch(rawUrl);
                const blob = await fontResponse.blob();
                const base64 = await blobToBase64(blob);
                const dataUri = `url('${base64}')`;

                cssText = cssText.replace(originalUrl, dataUri);
            } catch (err) {
                console.warn('Failed to cache font file:', rawUrl, err);
            }
        }

        // Save to storage
        chrome.storage.local.get(['fontCache'], (result) => {
            const cache = result.fontCache || {};
            cache[fontData.name] = cssText;

            // Simple quota management: keep only last 5 fonts
            const keys = Object.keys(cache);
            if (keys.length > 5) {
                delete cache[keys[0]];
            }

            chrome.storage.local.set({ fontCache: cache }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('Storage quota exceeded, could not cache font.');
                } else {
                    console.log('Font cached successfully:', fontData.name);
                }
            });
        });

    } catch (e) {
        console.error('Error caching font:', e);
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function applyTheme(theme, enabled) {
    // Ensure theme CSS is loaded
    if (!themeLink) {
        themeLink = document.createElement('link');
        themeLink.rel = 'stylesheet';
        themeLink.href = chrome.runtime.getURL('themes.css');
        themeLink.id = 'font-changer-themes';
        injectElement(themeLink);
    }

    // Remove all theme classes
    document.documentElement.classList.remove('ext-theme-dark', 'ext-theme-sepia', 'ext-theme-gray');

    if (enabled && theme && theme !== 'none') {
        document.documentElement.classList.add(`ext-theme-${theme}`);
    }
}

function injectElement(element) {
    if (document.head) {
        document.head.appendChild(element);
    } else if (document.documentElement) {
        document.documentElement.appendChild(element);
    } else {
        // If neither exists (extremely rare at document_start but possible), wait for them
        const observer = new MutationObserver(() => {
            if (document.head || document.documentElement) {
                if (document.head) document.head.appendChild(element);
                else document.documentElement.appendChild(element);
                observer.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateFont') {
        applyFont(request.font, request.enabled);
        applyTheme(request.theme, request.enabled);
    }
});

// Load saved settings on start
chrome.storage.local.get(['siteSettings'], (result) => {
    const hostname = window.location.hostname;
    const siteSettings = result.siteSettings || {};
    const currentSiteSettings = siteSettings[hostname];

    if (currentSiteSettings && currentSiteSettings.enabled) {
        // Apply Font
        if (currentSiteSettings.fontData) {
            applyFont(currentSiteSettings.fontData, currentSiteSettings.enabled);
        } else if (currentSiteSettings.selectedFont) {
            fetch(chrome.runtime.getURL('fonts.json'))
                .then(response => response.json())
                .then(fonts => {
                    const fontData = fonts[currentSiteSettings.selectedFont];
                    if (fontData) {
                        applyFont(fontData, currentSiteSettings.enabled);
                    }
                });
        }

        // Apply Theme
        applyTheme(currentSiteSettings.theme, currentSiteSettings.enabled);
    }
});
