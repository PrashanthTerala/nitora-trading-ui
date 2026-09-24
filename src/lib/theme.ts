import { create } from 'zustand';
import { STORAGE_KEYS } from './storageKeys';

/**
 * The light/dark theme, shared by every control that changes it -- the header toggle, the
 * mobile "More" sheet, the command palette -- so they can never disagree.
 *
 * The class on <html> is the source of truth for styling. This module sets it from storage the
 * moment it is first evaluated, and starts the store from the same answer. It used to be
 * main.tsx that set the class, after its imports -- by which time this store had already read
 * the class index.html ships with (dark), so a reader who chose light got light pages with
 * dark-theme artwork chosen by the store.
 */
function initial(): boolean {
  if (typeof document === 'undefined') return true;
  let dark = true; // dark is the default theme
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved) dark = saved === 'dark';
  } catch {
    // Storage can be unavailable; the default stands.
  }
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(STORAGE_KEYS.theme, dark ? 'dark' : 'light');
  } catch {
    // Storage can be unavailable (private windows, blocked site data); the theme still applies.
  }
}

interface ThemeState {
  dark: boolean;
  setDark: (dark: boolean) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  dark: initial(),
  setDark: (dark) => {
    apply(dark);
    set({ dark });
  },
  toggle: () => get().setDark(!get().dark),
}));
