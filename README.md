# Fontify

**Make the Web Yours Again.**

Fontify is a powerful browser extension that allows you to customize fonts and themes on any website. Whether you want better readability, a dark mode for a site that doesn't support it, or just a fresh look, Fontify handles it with ease.

## Features

- **Per-Site Control**: Customize settings individually for each website. Your preferences are automatically saved and applied whenever you visit.
- **Premium Font Library**: Access a curated collection of high-quality Google Fonts (Inter, Roboto, Playwrite, JetBrains Mono, etc.) and standard System Fonts.
- **Visual Themes**:
  - **Default**: The site's original look with your custom font.
  - **Inverted**: A high-contrast dark mode.
  - **Sepia**: Warm tones perfect for reading.
  - **Gray**: A balanced grayscale theme.
- **Instant Preview**: Changes are applied instantly as you make them.
- **Privacy First**: All settings are stored locally on your device. No tracking, no data collection.

## Installation

1. **Download the Source**: Clone this repository or download the ZIP file.
2. **Open Extensions Page**:
   - In Chrome/Edge/Brave, go to `chrome://extensions`.
3. **Enable Developer Mode**: Toggle the switch in the top right corner.
4. **Load Unpacked**:
   - Click the **Load unpacked** button.
   - Select the `extension` folder from the project directory.
5. **Pin & Use**: Pin the Fontify icon to your toolbar for easy access.

## Usage

1. Navigate to any website you want to customize.
2. Click the **Fontify** icon in your browser toolbar.
3. Toggle the switch to **Enable** the extension for that site.
4. **Select a Font**: Scroll through the list or use the search bar to find a font. Click to apply.
5. **Choose a Theme**: Click on one of the theme icons (None, Inverted, Sepia, Gray) to change the color scheme.
6. Enjoy your personalized reading experience!

## Project Structure

```
.
├── extension/              # Extension Source Code
│   ├── manifest.json       # Manifest V3 configuration
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup logic
│   ├── popup.css           # Popup styling
│   ├── content.js          # Content script for injecting styles
│   ├── fonts.json          # Font definitions
│   ├── themes.css          # Theme CSS variables and styles
│   └── icons/              # Extension icons
├── index.html              # Landing page for the project
├── landing.css             # Styles for the landing page
└── README.md               # Project documentation
```

## Technologies

- **Manifest V3**: Built using the latest WebExtension standards.
- **Vanilla JS**: Lightweight and fast, with no heavy framework dependencies.
- **CSS Variables**: Efficient theming and styling.

## Version

Current Version: **1.0.0**
