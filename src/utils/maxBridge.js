// Обёртка над MAX Bridge (window.WebApp)
export const maxBridge = {
  isAvailable: () => typeof window !== 'undefined' && !!window.WebApp,

  init: () => {
    if (maxBridge.isAvailable()) {
      try {
        window.WebApp.ready?.();
        window.WebApp.expand?.();
        return true;
      } catch (e) {
        console.warn('MAX Bridge init failed', e);
      }
    }
    return false;
  },

  getUser: () => {
    if (maxBridge.isAvailable()) {
      return window.WebApp.initDataUnsafe?.user || null;
    }
    return null;
  },

  getStartParam: () => {
    if (maxBridge.isAvailable()) {
      return window.WebApp.initDataUnsafe?.start_param || null;
    }
    return null;
  },

  sendData: (data) => {
    // В MAX Bridge метод sendData отсутствует.
    // Для передачи данных боту используется бэкенд или openMaxLink.
    console.log('[MAX Bridge] sendData (требует API):', data);
  },

  haptic: (type = 'light') => {
    if (maxBridge.isAvailable() && window.WebApp.HapticFeedback) {
      try {
        window.WebApp.HapticFeedback.impactOccurred(type);
      } catch (e) {
        // ignore
      }
    }
  },

  showAlert: (msg) => {
    if (maxBridge.isAvailable() && window.WebApp.showAlert) {
      window.WebApp.showAlert(msg);
    } else {
      alert(msg);
    }
  },

  shareContent: ({ text, link }) => {
    if (maxBridge.isAvailable() && window.WebApp.shareMaxContent) {
      try {
        window.WebApp.shareMaxContent({ text, link });
        return true;
      } catch (e) {
        console.warn('shareMaxContent failed', e);
      }
    }
    // Fallback — копируем в буфер
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text || link || '');
      alert('✅ Скопировано в буфер обмена');
      return true;
    }
    return false;
  },

  openLink: (url) => {
    if (maxBridge.isAvailable() && window.WebApp.openLink) {
      window.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }
};