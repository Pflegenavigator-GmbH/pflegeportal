// src/i18n/config.ts
import { supportedLanguages } from './languages'

export const defaultLocale = 'de' as const
export const localePrefix = 'always' as const

export const locales = supportedLanguages.map((lang) => lang.code) as readonly string[]

export function isValidLocale(locale: unknown): locale is string {
    return typeof locale === 'string' && locales.includes(locale)
}