"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  resolveLocale,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";

type LocaleState = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleState>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translate(DEFAULT_LOCALE, key),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // The pages are prerendered, so the first paint has to use one fixed locale.
  // The browser's preference is applied after mount, and an explicit choice
  // always wins over it.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const next = stored
      ? resolveLocale([stored])
      : resolveLocale(navigator.languages ?? [navigator.language]);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(next);
  }, []);

  // Screen readers and the browser's own translation prompt read this.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);

/** Shorthand for components that only need the translate function. */
export const useT = () => useContext(LocaleContext).t;
