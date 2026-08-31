import React, { createContext, useContext, useState, useEffect, useMemo, useTransition } from "react";
import { translations, type Lang } from "./translations";

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)[Lang];
  isPending?: boolean;
};

const I18nContext = createContext<I18nContextValue>({
  lang: "es",
  setLang: () => {},
  t: translations.es,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "en" || saved === "es") return saved;
    return "es";
  });
  const [isPending, startTransition] = useTransition();

  const setLang = (l: Lang) => {
    startTransition(() => {
      setLangState(l);
      localStorage.setItem("lang", l);
      document.documentElement.lang = l;
    });
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: translations[lang], isPending } as I18nContextValue & { isPending: boolean }), [lang, isPending]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useLang() {
  return useContext(I18nContext).lang;
}
