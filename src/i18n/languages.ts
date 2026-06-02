// src/i18n/languages.ts
export type LanguageInfo = {
    code: string
    name: string
    nativeName: string
    flag: string
    rtl: boolean
    complete: boolean
}

export const supportedLanguages = [
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false, complete: true },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false, complete: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false, complete: true },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', rtl: false, complete: true },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', rtl: false, complete: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, complete: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false, complete: true },

    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false, complete: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false, complete: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false, complete: false },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', rtl: false, complete: false },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', rtl: false, complete: false },
    { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸', rtl: false, complete: false },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', rtl: false, complete: false },
    { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', rtl: false, complete: false },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false, complete: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false, complete: false },
    { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', rtl: false, complete: false },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', rtl: false, complete: false },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', rtl: false, complete: false },
    { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', rtl: false, complete: false },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', rtl: false, complete: false },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', rtl: false, complete: false },
    { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', rtl: false, complete: false },
    { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', rtl: false, complete: false },
    { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹', rtl: false, complete: false },
    { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', rtl: false, complete: false },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', rtl: false, complete: false },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', rtl: false, complete: false },
    { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮', rtl: false, complete: false },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', rtl: false, complete: false },
    { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰', rtl: false, complete: false },
    { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', rtl: false, complete: false },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true, complete: false },
    { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '🇹🇷', rtl: false, complete: false },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', rtl: false, complete: false },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', rtl: false, complete: false },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴', rtl: false, complete: false },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', rtl: false, complete: false },
    { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇷', rtl: false, complete: false },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', rtl: false, complete: false },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true, complete: false },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', rtl: false, complete: false },
    { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', rtl: false, complete: false },
] as const satisfies readonly LanguageInfo[]

export type Locale = (typeof supportedLanguages)[number]['code']