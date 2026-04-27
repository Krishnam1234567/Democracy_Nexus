// Offline detection and notification
let wasOnline = navigator.onLine;

function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  if (!isOnline && wasOnline) {
    showToast('You are offline. Some features may be limited.', 'warning', 0);
  } else if (isOnline && !wasOnline) {
    showToast('Back online!', 'success', 3000);
  }
  wasOnline = isOnline;
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.info('[SW] Service Worker registered:', registration.scope);
    } catch (error) {
      console.warn('[SW] Service Worker registration failed:', error.message);
    }
  });
}