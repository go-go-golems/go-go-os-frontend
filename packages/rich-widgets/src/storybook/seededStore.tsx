import type { EnhancedStore } from '@reduxjs/toolkit';
import { type ReactNode, useMemo } from 'react';
import { Provider } from 'react-redux';

export type SeedStore<TStore extends EnhancedStore = EnhancedStore> = (
  store: TStore,
) => void;

export function composeSeedStores<TStore extends EnhancedStore>(
  ...seeders: Array<SeedStore<TStore> | undefined>
): SeedStore<TStore> {
  return (store) => {
    for (const seedStore of seeders) {
      seedStore?.(store);
    }
  };
}

export function SeededStoreProvider({
  createStore,
  seedStore,
  children,
}: {
  createStore: () => EnhancedStore;
  seedStore?: SeedStore;
  children: ReactNode;
}) {
  const store = useMemo(() => {
    const seededStore = createStore();
    seedStore?.(seededStore);
    return seededStore;
  }, [createStore, seedStore]);

  return <Provider store={store}>{children}</Provider>;
}
