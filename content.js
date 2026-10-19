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

// Listen on window in the capture phase: window is the first stop on every
// keydown's path, so this runs before anything HaloPSA registers on document
// or below. Halo's modal now listens on document in the capture phase too,
// and stopPropagation() can't stop other listeners on the same node, so we
// also use stopImmediatePropagation() for anything else registered on window.
window.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && settings.enabled) {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastEscTime;
    
    if (settings.doubleEscBypass && timeDiff < settings.timeout) {
      console.log('Double-Esc detected, allowing through');
      lastEscTime = 0;
      return;
    }
    
    lastEscTime = currentTime;
    event.stopImmediatePropagation();
    event.preventDefault();
    console.log('Esc key intercepted and blocked on halopsa.com');
  }
}, true);