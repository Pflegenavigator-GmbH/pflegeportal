// src/types/i18n.d.ts
/**
 * Typsicherheit für Übersetzungsschlüssel und Locales.
 *
 * next-intl leitet daraus ab, welche Schlüssel `t()` kennt. Ein Tippfehler
 * wird damit zu einem tsc-Fehler statt zu einer Zeichenkette im Bildschirm —
 * bei über 400 Schlüsseln der Unterschied zwischen wartbar und nicht wartbar.
 *
 * Die REFERENZSPRACHE ist maßgeblich: Sie bestimmt, welche Schlüssel es gibt.
 * Andere Sprachen dürfen unvollständig sein — der Fallback in `request.ts`
 * greift schlüsselgenau — und taugen deshalb nicht als Typquelle.
 *
 * Hinweis zur Form: next-intl 4 erwartet die Erweiterung von `AppConfig` über
 * `declare module`. Das frühere globale `IntlMessages` stammt aus Version 3
 * und wird stillschweigend ignoriert — der Typ ist dann `any`, und niemand
 * merkt, dass die Prüfung fehlt.
 *
 * Wer einen Namespace ergänzt, trägt ihn HIER und in `namespaces.json` ein.
 */
import type briefe from '../../public/locales/de/briefe.json';
import type common from '../../public/locales/de/common.json';
import type emRente from '../../public/locales/de/em-rente.json';
import type faq from '../../public/locales/de/faq.json';
import type hilfe from '../../public/locales/de/hilfe.json';
import type kombileistungen from '../../public/locales/de/kombileistungen.json';
import type pflegegrad from '../../public/locales/de/pflegegrad.json';
import type philosophie from '../../public/locales/de/philosophie.json';
import type presse from '../../public/locales/de/presse.json';
import type rechtliches from '../../public/locales/de/rechtliches.json';
import type startseite from '../../public/locales/de/startseite.json';
import type tagebuch from '../../public/locales/de/tagebuch.json';
import type unterstuetzung from '../../public/locales/de/unterstuetzung.json';
import type widerspruch from '../../public/locales/de/widerspruch.json';
import type { Locale } from '../i18n/config';

interface Nachrichten {
  common: typeof common;
  startseite: typeof startseite;
  pflegegrad: typeof pflegegrad;
  philosophie: typeof philosophie;
  presse: typeof presse;
  widerspruch: typeof widerspruch;
  faq: typeof faq;
  tagebuch: typeof tagebuch;
  briefe: typeof briefe;
  hilfe: typeof hilfe;
  kombileistungen: typeof kombileistungen;
  unterstuetzung: typeof unterstuetzung;
  'em-rente': typeof emRente;
  rechtliches: typeof rechtliches;
}

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Nachrichten;
  }
}

export {};
