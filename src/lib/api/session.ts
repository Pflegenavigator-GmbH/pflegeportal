// src/lib/api/session.ts
import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { cookies } from 'next/headers';

import { normalizeCaseCode } from '@/src/lib/case-code';
import { berechneCaseCodeHash } from '@/src/lib/case-code-server';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

/**
 * Gerätesitzungen (#135, ADR-0002 Lage A).
 *
 * Das Cookie trägt einen undurchsichtigen Zufallswert, keinen Fallcode. Der
 * Server hält dazu einen Sitzungsbestand mit Ablauf und Widerruf. Damit ist
 * die Fortsetzung auf demselben Gerät vom Zugangsmittel getrennt: Eine
 * Sitzung lässt sich beenden, ohne den Fall zu sperren, und ein abgelaufenes
 * Cookie öffnet nichts mehr.
 *
 * Gespeichert wird nur die SHA-256-Ableitung. Ein Pepper wie beim Fallcode
 * (#153) ist hier nicht nötig: Der Nachweis hat 256 Bit Entropie, ein
 * Durchprobieren scheidet aus.
 */
const SITZUNGS_COOKIE = 'pf_session';

/** Cookie der alten Lösung: enthielt den Fallcode im Klartext. */
const ALTES_COOKIE = 'pf_case_code';

/**
 * Bis hierhin werden alte Cookies in Sitzungen überführt. Danach führt ein
 * altes Cookie ins Leere, und die Person gibt ihren Fallcode erneut ein —
 * was sie ohnehin können muss, solange es die Wiederherstellung aus #134
 * nicht gibt.
 */
const UEBERGANG_BIS = new Date('2026-12-31T23:59:59Z');

/**
 * Sitzungsdauer. Bewusst großzügig: Die Zielgruppe arbeitet über Wochen an
 * einem Antrag, und jede abgelaufene Sitzung zwingt zur Wiedereingabe des
 * Fallcodes — also genau zu dem Schritt, den ADR-0002 abschaffen will.
 * Die Frist verlängert sich bei jeder Nutzung (gleitend).
 */
const SITZUNGSDAUER_TAGE = 30;

export interface Sitzung {
  sitzungId: string;
  caseId: string;
  billingStatus: string;
  productTier: string | null;
  isUnlocked: boolean;
}

function ableitung(nachweis: string): string {
  return createHash('sha256').update(nachweis, 'utf8').digest('hex');
}

function ablaufAb(zeitpunkt: Date): Date {
  return new Date(zeitpunkt.getTime() + SITZUNGSDAUER_TAGE * 24 * 60 * 60 * 1000);
}

async function setzeCookie(nachweis: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SITZUNGS_COOKIE, nachweis, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Lax statt Strict: Nach der Rückkehr von Stripe kommt die Person über
    // eine fremde Seite zurück. Mit Strict wäre das Cookie dabei nicht dabei
    // und die Sitzung schiene verloren.
    sameSite: 'lax',
    maxAge: SITZUNGSDAUER_TAGE * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Legt eine Sitzung für einen Fall an und setzt das Cookie.
 *
 * @returns die Sitzungskennung; der Nachweis selbst verlässt diese Funktion
 *   nur über das Cookie.
 */
export async function erzeugeSitzung(caseId: string): Promise<string> {
  const nachweis = randomBytes(32).toString('base64url');
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('case_sessions')
    .insert({
      case_id: caseId,
      token_hash: ableitung(nachweis),
      expires_at: ablaufAb(new Date()).toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw error ?? new Error('Sitzung konnte nicht angelegt werden.');
  }

  await setzeCookie(nachweis);
  return data.id;
}

/**
 * Liest die Sitzung des Geräts.
 *
 * Verlängert dabei die Laufzeit (gleitendes Fenster) und schreibt die letzte
 * Nutzung fort. Beides ist ein Schreibzugriff je Anfrage — vertretbar, weil
 * die Alternative entweder eine harte Abmeldung mitten im Antrag wäre oder
 * eine Sitzung, deren tatsächliche Nutzung niemand kennt.
 *
 * @returns `null`, wenn kein Cookie da ist, die Sitzung abgelaufen, widerrufen
 *   oder unbekannt ist.
 */
export async function leseSitzung(): Promise<Sitzung | null> {
  const cookieStore = await cookies();
  const nachweis = cookieStore.get(SITZUNGS_COOKIE)?.value;

  if (!nachweis) return null;

  const supabase = createAdminSupabaseClient();
  const jetzt = new Date();

  const { data, error } = await supabase
    .from('case_sessions')
    .select('id, case_id, expires_at, revoked_at, cases (billing_status, product_tier)')
    .eq('token_hash', ableitung(nachweis))
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at) <= jetzt) return null;

  const fall = data.cases as unknown as {
    billing_status: string;
    product_tier: string | null;
  } | null;

  if (!fall) return null;

  await supabase
    .from('case_sessions')
    .update({
      last_used_at: jetzt.toISOString(),
      expires_at: ablaufAb(jetzt).toISOString(),
    })
    .eq('id', data.id);

  return {
    sitzungId: data.id,
    caseId: data.case_id,
    billingStatus: fall.billing_status,
    productTier: fall.product_tier,
    isUnlocked: fall.billing_status === 'paid' || fall.billing_status === 'free',
  };
}

/** Beendet die Sitzung dieses Geräts — sofort wirksam, nicht erst bei Ablauf. */
export async function beendeSitzung(): Promise<void> {
  const cookieStore = await cookies();
  const nachweis = cookieStore.get(SITZUNGS_COOKIE)?.value;

  if (nachweis) {
    const supabase = createAdminSupabaseClient();
    await supabase
      .from('case_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', ableitung(nachweis));
  }

  cookieStore.delete(SITZUNGS_COOKIE);
  // Das alte Cookie mit abräumen, falls noch eines liegt.
  cookieStore.delete(ALTES_COOKIE);
}

/** Beendet ALLE Sitzungen eines Falls — für Widerruf und Löschung (#157). */
export async function beendeAlleSitzungen(caseId: string): Promise<void> {
  const supabase = createAdminSupabaseClient();

  await supabase
    .from('case_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('case_id', caseId)
    .is('revoked_at', null);
}

/**
 * Übergangsregel: Wer noch das alte Cookie mit dem Fallcode hat, bekommt
 * daraus eine Sitzung — einmalig, danach ist das alte Cookie weg.
 *
 * BEFRISTET BIS 31.12.2026. Danach kann diese Funktion samt Aufrufern
 * entfallen; ein altes Cookie führt dann ins Leere, und die Person gibt ihren
 * Fallcode erneut ein.
 *
 * @returns die neue Sitzung oder `null`, wenn es nichts zu übernehmen gab.
 */
export async function uebernehmeAltesCookie(): Promise<Sitzung | null> {
  if (new Date() > UEBERGANG_BIS) return null;

  const cookieStore = await cookies();
  const alterCode = normalizeCaseCode(cookieStore.get(ALTES_COOKIE)?.value);

  if (!alterCode) return null;

  const supabase = createAdminSupabaseClient();
  const { data: fall } = await supabase
    .from('cases')
    .select('id, billing_status, product_tier')
    .eq('case_code_hash', berechneCaseCodeHash(alterCode))
    .maybeSingle();

  cookieStore.delete(ALTES_COOKIE);

  if (!fall) return null;

  const sitzungId = await erzeugeSitzung(fall.id);

  return {
    sitzungId,
    caseId: fall.id,
    billingStatus: fall.billing_status,
    productTier: fall.product_tier,
    isUnlocked: fall.billing_status === 'paid' || fall.billing_status === 'free',
  };
}
