import { useCallback } from 'react';

export function useStoreState(store, key) {
  const setValue = useCallback(
    (value) => store.setValue(key, value),
    [store, key],
  );
  return [store[key], setValue];
}
