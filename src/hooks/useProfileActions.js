import { useCallback } from 'react';
import { extractMaxUserLink } from '../utils/maxBridge.js';

export function useProfileActions({
  store,
  userId,
  isGuestMode,
  user,
  profile,
  setProfile,
  setSelectedCity,
  setSelectedEvent,
  setQuickFilter,
  setFilters,
  setIsCityOpen,
  setTheme,
  setNotificationsOn,
  pushToast,
}) {
  const handleSaveProfile = useCallback(async (nextProfile) => {
    if (!userId && !isGuestMode) return;
    const age = Number(nextProfile.age);
    const sanitized = {
      age: Number.isInteger(age) && age >= 14 && age <= 120 ? age : null,
      city: String(nextProfile.city || '').trim().slice(0, 80),
      about: String(nextProfile.about || '').trim().slice(0, 500),
      maxLink: extractMaxUserLink(nextProfile.maxLink),
      name: user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : undefined,
      photo_url: user?.photo_url || null,
    };

    setProfile(sanitized);
    store.session.saveProfileLocally(sanitized);

    if (sanitized.city) {
      try {
        const { findCityByName } = await import('../utils/citySearch.js');
        const cityFromProfile = findCityByName(sanitized.city);
        if (cityFromProfile) {
          setSelectedCity(cityFromProfile);
          setQuickFilter(null);
          setFilters(null);
        }
      } catch (error) {
        console.warn('Не удалось определить город из профиля', error);
      }
    }

    if (isGuestMode) {
      pushToast('Профиль сохранён локально', 'info');
      return;
    }

    try {
      const updated = await store.session.updateProfile(sanitized);
      store.events.updateOrganizerProfile(userId, updated);
      setSelectedEvent((event) => {
        if (!event) return event;
        const organizerId = event.organizerId ?? event.organizer?.id;
        return String(organizerId) === String(userId)
          ? { ...event, organizer: { ...event.organizer, ...updated } }
          : event;
      });
      pushToast('Профиль сохранён');
    } catch (error) {
      console.warn('Не удалось синхронизировать профиль', error);
      pushToast('Профиль сохранён локально, но не синхронизирован', 'error');
    }
  }, [
    isGuestMode,
    pushToast,
    setFilters,
    setProfile,
    setQuickFilter,
    setSelectedCity,
    setSelectedEvent,
    store,
    user?.first_name,
    user?.last_name,
    user?.photo_url,
    userId,
  ]);

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
    setIsCityOpen(false);
    setQuickFilter(null);
    setFilters(null);
    if (userId && city?.name && profile.city !== city.name) {
      handleSaveProfile({ ...profile, city: city.name });
    }
  }, [
    handleSaveProfile,
    profile,
    setFilters,
    setIsCityOpen,
    setQuickFilter,
    setSelectedCity,
    userId,
  ]);

  const handleToggleTheme = useCallback((next) => {
    if (next !== 'light' && next !== 'dark') return;
    document.body.dataset.theme = next;
    setTheme(next);
    if (userId) {
      store.session.updateProfile({ theme: next }).catch((error) => {
        console.warn('Не удалось сохранить тему на сервере', error);
      });
    }
  }, [setTheme, store, userId]);

  const handleToggleNotifications = useCallback((next) => {
    if (typeof next !== 'boolean') return;
    setNotificationsOn(next);
    if (userId) {
      store.session.updateProfile({ notificationsEnabled: next }).catch((error) => {
        console.warn('Не удалось сохранить настройку уведомлений', error);
      });
    }
  }, [setNotificationsOn, store, userId]);

  return {
    handleSaveProfile,
    handleCitySelect,
    handleToggleTheme,
    handleToggleNotifications,
  };
}
