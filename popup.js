document.addEventListener('DOMContentLoaded', async function() {
  const enabledCheckbox = document.getElementById('enabled');
  const doubleEscCheckbox = document.getElementById('doubleEscBypass');
  const timeoutInput = document.getElementById('timeout');
  const reloadNotice = document.getElementById('reloadNotice');
  const hotkeysCheckbox = document.getElementById('hotkeysEnabled');

  const result = await chrome.storage.sync.get({
    enabled: true,
    doubleEscBypass: false,
    timeout: 500,
    hotkeysEnabled: true
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
  
  updateTimeoutVisibility();

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
