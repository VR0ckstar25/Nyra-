// ThemeProvider.jsx — the "roundabout" for the web prototype's CSS variables.
//
// React Native has no CSS variables. Instead we keep ONE theme object in React
// context and hand it to the whole app. When the user picks a Background+Accent,
// we rebuild that object and every screen recolors instantly — no reload, no
// flicker, works fully offline. The choice is persisted so it survives restarts.
//
// Every component reads colors via useTheme() — never hardcodes a themeable hex.
// (Fixed tokens like the amber finding dot live in tokens.js and never change.)

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme, DEFAULT_THEME } from './tokens';

const STORAGE_KEY = 'anvara.theme.v1';
const LEGACY_STORAGE_KEY = 'sfis.theme.v1';
const ThemeContext = createContext(null);

export function ThemeProvider({ children, fallback = null }) {
  const [keys, setKeys] = useState(DEFAULT_THEME);     // { background, accent }
  const [hydrated, setHydrated] = useState(false);

  // Re-apply the saved choice on launch.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const legacySaved = saved ? null : await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        if (saved || legacySaved) setKeys({ ...DEFAULT_THEME, ...JSON.parse(saved || legacySaved) });
      } catch (_) { /* fall back to default theme */ }
      finally { setHydrated(true); }
    })();
  }, []);

  // Persist on every change. Accepts a partial, e.g. setTheme({ accent: 'grape' }).
  const setTheme = useCallback((next) => {
    setKeys((prev) => {
      const merged = { ...prev, ...next };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, []);

  const theme = useMemo(() => buildTheme(keys.background, keys.accent), [keys]);
  const value = useMemo(() => ({ theme, keys, setTheme }), [theme, keys, setTheme]);

  // Avoid a first-frame flash of the default theme before the saved one loads.
  if (!hydrated) return fallback;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// The hook every screen uses: const { theme } = useTheme();
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
