import { create } from 'zustand';
import { STORAGE_KEYS } from './storageKeys';

/**
 * The light/dark theme, shared by every control that changes it -- the header toggle, the
 * mobile "More" sheet, the command palette -- so they can never disagree.
 *
 * The class on <html> is still the source of truth for styling; main.tsx sets it from storage
 * before first paint, and this store starts from whatever it found.
 */
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
  dark: typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  setDark: (dark) => {
    apply(dark);
    set({ dark });
  },
  toggle: () => get().setDark(!get().dark),
}));
