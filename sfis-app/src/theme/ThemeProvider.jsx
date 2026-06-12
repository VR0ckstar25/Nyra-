// ThemeProvider.jsx — the RN equivalent of the web prototype's CSS variables.
// One theme object in Context, handed to the whole app. Pick Background+Accent →
// rebuild it → every screen recolors instantly, offline, persisted across launches.

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme, DEFAULT_THEME } from './tokens';

const STORAGE_KEY = 'anvara.theme.v1';
const LEGACY_STORAGE_KEY = 'sfis.theme.v1';
const LEGACY_DEFAULT_THEME = { background: 'sky', accent: 'cobalt' };
const ThemeContext = createContext(null);

export function ThemeProvider({ children, fallback = null }) {
  const [keys, setKeys] = useState(DEFAULT_THEME);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const legacySaved = saved ? null : await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        const parsed = saved || legacySaved ? JSON.parse(saved || legacySaved) : null;
        if (parsed) {
          const next = { ...DEFAULT_THEME, ...parsed };
          const wasOldDefault = next.background === LEGACY_DEFAULT_THEME.background && next.accent === LEGACY_DEFAULT_THEME.accent;
          const migrated = wasOldDefault ? DEFAULT_THEME : next;
          setKeys(migrated);
          if (legacySaved || wasOldDefault) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)).catch(() => {});
          }
        }
      } catch (_) { /* default theme */ }
      finally { setHydrated(true); }
    })();
  }, []);

  const setTheme = useCallback((next) => {
    setKeys((prev) => {
      const merged = { ...prev, ...next };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, []);

  const theme = useMemo(() => buildTheme(keys.background, keys.accent), [keys]);
  const value = useMemo(() => ({ theme, keys, setTheme }), [theme, keys, setTheme]);

  if (!hydrated) return fallback;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
