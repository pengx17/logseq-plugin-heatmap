import { createFetchStore } from "react-suspense-fetch";

const translationModules = import.meta.glob("./locale/*.json");

export const i18nStore = createFetchStore(async (locale: string) => {
  const moduleName = `./locale/${locale}.json`;
  const res = await translationModules[moduleName]();
  return res;
});

const DEFAULT_LOCALE = "en";
let locale = DEFAULT_LOCALE;

export const setLocale = (l: string) => {
  locale = l;
  i18nStore.prefetch(l);
};

i18nStore.prefetch(locale);

export function t(key: string, args?: { [key: string]: string | number }) {
  const template =
    i18nStore.get(locale)?.[key] ?? i18nStore.get(DEFAULT_LOCALE)?.[key];

  if (args == null) return template;

  return Object.entries(args).reduce(
    (str, [name, val]) => str.replaceAll(`\${${name}}`, val),
    template
  );
}
