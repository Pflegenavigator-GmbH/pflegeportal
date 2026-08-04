// src/i18n/languages.ts
export type LanguageInfo = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  /** Rechts-nach-links. Wird erst mit der RTL-Story wirksam. */
  rtl: boolean;
  /**
   * Steht die Sprache im Umschalter zur Wahl?
   *
   * Ersetzt das frühere `complete`, das handgepflegt und schlicht falsch war:
   * Türkisch, Ukrainisch, Polnisch, Russisch und Arabisch standen auf
   * „vollständig". Tatsächlich enthalten 32 der 35 Sprachverzeichnisse
   * WORTWÖRTLICHE englische Kopien — in tr/buttons.json steht `"weiter": "Next"`.
   *
   * Wer Türkisch wählte, bekam Englisch, ohne Hinweis. Für ein Portal, das
   * sich an Menschen mit Migrationshintergrund richtet, ist das schlechter,
   * als die Sprache nicht anzubieten. Deshalb sind vorerst nur Deutsch und
   * Englisch aktiv.
   *
   * Freischalten einer Sprache = hier `aktiv: true` setzen, sobald echte
   * Übersetzungen vorliegen. Dank des schlüsselgenauen Fallbacks (request.ts)
   * muss sie dafür nicht vollständig sein — Unübersetztes erscheint auf
   * Deutsch statt zu brechen.
   */
  aktiv: boolean;
};

export const supportedLanguages = [
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false, aktiv: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false, aktiv: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false, aktiv: false },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    rtl: false,
    aktiv: false,
  },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', rtl: false, aktiv: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, aktiv: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false, aktiv: false },

  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false, aktiv: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false, aktiv: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false, aktiv: false },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', rtl: false, aktiv: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', rtl: false, aktiv: false },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸', rtl: false, aktiv: false },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', rtl: false, aktiv: false },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', rtl: false, aktiv: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false, aktiv: false },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    rtl: false,
    aktiv: false,
  },
  {
    code: 'bg',
    name: 'Bulgarian',
    nativeName: 'Български',
    flag: '🇧🇬',
    rtl: false,
    aktiv: false,
  },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', rtl: false, aktiv: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', rtl: false, aktiv: false },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', rtl: false, aktiv: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', rtl: false, aktiv: false },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', rtl: false, aktiv: false },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', rtl: false, aktiv: false },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', rtl: false, aktiv: false },
  {
    code: 'lt',
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    flag: '🇱🇹',
    rtl: false,
    aktiv: false,
  },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', rtl: false, aktiv: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', rtl: false, aktiv: false },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', rtl: false, aktiv: false },
  {
    code: 'sl',
    name: 'Slovenian',
    nativeName: 'Slovenščina',
    flag: '🇸🇮',
    rtl: false,
    aktiv: false,
  },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', rtl: false, aktiv: false },
  {
    code: 'mk',
    name: 'Macedonian',
    nativeName: 'Македонски',
    flag: '🇲🇰',
    rtl: false,
    aktiv: false,
  },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', rtl: false, aktiv: false },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true, aktiv: false },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '🇹🇷', rtl: false, aktiv: false },
  {
    code: 'af',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    flag: '🇿🇦',
    rtl: false,
    aktiv: false,
  },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', rtl: false, aktiv: false },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴', rtl: false, aktiv: false },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', rtl: false, aktiv: false },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇷', rtl: false, aktiv: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', rtl: false, aktiv: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true, aktiv: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', rtl: false, aktiv: false },
  {
    code: 'fil',
    name: 'Filipino',
    nativeName: 'Filipino',
    flag: '🇵🇭',
    rtl: false,
    aktiv: false,
  },
] as const satisfies readonly LanguageInfo[];

export type Locale = (typeof supportedLanguages)[number]['code'];
