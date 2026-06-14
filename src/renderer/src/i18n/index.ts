import { fa as _fa } from './fa'
import { en } from './en'

export type Language = 'fa' | 'en'
export type Translations = typeof _fa

const translations: Record<Language, Translations> = { fa: _fa, en }

let currentLang: Language = 'fa'

export function setLanguage(lang: Language): void {
  currentLang = lang
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

export function getLanguage(): Language {
  return currentLang
}

export function t(): Translations {
  return translations[currentLang]
}

export function isRTL(): boolean {
  return currentLang === 'fa'
}

// Reactive proxy: fa.title always returns current language value
export const fa: Translations = new Proxy({} as Translations, {
  get(_target, prop) {
    return (translations[currentLang] as any)[prop]
  },
})
