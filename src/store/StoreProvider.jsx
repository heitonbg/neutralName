import { createContext, useContext, useEffect, useState } from 'react';
import { reaction } from 'mobx';
import { cityStorage } from '../utils/cityStorage.js';
import { storage } from '../utils/storage.js';
import { RootStore } from './RootStore.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [store] = useState(() => new RootStore());

  useEffect(() => {
    const disposers = [
      reaction(() => store.ui.theme, (theme) => storage.setTheme(theme), {
        fireImmediately: true,
      }),
      reaction(
        () => store.session.selectedCity,
        (city) => cityStorage.set(city),
        { fireImmediately: true },
      ),
      reaction(
        () => store.session.notificationsOn,
        (enabled) => storage.setNotifications(enabled),
        { fireImmediately: true },
      ),
      reaction(() => store.filters.sortBy, (sort) => storage.setSort(sort), {
        fireImmediately: true,
      }),
      reaction(
        () => store.filters.likedIds.slice(),
        (ids) => storage.setLiked(ids),
        { fireImmediately: true },
      ),
    ];
    return () => disposers.forEach((dispose) => dispose());
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used within StoreProvider');
  return store;
}
