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
  const [theme, setThemeState] = useState("light");
  const [locale, setLocaleState] = useState("id");

  useEffect(() => {
    try {
      const storedTheme =
        localStorage.getItem("vb-theme") ??
        localStorage.getItem("vetabite_theme") ??
        "light";
      setThemeState(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      const storedLocale =
        localStorage.getItem("vb-locale") ??
        localStorage.getItem("vetabite_locale") ??
        "id";
      setLocaleState(storedLocale);
    } catch {}
  }, []);

  const handleSetTheme = (t: string) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("vb-theme", t);
      localStorage.setItem("vetabite_theme", t);
    } catch {}
  };

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    handleSetTheme(next);
  };

  const handleSetLocale = (l: string) => {
    setLocaleState(l);
    try {
      localStorage.setItem("vb-locale", l);
      localStorage.setItem("vetabite_locale", l);
    } catch {}
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle: handleToggleTheme, setTheme: handleSetTheme }}>
      <LocaleCtx.Provider value={{ locale, setLocale: handleSetLocale }}>
        <div data-locale={locale}>{children}</div>
      </LocaleCtx.Provider>
    </ThemeCtx.Provider>
  );
}
