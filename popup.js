document.addEventListener('DOMContentLoaded', async function() {
  const enabledCheckbox = document.getElementById('enabled');
  const doubleEscCheckbox = document.getElementById('doubleEscBypass');
  const timeoutInput = document.getElementById('timeout');
  const reloadNotice = document.getElementById('reloadNotice');

  const result = await chrome.storage.sync.get({
    enabled: true,
    doubleEscBypass: false,
    timeout: 500
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

  timeoutInput.addEventListener('input', function() {
    const value = parseInt(this.value);
    if (value >= 100 && value <= 2000) {
      currentSettings.timeout = value;
      chrome.storage.sync.set({ timeout: value });
      updateReloadNotice();
    }
  });
});