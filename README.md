# Halo Esc Key Blocker

A browser extension for HaloPSA. It stops Halo from capturing the Esc key, so you never
lose work to an accidental key press, adds keyboard shortcuts for common ticket actions,
and warns you when a ticket or caller carries a billing tag that needs approval first.

## Features

- **Block Esc key** - Prevents HaloPSA from capturing Esc key presses
- **Double-Esc bypass** - Optional feature to allow double-Esc within a configurable timeout to pass through
- **Ticket hotkeys** - Single-key shortcuts for ticket actions, plus arrow-key navigation between sidebar lists
- **Billing tag alerts** - Banner when an open ticket or caller has a tag like Requires Approval Non-Contract
- **Configurable settings** - Toggle each feature independently from the popup
- **Local storage** - All settings stored locally, no data collection

## Hotkeys

Active on a ticket when you're not focused in a text field. Toggle them off from the
popup if you don't want them.

| Key | Action |
|-----|--------|
| `a` | Acknowledge |
| `c` | Copy ticket link to clipboard |
| `e` | Email User / Email Co-Managed |
| `o` | Request Order |
| `r` | Re-Assign |
| `R` | Re-Assign Co-Managed |
| `s` | Create Appointment |
| `w` | Work Note / Add Work Note |
| `q` | Resolve Ticket / Resolve Co-Managed |

Where two labels are listed, whichever button the current ticket has is used.

### Moving between lists

| Key | Action |
|-----|--------|
| `Alt`+`↑` / `↓` | Previous / next sidebar list (macOS) |
| `Ctrl`+`↑` / `↓` | Previous / next sidebar list (Windows, Linux) |

Selection wraps at both ends and skips lists inside collapsed branches. macOS reserves
`Ctrl`+`↑`/`↓` for Mission Control and App Exposé, so Macs default to `Alt` (Option);
whichever isn't your platform's default still works as an alias.

HaloPSA doesn't mark the selected list in the DOM, so position is worked out by
checking, in order: a `selected`-style class (trusted only if exactly one list has one),
the `selid` parameter in the URL, and the last list navigated to. Mouse clicks on lists
are watched too, so it doesn't lose its place.

## Billing tag alerts

When a ticket page, contact panel, or incoming-call popup shows one of the watched
billing tags, a banner appears in the top right with a short chime. Dismiss it and it
stays gone until you move to another ticket.

| Tag | Alerts by default |
|-----|-------------------|
| Requires Approval Non-Contract | Yes |
| Non-Billed User | No |
| Pre-Approved Non-Contract | No |

Each tag has its own checkbox in the popup, and the chime can be switched off on its
own. To watch for a different tag, add it to `tags.js` — the popup picks it up
automatically, and the `default` field decides whether it alerts before anyone touches
the settings.

Only tags Halo renders as *applied* count. The "Tags - Billing" edit panel lists every
possible tag whether or not it's set, so matches inside a grid of checkboxes are
ignored — otherwise opening that panel would alert on every ticket.

If a tag isn't being picked up, open DevTools on the ticket, switch the console's
context dropdown from `top` to this extension, and run `__haloTagDebug()`. It logs every
match it found and why.

## Installation

### Safari (Mac App Store)

1. **Install There Is No Escape** from the Mac App Store
2. **Enable the extension**
   - Open the There Is No Escape app
   - Follow the on-screen instructions to open Safari, then go to **Settings → Extensions**
   - Toggle **There Is No Escape** on
3. Navigate to any `*.halopsa.com` page — Esc is now blocked

> If the extension doesn't appear or behaves unexpectedly, try relaunching Safari.

### Chrome Web Store
https://chromewebstore.google.com/detail/halo-esc-key-blocker/ecpfoneoclmhemfbhiapjjcmbfdibabm?authuser=0&hl=en

### Chrome Manual Installation (Developer Mode)

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
   - Open a ticket and press `a` to acknowledge it
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
- **Ticket hotkeys**: Master toggle for the keyboard shortcuts above
- **Billing tag alerts**: Master toggle for the tag banner, with a checkbox per tag and one for the chime

Only the Esc settings need a reload to take effect; the hotkeys and tag alerts pick up
changes straight away.

## Layout

The extension source lives at the repo root and is shared by both the Chrome build and
the Safari app, which references these files from
`There Is No Escape.xcodeproj`. Adding a file means adding it to the Safari extension
target's Resources build phase as well as to `package-extension.sh`.

```
manifest.json      three content_scripts entries: Esc blocker, hotkeys, tag alerts
content.js         Esc blocking, at document_start
shortcuts.js       the hotkey table — shared by hotkeys.js and popup.js
hotkeys.js         ticket actions and list navigation, at document_idle
tags.js            the billing tag table — shared by approval-alert.js and popup.js
approval-alert.js  tag detection and the banner, at document_idle, in all frames
approval-alert.css the banner's styling
popup.html/.js     settings for all three features, plus the hotkey cheat sheet
```

To change or add a hotkey, edit `shortcuts.js`; to change the watched billing tags, edit
`tags.js`. The popup picks up both automatically.

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
