"use client";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

type ThemeCtxType = {
  theme: string;
  toggle: () => void;
  setTheme: (t: string) => void;
};

type LocaleCtxType = {
  locale: string;
  setLocale: (l: string) => void;
};

const ThemeCtx = createContext<ThemeCtxType>({
  theme: "light",
  toggle() {},
  setTheme() {},
});

const LocaleCtx = createContext<LocaleCtxType>({
  locale: "id",
  setLocale() {},
});

export const useTheme = () => useContext(ThemeCtx);
export const useLocale = () => useContext(LocaleCtx);

export function Providers({ children }: { children: ReactNode }) {
  const [theme] = useState("light");
  const [locale, setLocaleState] = useState("id");

  useEffect(() => {
    // Selalu paksa Light Mode
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("vb-theme", "light");
      localStorage.setItem("vetabite_theme", "light");

      const storedLocale =
        localStorage.getItem("vb-locale") ??
        localStorage.getItem("vetabite_locale") ??
        "id";
      setLocaleState(storedLocale);
    } catch {}
  }, []);

  const handleSetLocale = (l: string) => {
    setLocaleState(l);
    try {
      localStorage.setItem("vb-locale", l);
      localStorage.setItem("vetabite_locale", l);
    } catch {}
  };

  return (
    <ThemeCtx.Provider value={{ theme: "light", toggle: () => {}, setTheme: () => {} }}>
      <LocaleCtx.Provider value={{ locale, setLocale: handleSetLocale }}>
        <div data-locale={locale}>{children}</div>
      </LocaleCtx.Provider>
    </ThemeCtx.Provider>
  );
}