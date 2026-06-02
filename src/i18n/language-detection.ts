// src/i18n/language-detection.ts

/**
 * Language detection utilities for automatic language selection
 */
import { supportedLanguages } from './languages'

export type LanguageInfo = {
  code: string
  name: string
  nativeName: string
  rtl: boolean
}

const languageCodeMap: Record<string, string> = {
  de: 'de',
  'de-de': 'de',
  'de-at': 'de',
  'de-ch': 'de',

  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'en-au': 'en',
  'en-ca': 'en',

  tr: 'tr',
  'tr-tr': 'tr',

  pl: 'pl',
  'pl-pl': 'pl',

  ru: 'ru',
  'ru-ru': 'ru',

  it: 'it',
  'it-it': 'it',
  'it-ch': 'it',

  es: 'es',
  'es-es': 'es',
  'es-mx': 'es',
  'es-ar': 'es',

  fr: 'fr',
  'fr-fr': 'fr',
  'fr-ch': 'fr',
  'fr-be': 'fr',
  'fr-ca': 'fr',

  ar: 'ar',
  'ar-sa': 'ar',
  'ar-ae': 'ar',
  'ar-eg': 'ar',
  'ar-iq': 'ar',
  'ar-ma': 'ar',

  fa: 'fa',
  'fa-ir': 'fa',
  'fa-af': 'fa',

  bg: 'bg',
  'bg-bg': 'bg',

  hr: 'hr',
  'hr-hr': 'hr',

  cs: 'cs',
  'cs-cz': 'cs',

  da: 'da',
  'da-dk': 'da',

  nl: 'nl',
  'nl-nl': 'nl',
  'nl-be': 'nl',

  et: 'et',
  'et-ee': 'et',

  fi: 'fi',
  'fi-fi': 'fi',

  el: 'el',
  'el-gr': 'el',

  hu: 'hu',
  'hu-hu': 'hu',

  ga: 'ga',
  'ga-ie': 'ga',

  lv: 'lv',
  'lv-lv': 'lv',

  lt: 'lt',
  'lt-lt': 'lt',

  mt: 'mt',
  'mt-mt': 'mt',

  nb: 'no',
  nn: 'no',
  no: 'no',
  'no-no': 'no',

  pt: 'pt',
  'pt-pt': 'pt',
  'pt-br': 'pt',

  ro: 'ro',
  'ro-ro': 'ro',

  sk: 'sk',
  'sk-sk': 'sk',

  sl: 'sl',
  'sl-si': 'sl',

  sv: 'sv',
  'sv-se': 'sv',
  'sv-fi': 'sv',

  uk: 'uk',
  'uk-ua': 'uk',

  sr: 'sr',
  'sr-rs': 'sr',
  'sr-latn': 'sr',

  mk: 'mk',
  'mk-mk': 'mk',

  sq: 'sq',
  'sq-al': 'sq',

  bs: 'bs',
  'bs-ba': 'bs',

  is: 'is',
  'is-is': 'is',
}

const STORAGE_KEY = 'pflegenavigator-language'

export function isSupportedLanguage(code: string): boolean {
  return supportedLanguages.some((lang) => lang.code === code.toLowerCase())
}

export function getLanguageInfo(code: string) {
  return supportedLanguages.find((lang) => lang.code === code.toLowerCase())
}

export function detectBrowserLanguage(): string {
  if (typeof navigator === 'undefined') {
    return 'de'
  }

  const browserLanguages = navigator.languages || [navigator.language]

  for (const lang of browserLanguages) {
    const normalized = languageCodeMap[lang.toLowerCase()]
    if (normalized && isSupportedLanguage(normalized)) {
      return normalized
    }

    const baseLang = lang.split('-')[0].toLowerCase()
    if (isSupportedLanguage(baseLang)) {
      return baseLang
    }
  }

  return 'de'
}

export function getFallbackChain(preferredLang: string): string[] {
  const chain: string[] = []

  if (isSupportedLanguage(preferredLang)) {
    chain.push(preferredLang)
  }

  if (preferredLang !== 'de') chain.push('de')
  if (preferredLang !== 'en') chain.push('en')

  return chain
}

export function getStoredLanguage(): string | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  return localStorage.getItem(STORAGE_KEY)
}

export function storeLanguage(code: string): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(STORAGE_KEY, code)
}

export function detectLanguage(): string {
  const stored = getStoredLanguage()
  if (stored && isSupportedLanguage(stored)) {
    return stored
  }

  const browserLang = detectBrowserLanguage()
  if (isSupportedLanguage(browserLang)) {
    return browserLang
  }

  return 'de'
}