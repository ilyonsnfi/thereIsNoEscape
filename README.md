# Halo Esc Key Blocker

A Chrome extension that prevents HaloPSA from capturing the Esc key, so you never lose work due to accidental key presses.

## Features

- **Block Esc key** - Prevents HaloPSA from capturing Esc key presses
- **Configurable settings** - Enable/disable blocking with a simple toggle
- **Double-Esc bypass** - Optional feature to allow double-Esc within a configurable timeout to pass through
- **Local storage** - All settings stored locally, no data collection

## Installation

### Chrome Web Store
https://chromewebstore.google.com/detail/halo-esc-key-blocker/ecpfoneoclmhemfbhiapjjcmbfdibabm?authuser=0&hl=en

### Manual Installation (Developer Mode)

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/ilyonsnfi/thereIsNoEscape.git
   cd thereIsNoEscape
   ```

2. **Open Chrome Extensions page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `thereIsNoEscape` folder
   - The extension will appear in your extensions list

4. **Test it out**
   - Navigate to any `*.halopsa.com` page
   - Try pressing Esc - it should be blocked!
   - Click the extension icon to configure settings

## Usage

1. **Click the extension icon** in your Chrome toolbar to open settings
2. **Toggle "Block Esc key"** to enable/disable the blocking
3. **Optional: Enable "Double-Esc bypass"** to allow quick double-Esc presses to pass through
4. **Adjust timeout** (when double-Esc is enabled) to control how fast you need to press Esc twice
5. **Reload HaloPSA** after changing settings

## Settings

- **Block Esc key**: Master toggle to enable/disable Esc key blocking
- **Double-Esc bypass**: Allow pressing Esc twice quickly to let it through to HaloPSA
- **Timeout**: How many milliseconds to wait for the second Esc press

## Development

### Building Icons
```bash
./generate-icons.sh
```

### Packaging for Chrome Web Store
```bash
./package-extension.sh
```

## Privacy

This extension does not collect any data. All settings are stored locally on your device. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full details.

## License

This project is open source. Feel free to modify and distribute as needed.

## Support

If you encounter issues or have feature requests, please open an issue on GitHub or contact through the Chrome Web Store once published.
