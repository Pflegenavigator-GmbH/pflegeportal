// src/i18n/rtl.ts
import { supportedLanguages } from './languages'

export function isRTL(language: string): boolean {
  const lang = supportedLanguages.find((entry) => entry.code === language.toLowerCase())
  return lang?.rtl ?? false
}

export function getTextDirection(language: string): 'ltr' | 'rtl' {
  return isRTL(language) ? 'rtl' : 'ltr'
}

export function getRTLClasses(isRtl: boolean): string {
  return isRtl ? 'rtl text-right' : 'ltr text-left'
}

export const rtlFontFamilies = [
  'Arial',
  'Tahoma',
  'Segoe UI',
  'Dubai',
  'Noto Sans Arabic',
  'Noto Naskh Arabic',
  'system-ui',
  'sans-serif',
].join(', ')

export function shouldMirrorIcon(iconName: string, isRtl: boolean): boolean {
  if (!isRtl) return false

  const mirrorIcons = [
    'arrow-left', 'arrow-right',
    'chevron-left', 'chevron-right',
    'caret-left', 'caret-right',
    'angle-left', 'angle-right',
    'backspace', 'delete',
    'reply', 'forward',
    'redo', 'undo',
    'next', 'previous',
    'first', 'last',
  ]

  return mirrorIcons.some((icon) => iconName.includes(icon))
}