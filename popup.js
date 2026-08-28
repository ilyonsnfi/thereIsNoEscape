document.addEventListener('DOMContentLoaded', async function() {
  const enabledCheckbox = document.getElementById('enabled');
  const doubleEscCheckbox = document.getElementById('doubleEscBypass');
  const timeoutInput = document.getElementById('timeout');
  const reloadNotice = document.getElementById('reloadNotice');
  const hotkeysCheckbox = document.getElementById('hotkeysEnabled');
  const alertCheckbox = document.getElementById('approvalAlertEnabled');
  const alertSoundCheckbox = document.getElementById('approvalAlertSound');
  const alertOptions = document.getElementById('approvalAlertOptions');

  // Build the per-tag checkboxes before the first await, so they exist by the
  // time the stored settings come back.
  const tagCheckboxes = renderTagToggles();

  const result = await chrome.storage.sync.get({
    enabled: true,
    doubleEscBypass: false,
    timeout: 500,
    hotkeysEnabled: true,
    approvalAlertEnabled: true,
    approvalAlertSound: true,
    approvalAlertTags: {}
  });

  const originalSettings = {
    enabled: result.enabled,
    doubleEscBypass: result.doubleEscBypass,
    timeout: result.timeout
  };

  let currentSettings = { ...originalSettings };

  enabledCheckbox.checked = result.enabled;
  doubleEscCheckbox.checked = result.doubleEscBypass;
  timeoutInput.value = result.timeout;
  hotkeysCheckbox.checked = result.hotkeysEnabled;
  alertCheckbox.checked = result.approvalAlertEnabled;
  alertSoundCheckbox.checked = result.approvalAlertSound;

  // Only tags the user has changed are stored; the rest follow tags.js.
  const tagOverrides = result.approvalAlertTags;
  for (const { tag, input } of tagCheckboxes) {
    const override = tagOverrides[tag.text];
    input.checked = override === undefined ? !!tag.default : override;
  }

  function updateTimeoutVisibility() {
    const timeoutContainer = document.getElementById('timeoutContainer');
    if (doubleEscCheckbox.checked) {
      timeoutContainer.classList.remove('hidden');
    } else {
      timeoutContainer.classList.add('hidden');
    }
  }
  
  function updateReloadNotice() {
    const hasChanges = (
      currentSettings.enabled !== originalSettings.enabled ||
      currentSettings.doubleEscBypass !== originalSettings.doubleEscBypass ||
      currentSettings.timeout !== originalSettings.timeout
    );
    
    if (hasChanges) {
      reloadNotice.classList.remove('hidden');
    } else {
      reloadNotice.classList.add('hidden');
    }
  }
  
  function updateAlertOptionsVisibility() {
    if (alertCheckbox.checked) {
      alertOptions.classList.remove('hidden');
    } else {
      alertOptions.classList.add('hidden');
    }
  }

  updateTimeoutVisibility();
  updateAlertOptionsVisibility();

  enabledCheckbox.addEventListener('change', function() {
    currentSettings.enabled = this.checked;
    chrome.storage.sync.set({ enabled: this.checked });
    updateReloadNotice();
  });

  doubleEscCheckbox.addEventListener('change', function() {
    currentSettings.doubleEscBypass = this.checked;
    chrome.storage.sync.set({ doubleEscBypass: this.checked });
    updateTimeoutVisibility();
    updateReloadNotice();
  });

  hotkeysCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({ hotkeysEnabled: this.checked });
  });

  alertCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({ approvalAlertEnabled: this.checked });
    updateAlertOptionsVisibility();
  });

  alertSoundCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({ approvalAlertSound: this.checked });
  });

  for (const { tag, input } of tagCheckboxes) {
    input.addEventListener('change', function() {
      tagOverrides[tag.text] = this.checked;
      chrome.storage.sync.set({ approvalAlertTags: tagOverrides });
    });
  }

  timeoutInput.addEventListener('input', function() {
    const value = parseInt(this.value);
    if (value >= 100 && value <= 2000) {
      currentSettings.timeout = value;
      chrome.storage.sync.set({ timeout: value });
      updateReloadNotice();
    }
  });
});
// Render the hotkey cheat sheet from the same table the content script uses.
document.addEventListener('DOMContentLoaded', function() {
  const table = document.getElementById('shortcuts');
  const GLYPHS = { ArrowUp: '↑', ArrowDown: '↓' };

  function render(s) {
    return (s.ctrl ? '⌃' : '') + (s.alt ? '⌥' : '') + (s.meta ? '⌘' : '')
      + (GLYPHS[s.key] || s.key);
  }

  // Alias bindings still work, they just don't need a row of their own.
  const groups = new Map();
  for (const s of globalThis.HALO_SHORTCUTS) {
    if (s.alias) continue;
    if (!groups.has(s.label)) groups.set(s.label, []);
    groups.get(s.label).push(render(s));
  }

  for (const [label, keys] of groups) {
    const row = table.insertRow();
    const keyCell = row.insertCell();
    keyCell.className = 'key';
    keys.forEach(function(k, i) {
      if (i) keyCell.append(' ');
      const kbd = document.createElement('kbd');
      kbd.textContent = k;
      keyCell.append(kbd);
    });
    row.insertCell().textContent = label;
  }
});

// Render a checkbox per billing tag from the same table the content script uses.
function renderTagToggles() {
  const container = document.getElementById('tagToggles');
  return globalThis.HALO_TAGS.map(function(tag) {
    const row = document.createElement('div');
    row.className = 'toggle-container sub';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = 'tag-' + tag.text.replace(/\s+/g, '-');

    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = tag.label;

    row.append(input, label);
    container.append(row);
    return { tag, input };
  });
}
