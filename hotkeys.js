// Merged in from the HaloHotkeys extension.
(function () {
    'use strict';

    // The extension can be injected twice if it is reloaded while a tab is open.
    if (globalThis.__haloHotkeysLoaded) return;
    globalThis.__haloHotkeysLoaded = true;

    // Same storage pattern as the Esc blocker in content.js. Default to on so the
    // hotkeys work during the moment before the async read lands.
    let enabled = true;
    chrome.storage.sync.get({ hotkeysEnabled: true }, r => { enabled = r.hotkeysEnabled; });
    chrome.storage.onChanged.addListener(changes => {
        if (changes.hotkeysEnabled) enabled = changes.hotkeysEnabled.newValue;
    });

    // One key can carry several bindings (ctrl+Down and alt+Down), so group by key
    // and pick the one whose modifiers match.
    const SHORTCUTS = new Map();
    for (const s of globalThis.HALO_SHORTCUTS) {
        if (!SHORTCUTS.has(s.key)) SHORTCUTS.set(s.key, []);
        SHORTCUTS.get(s.key).push(s);
    }

    function isTyping(e) {
        const tag = e.target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
    }

    function toast(msg) {
        const el = document.createElement('div');
        el.textContent = msg;
        Object.assign(el.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#333',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: '99999',
            opacity: '1',
            transition: 'opacity 0.4s ease',
        });
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; }, 1500);
        setTimeout(() => { el.remove(); }, 2000);
    }

    function getTicketId() {
        // SPA navigation doesn't reliably update the URL — read it out of the DOM
        return document.querySelector('#ticketdetails-details .dropzone-container')?.id || null;
    }

    function findActionButton(labels) {
        const buttons = Array.from(document.querySelectorAll('button.actionmenubtn'));
        for (const label of labels) {
            const btn = buttons.find(b => b.textContent.trim() === label);
            if (btn) return btn;
        }
        return null;
    }

    function clickButton(labels) {
        const btn = findActionButton(labels);
        if (!btn) { toast(`No ${labels[0]} button`); return; }
        btn.click();
    }

    // Tampermonkey handed us GM_setClipboard; on our own we use the async
    // Clipboard API, falling back to a scratch textarea when the parent
    // document isn't the focused one (e.g. the keypress came from an iframe).
    async function writeClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            return legacyCopy(text);
        }
    }

    function legacyCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        Object.assign(ta.style, { position: 'fixed', top: '-1000px', opacity: '0' });
        document.body.appendChild(ta);
        const selection = document.getSelection();
        const previous = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
        if (previous) { selection.removeAllRanges(); selection.addRange(previous); }
        return ok;
    }

    async function copyTicketLink() {
        const id = getTicketId();
        if (!id) { toast('No ticket open'); return; }
        const url = `${location.origin}/tickets?id=${id}`;
        if (await writeClipboard(url)) toast(`Copied: ${url}`);
        else toast('Could not copy to clipboard');
    }

    // --- sidebar list navigation ---------------------------------------------

    // Where we last sent the user. Halo doesn't mark the selected list in the DOM,
    // so this is often the only thing that knows where we are.
    let lastNavIndex = -1;

    // Collapsed tree branches stay in the DOM, so filter to what's actually shown.
    function listNodes() {
        return Array.from(document.querySelectorAll('.nodetitle'))
            .filter(n => n.offsetParent !== null);
    }

    // Halo puts no 'selected' class on the current list, but other builds/themes
    // might. Only trust one if exactly one node carries it — a class that matches
    // every node or none tells us nothing.
    const SELECTED_HINT = '.selected, .active, .selectednode, .nodeselected';

    function currentIndex(nodes) {
        const marked = nodes.filter(n => n.closest(SELECTED_HINT));
        if (marked.length === 1) return nodes.indexOf(marked[0]);

        // ?selid= holds the data-id of the selected list
        const selid = new URLSearchParams(location.search).get('selid');
        if (selid) {
            const i = nodes.findIndex(n => n.dataset.id === selid);
            if (i !== -1) return i;
        }

        return lastNavIndex;
    }

    function navList(delta) {
        const nodes = listNodes();
        if (!nodes.length) { toast('No lists here'); return; }

        const from = currentIndex(nodes);
        // From an unknown position, enter from whichever end we're heading toward.
        const next = from === -1
            ? (delta > 0 ? 0 : nodes.length - 1)
            : (from + delta + nodes.length) % nodes.length;

        lastNavIndex = next;
        nodes[next].scrollIntoView({ block: 'nearest' });
        nodes[next].click();
    }

    // Keep our position in sync when the list is clicked with the mouse.
    document.addEventListener('click', e => {
        const node = e.target.closest?.('.nodetitle');
        if (node) lastNavIndex = listNodes().indexOf(node);
    }, true);

    // --- dispatch -------------------------------------------------------------

    function modifiersMatch(e, s) {
        return e.ctrlKey === !!s.ctrl && e.altKey === !!s.alt && e.metaKey === !!s.meta;
    }

    function handleKey(e) {
        if (!enabled) return;
        if (isTyping(e)) return;

        const shortcut = (SHORTCUTS.get(e.key) || []).find(s => modifiersMatch(e, s));
        if (!shortcut) return;

        e.preventDefault();
        switch (shortcut.action) {
            case 'copy-link': copyTicketLink(); break;
            case 'nav-list': navList(shortcut.delta); break;
            default: clickButton(shortcut.labels);
        }
    }

    // Capture phase so stopPropagation() in HaloPSA's own handlers can't block us
    document.addEventListener('keydown', handleKey, true);

    // iframe focus: ticket action HTML is rendered in same-origin iframes;
    // clicking one moves focus there and events never reach the parent document
    function hookIframe(frame) {
        frame.addEventListener('load', () => {
            try { frame.contentDocument.addEventListener('keydown', handleKey, true); }
            catch (e) {}
        });
        // already loaded
        try {
            if (frame.contentDocument?.readyState === 'complete')
                frame.contentDocument.addEventListener('keydown', handleKey, true);
        } catch (e) {}
    }

    document.querySelectorAll('iframe.halo-html-renderer').forEach(hookIframe);

    new MutationObserver(mutations => {
        for (const m of mutations)
            for (const node of m.addedNodes)
                if (node.nodeType === 1) {
                    if (node.matches?.('iframe.halo-html-renderer')) hookIframe(node);
                    node.querySelectorAll?.('iframe.halo-html-renderer').forEach(hookIframe);
                }
    }).observe(document.body, { childList: true, subtree: true });
})();
