const LOCAL_TEST_ENABLED = String(import.meta.env?.VITE_LOCAL_TEST_USER || '').toLowerCase() === 'true';
const LOCAL_TEST_USER = {
  id: String(import.meta.env?.VITE_LOCAL_USER_ID || 'local-reviewer'),
  name: String(import.meta.env?.VITE_LOCAL_USER_NAME || 'Проверяющий'),
  first_name: String(import.meta.env?.VITE_LOCAL_USER_NAME || 'Проверяющий'),
  city: String(import.meta.env?.VITE_LOCAL_USER_CITY || 'Казань'),
  photo_url: null,
};

// src/utils/maxBridge.js
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
    // SDK MAX может присутствовать и в обычном браузере, но без initData/user.
    // Поэтому сначала используем реального пользователя, только если он действительно есть.
    if (maxBridge.isAvailable()) {
      const maxUser = window.WebApp.initDataUnsafe?.user || null;
      if (maxUser?.id) return maxUser;
    }

    // Для локальной Docker-проверки явно разрешаем fallback-пользователя,
    // даже если объект window.WebApp уже был создан подключенным SDK.
    if (LOCAL_TEST_ENABLED) return LOCAL_TEST_USER;
    return null;
  },

  getInitData: () => {
    if (maxBridge.isAvailable()) return window.WebApp.initData || null;
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
    if (!maxBridge.isAvailable()) return;
    const hf = window.WebApp.HapticFeedback;
    if (!hf) return;
    try {
      // impactOccurred может быть не поддержан в текущей версии SDK MAX.
      // Глотаем UnsupportedEvent, чтобы не засорять консоль и не ломать UX.
      if (typeof hf.impactOccurred === 'function') {
        hf.impactOccurred(type);
      }
    } catch (e) {
      // MAX Bridge может кинуть UnsupportedEvent — это нормально
    }
  },

  showAlert: (msg) => {
    if (maxBridge.isAvailable() && window.WebApp.showAlert) {
      try { window.WebApp.showAlert(msg); } catch {
        alert(msg);
      }
    } else {
      alert(msg);
    }
  },

  shareContent: async ({ text, link }) => {
    if (maxBridge.isAvailable() && window.WebApp.shareMaxContent) {
      try {
        window.WebApp.shareMaxContent({ text, link });
        return true;
      } catch (e) {
        console.warn('shareMaxContent failed', e);
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: text?.split('\n')[0], text, url: link });
        return true;
      } catch (error) {
        if (error?.name === 'AbortError') return false;
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText([text, link].filter(Boolean).join('\n'));
        maxBridge.showAlert('Ссылка на событие скопирована');
        return true;
      } catch (error) {
        console.warn('Clipboard share failed', error);
      }
    }
    if (link) { window.prompt('Скопируйте ссылку на событие', link); return true; }
    return false;
  },

  openLink: (url) => {
    if (maxBridge.isAvailable() && window.WebApp.openLink) {
      try { window.WebApp.openLink(url); } catch {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }
};

export const extractMaxUserLink = (value) => {
  const match = String(value ?? '').match(/https:\/\/max\.ru\/u\/[A-Za-z0-9_-]+/i);
  return match?.[0] || '';
};

export const openMaxChat = (value) => {
  const link = extractMaxUserLink(value);
  if (!link) return false;

  try {
    maxBridge.openLink(link);
    return true;
  } catch (error) {
    console.warn('Не удалось открыть чат в MAX', error);
    return false;
  }
};