// Single source of truth for the billing tags the approval alert watches for.
// Loaded by both the content script and the toolbar popup.
//
// text     the tag exactly as HaloPSA renders it, lowercased and space-collapsed
//          — this is what the page is matched against
// label    what the popup and the banner show
// default  whether the alert is on for this tag until the user says otherwise

globalThis.HALO_TAGS = [
    { text: 'requires approval non-contract', label: 'Requires Approval Non-Contract', default: true },
    { text: 'non-billed user', label: 'Non-Billed User', default: false },
    { text: 'pre-approved non-contract', label: 'Pre-Approved Non-Contract', default: false },
];
