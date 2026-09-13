import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LocalizedString } from './types';
import { getLocalStorageItem, setLocalStorageItem, STORAGE_KEYS } from './src/lib/storage/safe-local-storage';
import { changeBackendLanguage } from './src/features/i18n/services/language-api.service';
import arCatalog, { type TranslationKey } from './src/lib/i18n/locales/ar';

type Language = 'ar' | 'en' | 'fr' | 'es';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  dir: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  localize: (content: LocalizedString | string) => string;
}

// `ar` is the site default and ships in the main bundle (imported statically above) so first
// paint never has to wait on a network request. `en`/`fr`/`es` are ~440 strings each — most
// visitors never need them — so they're behind an explicit loader map (not a template-literal
// `import(`./locales/${lang}`)`, which Turbopack can't statically analyse and would bundle the
// entire locales directory, defeating the split). Every loaded catalog is a complete
// `Record<TranslationKey, string>` — for `fr`/`es` the English fallback is baked in at generation
// time (see the scripted extraction from the old inline `translations` map), so a single loaded
// catalog is always enough to render `t()` for every key with no additional fetch.
const LOADERS = {
  en: () => import('./src/lib/i18n/locales/en'),
  fr: () => import('./src/lib/i18n/locales/fr'),
  es: () => import('./src/lib/i18n/locales/es'),
} satisfies Record<Exclude<Language, 'ar'>, () => Promise<{ default: Record<TranslationKey, string> }>>;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // `language`/`catalog` are only ever updated together (see `commitLanguage` below), so the
  // active dictionary always matches `dir`/`document.documentElement.lang` — there is no render
  // where `t()` can return raw keys or content is out of sync with text direction. The trade-off
  // (spelled out in the task) is that switching to (or opening the app in) a non-Arabic language
  // keeps showing the previous/default language until that locale's chunk finishes loading,
  // rather than ever flashing an untranslated key.
  const catalogCacheRef = useRef<Partial<Record<Language, Record<TranslationKey, string>>>>({ ar: arCatalog });
  const [language, setLanguageState] = useState<Language>('ar');
  const [catalog, setCatalog] = useState<Record<TranslationKey, string>>(arCatalog);

  const commitLanguage = useCallback((lang: Language) => {
    const cached = catalogCacheRef.current[lang];
    if (cached) {
      setLanguageState(lang);
      setCatalog(cached);
      return;
    }
    if (lang === 'ar') return; // ar is seeded into the cache above; unreachable.
    void LOADERS[lang]().then((mod) => {
      catalogCacheRef.current[lang] = mod.default;
      setLanguageState(lang);
      setCatalog(mod.default);
    });
  }, []);

  // Persist here rather than in the `language` effect below. That effect fires on every
  // change to the *rendered* language, including the initial `'ar'` — and because restoring
  // a saved non-Arabic preference is asynchronous (it waits on a locale chunk), the mount
  // sequence was: restore effect starts loading `en` -> persistence effect writes `'ar'` over
  // the user's saved `'en'`. A failed chunk load or a navigation inside that window lost the
  // preference for good. Storage should record what the user chose, not what is on screen.
  const setLanguage = useCallback(
    (lang: Language) => {
      setLocalStorageItem(STORAGE_KEYS.language, lang);
      commitLanguage(lang);
    },
    [commitLanguage],
  );

  // Apply the saved preference once on mount. `language`/`catalog` start as `ar` (see above) so
  // this only matters for returning visitors whose saved language isn't Arabic.
  useEffect(() => {
    const saved = getLocalStorageItem(STORAGE_KEYS.language) as Language | null;
    if (saved && saved !== 'ar') commitLanguage(saved);
  }, [commitLanguage]);

  // Annotated (not cast): useMemo has no contextual type, so without this the literal
  // union widens to `string` and no longer satisfies LanguageContextType['dir'].
  const dir: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    if (language === 'ar' || language === 'en') {
      void changeBackendLanguage(language).catch(() => {
        // Local language switching remains available while the API is offline.
      });
    }
  }, [language, dir]);

  // `t` and `localize` are stabilised, and the context value memoised, because a fresh
  // object literal here re-renders every consumer of this context on any render of this
  // provider — and this provider sits at the root, so that is ~94 route trees. Same fix
  // AuthProvider already received in Batch 2.
  // (vercel-react-best-practices: rerender-defer-reads)
  const t = useCallback(
    (key: TranslationKey) => {
      const value = catalog[key];
      return value === undefined ? key : value;
    },
    [catalog],
  );

  const localize = useCallback(
    (content: LocalizedString | string | undefined | null) => {
      if (!content) return '';
      if (typeof content === 'string') return content;
      // No cast needed: LocalizedString's keys are exactly the Language union
      // ('ar'/'en' required, 'fr'/'es' optional), so this index is already type-safe
      // and yields `string | undefined`. The previous `as any` here was hiding nothing.
      return content[language] || content.en || '';
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, dir, setLanguage, t, localize }),
    [language, dir, setLanguage, t, localize],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
