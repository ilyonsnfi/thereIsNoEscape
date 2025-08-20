let lastEscTime = 0;
let settings = { enabled: true, doubleEscBypass: false, timeout: 500 };

chrome.storage.sync.get({
  enabled: true,
  doubleEscBypass: false,
  timeout: 500
}, function(result) {
  settings = result;
});

chrome.storage.onChanged.addListener(function(changes) {
  if (changes.enabled) {
    settings.enabled = changes.enabled.newValue;
  }
  if (changes.doubleEscBypass) {
    settings.doubleEscBypass = changes.doubleEscBypass.newValue;
  }
  if (changes.timeout) {
    settings.timeout = changes.timeout.newValue;
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && settings.enabled) {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastEscTime;
    
    if (settings.doubleEscBypass && timeDiff < settings.timeout) {
      console.log('Double-Esc detected, allowing through');
      lastEscTime = 0;
      return;
    }
    
    lastEscTime = currentTime;
    event.stopPropagation();
    event.preventDefault();
    console.log('Esc key intercepted and blocked on halopsa.com');
  }
}, true);