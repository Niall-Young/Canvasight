import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from "react";
import type { LanguagePreference } from "../../shared/types";
import { createTranslator, type Translate } from "./translations";

interface I18nContextValue {
  language: LanguagePreference;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue>({
  language: "zh",
  t: createTranslator("zh")
});

export function I18nProvider({
  children,
  language
}: {
  children: ReactNode;
  language: LanguagePreference;
}): ReactElement {
  const value = useMemo(
    () => ({
      language,
      t: createTranslator(language)
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
