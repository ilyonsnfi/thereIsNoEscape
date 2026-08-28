// Merged in from the HaloPSA Approval Tag Alert extension.
//
// Watches ticket pages, contact/caller panels, and incoming-call popups for
// billing tags that are actually applied (rendered read-only, e.g. via Halo's
// "read-value" display) and pops up a banner when one of the tags enabled in
// the popup is present. See the debug helper at the bottom of this file if a
// match isn't being detected.
(function () {
    'use strict';

    // The extension can be injected twice if it is reloaded while a tab is open.
    if (globalThis.__haloApprovalAlertLoaded) return;
    globalThis.__haloApprovalAlertLoaded = true;

    const SCAN_DEBOUNCE_MS = 400;
    const URL_POLL_MS = 1000;
    const BANNER_ID = 'halo-approval-alert-banner';

    // --- state ----------------------------------------------------------------

    // Declared up here because the storage callback below reaches into it as
    // soon as settings land, which can be before the rest of the file has run.
    let scanTimer = null;
    let urlPoll = null;
    let observer = null;
    let lastUrl = location.href;
    const alerted = new Set();

    // --- settings -------------------------------------------------------------

    // Same storage pattern as content.js and hotkeys.js, except nothing starts
    // watching until the first read lands — a banner is disruptive enough that
    // it's worth the 400ms rather than risking one the user has switched off.
    let enabled = true;
    let sound = true;
    let tagOverrides = {};

    chrome.storage.sync.get({
        approvalAlertEnabled: true,
        approvalAlertSound: true,
        approvalAlertTags: {}
    }, r => {
        enabled = r.approvalAlertEnabled;
        sound = r.approvalAlertSound;
        tagOverrides = r.approvalAlertTags;
        applyEnabled();
    });

    chrome.storage.onChanged.addListener(changes => {
        if (changes.approvalAlertSound) sound = changes.approvalAlertSound.newValue;
        if (changes.approvalAlertTags) {
            tagOverrides = changes.approvalAlertTags.newValue;
            // A tag switched on should alert on the ticket that's already open,
            // rather than waiting for the next navigation.
            alerted.clear();
            scheduleScan();
        }
        if (changes.approvalAlertEnabled) {
            enabled = changes.approvalAlertEnabled.newValue;
            applyEnabled();
        }
    });

    // Only tags the user has explicitly changed are stored; everything else
    // follows the default in tags.js, so adding a tag there reaches people who
    // have already saved settings.
    function tagEnabled(tag) {
        const override = tagOverrides[tag.text];
        return override === undefined ? !!tag.default : override;
    }

    // --- detection ------------------------------------------------------------

    function normalize(str) {
        return (str || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    // The "Tags - Billing" edit panel (a grid of checkboxes for every possible
    // tag) shows every tag's label text regardless of whether it's actually
    // applied. We don't want to alert just because that panel is open, so we
    // detect and skip it: a nearby ancestor with 2+ checkbox inputs, or a
    // "Tags - Billing" heading nearby.
    function isInsideTagEditPanel(el) {
        let node = el;
        for (let i = 0; i < 6 && node; i++, node = node.parentElement) {
            if (node.querySelectorAll && node.querySelectorAll("input[type='checkbox']").length >= 2) {
                return true;
            }
            if (/tags\s*-\s*billing/i.test(node.textContent || '') && node.querySelectorAll("input, [class*='check']").length > 0) {
                // Only treat as edit panel if it's a fairly small/local container,
                // not e.g. the whole page body.
                if (node.textContent.length < 2000) return true;
            }
        }
        return false;
    }

    // Find every place on the page where a known tag is CONFIRMED applied:
    // - Halo's own read-only tag display:
    //   <div class="read-value" title="Requires Approval Non-Contract">
    // - Any other plain-text rendering of the tag (e.g. the incoming call /
    //   caller info panel), as long as it's not just a label inside the
    //   tag-editing checkbox grid.
    function findConfirmedTagMatches() {
        const matches = [];
        const seenEls = new Set();

        // Strategy 1: explicit read-value elements used on ticket/detail pages.
        document.querySelectorAll("[class*='read-value']").forEach(el => {
            const val = normalize(el.getAttribute('title') || el.textContent);
            for (const tag of globalThis.HALO_TAGS) {
                if (val === tag.text && !seenEls.has(el)) {
                    matches.push({ el, tag });
                    seenEls.add(el);
                }
            }
        });

        // Strategy 2: any other plain text exactly matching the tag (covers the
        // call popup / caller info panel and any other read-only layout), as
        // long as it's not inside the multi-checkbox tag-editing panel.
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            const text = normalize(node.nodeValue);
            if (!text) continue;
            for (const tag of globalThis.HALO_TAGS) {
                if (text === tag.text) {
                    const el = node.parentElement;
                    if (el && !seenEls.has(el) && !isInsideTagEditPanel(el)) {
                        matches.push({ el, tag });
                        seenEls.add(el);
                    }
                }
            }
        }

        return matches;
    }

    // --- banner ---------------------------------------------------------------

    function beep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.frequency.value = 660;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 180);
        } catch (e) { /* autoplay policy, no audio device — not worth reporting */ }
    }

    // Returns false if a banner is already up, so the caller can leave the tag
    // unalerted and come back to it.
    function showBanner(tag) {
        if (document.getElementById(BANNER_ID)) return false;

        const banner = document.createElement('div');
        banner.id = BANNER_ID;

        const title = document.createElement('div');
        title.className = 'halo-alert-title';
        title.textContent = '⚠️ Approval required';

        // Tag labels come from tags.js, but build the node rather than assigning
        // innerHTML so a future label can't smuggle markup into the page.
        const body = document.createElement('div');
        body.className = 'halo-alert-body';
        body.append('This contact/ticket is tagged ');
        const name = document.createElement('strong');
        name.textContent = `"${tag.label}"`;
        body.append(name, '. Approval must be requested before helping this user.');

        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.textContent = 'Dismiss';
        dismiss.addEventListener('click', () => banner.remove());

        banner.append(title, body, dismiss);
        document.body.appendChild(banner);

        if (sound) beep();
        return true;
    }

    function removeBanner() {
        document.getElementById(BANNER_ID)?.remove();
    }

    // --- scanning -------------------------------------------------------------

    function scan() {
        // Reset "already alerted" state if we've navigated to a different
        // ticket/page.
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            alerted.clear();
            removeBanner();
        }

        // A ticket can carry more than one watched tag. Only one banner fits, so
        // hold the rest back — dismissing the banner is a DOM change, which
        // brings us straight back here for the next one.
        for (const { tag } of findConfirmedTagMatches()) {
            if (!tagEnabled(tag)) continue;
            if (alerted.has(tag.text)) continue;
            if (!showBanner(tag)) break;
            alerted.add(tag.text);
        }
    }

    function scheduleScan() {
        if (!enabled) return;
        clearTimeout(scanTimer);
        scanTimer = setTimeout(scan, SCAN_DEBOUNCE_MS);
    }

    // Halo is a single-page app, so content loads and changes without full page
    // reloads. Watch the whole document for changes and re-scan. Everything here
    // is torn down when the feature is switched off — a subtree observer over a
    // page this busy isn't something to leave running unused.
    function start() {
        if (observer) return;
        if (!document.body) return;
        observer = new MutationObserver(scheduleScan);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });

        // Also catch SPA navigations that change the URL without a full reload.
        urlPoll = setInterval(() => {
            if (location.href !== lastUrl) scheduleScan();
        }, URL_POLL_MS);

        scheduleScan();
    }

    function stop() {
        observer?.disconnect();
        observer = null;
        clearInterval(urlPoll);
        clearTimeout(scanTimer);
        alerted.clear();
        removeBanner();
    }

    function applyEnabled() {
        if (enabled) start();
        else stop();
    }

    // --- Debug helper ---
    // Content scripts run in an isolated world, so switch the console's context
    // menu from "top" to this extension before running:
    //   __haloTagDebug()
    // It logs every matching tag label found, plus whether it would alert, so we
    // can fix the detection logic if it's wrong.
    globalThis.__haloTagDebug = function () {
        const found = findConfirmedTagMatches();
        console.log(`[HaloTagAlert] Found ${found.length} confirmed tag match(es):`);
        found.forEach(({ el, tag }) => {
            console.log({
                tag: tag.text,
                willAlert: tagEnabled(tag),
                element: el,
                insideEditPanel: isInsideTagEditPanel(el),
            });
        });
        return found;
    };
})();
