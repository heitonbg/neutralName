import { useCallback, useEffect } from 'react';
import { maxBridge } from '../utils/maxBridge.js';

export function useAppSessionEffects({
  store,
  userId,
  user,
  isMobile,
  setUser,
  setUserCoords,
  profile,
  setProfile,
  track,
  pushToast,
}) {
  const loadEvents = useCallback(async () => {
    try {
      await store.events.load();
    } catch (error) {
      console.error('Не удалось загрузить события', error);
      pushToast(error.message || 'Не удалось загрузить события', 'error');
    }
  }, [pushToast, store]);

  const refreshFriendsCount = useCallback(async () => {
    if (!store.session.userId) return;
    try {
      await store.friends.refreshCounts();
    } catch (error) {
      console.warn('Не удалось обновить счётчики друзей', error);
    }
  }, [store]);

  const loadBootstrap = useCallback(async () => {
    if (!store.session.userId) return;
    try {
      await store.session.loadBootstrap();
    } catch (error) {
      console.warn('Не удалось загрузить bootstrap', error);
    }
  }, [store]);

  useEffect(() => {
    let timeoutId;
    let attempts = 0;
    let active = true;

    maxBridge.init();
    const tryGetUser = () => {
      const maxUser = maxBridge.getUser();
      if (maxUser?.id) {
        setUser(maxUser);
        return;
      }
      attempts += 1;
      if (attempts < 30 && active) {
        timeoutId = window.setTimeout(tryGetUser, 100);
      } else if (active) {
        console.warn('[App] MAX Bridge не отдал пользователя за 3 секунды');
      }
    };
    tryGetUser();

    if (isMobile && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
        (error) => track('geolocation_unavailable', { code: error?.code }),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 },
      );
    }

    track('feed_opened');
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [isMobile, setUser, setUserCoords, track]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, userId]);

  useEffect(() => {
    if (!userId) return;
    refreshFriendsCount();
    loadBootstrap();
  }, [loadBootstrap, refreshFriendsCount, userId]);

  useEffect(() => {
    if (!userId) return;
    store.session.loadCachedProfile();
  }, [store, userId]);

  useEffect(() => {
    if (!userId || !user?.photo_url || profile.photo_url === user.photo_url) return;
    const maxPhoto = user.photo_url;
    store.session.updateProfile({ photo_url: maxPhoto })
      .then(() => {
        setProfile((previous) => ({ ...previous, photo_url: maxPhoto }));
      })
      .catch((error) => {
        console.warn('Не удалось сохранить фото из MAX Bridge', error);
      });
  }, [profile.photo_url, setProfile, store, user?.photo_url, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    store.tourist.sync().catch((error) => {
      if (active) {
        console.warn('Не удалось синхронизировать туристические маршруты', error);
      }
    });
    return () => {
      active = false;
    };
  }, [store, userId]);

  return { refreshFriendsCount, loadBootstrap };
}
