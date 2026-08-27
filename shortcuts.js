// Single source of truth for the hotkey table.
// Loaded by both the content script and the toolbar popup.
//
// key           the value of KeyboardEvent.key ('R' means shift+r)
// ctrl/alt/meta required modifier state; absent means "must not be held".
//               Shift isn't listed — it's already baked into `key`.
// action        'click' clicks the first matching action button
//               'copy-link' copies the ticket URL
//               'nav-list' moves `delta` places through the sidebar list
// labels        button labels to try, in order — tickets expose one or the other
// label         what the popup shows
// alias         a second way to trigger an action; works, but stays out of the popup

// macOS binds ctrl+arrow to Mission Control at the OS level, so Chrome never sees
// those keydowns; Windows has no such conflict. Each platform gets the modifier
// that works there, and the other stays bound as an alias for anyone who has
// remapped their system shortcuts.
const IS_MAC = /Mac|iPhone|iPad/.test(
    globalThis.navigator?.userAgentData?.platform || globalThis.navigator?.platform || '');
const NAV_KEY = IS_MAC ? { alt: true } : { ctrl: true };
const NAV_ALT = IS_MAC ? { ctrl: true } : { alt: true };

globalThis.HALO_SHORTCUTS = [
    { key: 'a', action: 'click', labels: ['Acknowledge'], label: 'Acknowledge' },
    { key: 'c', action: 'copy-link', label: 'Copy ticket link' },
    { key: 'e', action: 'click', labels: ['Email User', 'Email Co-Managed'], label: 'Email User / Co-Managed' },
    { key: 'o', action: 'click', labels: ['Request Order'], label: 'Request Order' },
    { key: 'r', action: 'click', labels: ['Re-Assign'], label: 'Re-Assign' },
    { key: 'R', action: 'click', labels: ['Re-Assign Co-Managed'], label: 'Re-Assign Co-Managed' },
    { key: 's', action: 'click', labels: ['Create Appointment'], label: 'Create Appointment' },
    { key: 'w', action: 'click', labels: ['Work Note', 'Add Work Note'], label: 'Work Note' },
    { key: 'q', action: 'click', labels: ['Resolve Ticket', 'Resolve Co-Managed'], label: 'Resolve Ticket / Co-Managed' },

    { key: 'ArrowUp', ...NAV_KEY, action: 'nav-list', delta: -1, label: 'Previous list' },
    { key: 'ArrowDown', ...NAV_KEY, action: 'nav-list', delta: 1, label: 'Next list' },
    { key: 'ArrowUp', ...NAV_ALT, action: 'nav-list', delta: -1, label: 'Previous list', alias: true },
    { key: 'ArrowDown', ...NAV_ALT, action: 'nav-list', delta: 1, label: 'Next list', alias: true },
];
