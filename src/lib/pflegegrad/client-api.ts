// src/lib/pflegegrad/client-api.ts
// Gemeinsamer Client-Zugriff auf die Answers-API — ersetzt die in Modul 1–6
// und im Kinder-Assessment kopierten fetch-Blöcke.
import { ASSESSMENT_MODULES, AssessmentModuleName } from '@/src/lib/pflegegrad/assessment-modules';
import { PflegegradErgebnis } from '@/src/types/pflegegrad';

/** Die HTTP-only-Session (pf_case_code) fehlt oder passt nicht zum Fall. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Fall-Session abgelaufen oder ungültig.');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Baut aus einer fehlgeschlagenen Antwort einen Fehler mit dem Grund darin.
 *
 * Vorher warfen beide Funktionen einen festen Satz ohne Status und Code; in der
 * Browserkonsole erschien `{}`. Man sah, DASS etwas scheiterte, aber weder
 * Status noch Fehlerart — das kostete beim Speicherfehler vom 16.09.2026 die
 * meiste Zeit.
 *
 * Der ausführliche Grund („Frageschlüssel ‚kochen' gehört nicht zu Modul 1")
 * bleibt bewusst im Serverlog: Die API gibt nach außen nur eine allgemeine
 * Meldung heraus. Hier landen deshalb Status und Code, nicht mehr.
 */
async function fehlerAusAntwort(res: Response, standardtext: string): Promise<Error> {
  try {
    const koerper = (await res.json()) as { error?: { code?: string; message?: string } };
    const teile = [koerper.error?.code, koerper.error?.message].filter(Boolean);
    if (teile.length > 0) {
      return new Error(`${standardtext} (${res.status}, ${teile.join(': ')})`);
    }
  } catch {
    // Kein JSON im Körper — dann bleibt es beim Standardtext samt Status.
  }
  return new Error(`${standardtext} (${res.status})`);
}

export async function loadModuleAnswers<T = Record<string, string>>(
  moduleName: AssessmentModuleName
): Promise<T | null> {
  // Kein Fallcode im Pfad: Der Fall kommt aus der Sitzung (#135).
  const res = await fetch('/api/case/answers', { credentials: 'include' });
  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw await fehlerAusAntwort(res, 'Antworten konnten nicht geladen werden');

  const data = (await res.json()) as Array<{ module_number: number; answers: T }>;
  const moduleNumber = ASSESSMENT_MODULES[moduleName];
  return data.find((r) => r.module_number === moduleNumber)?.answers ?? null;
}

/**
 * Speichert den kompletten Modulstand in EINEM atomaren Request.
 * Wirft bei Fehlern — der Aufrufer darf dann NICHT weiternavigieren,
 * damit keine Eingaben verloren gehen.
 */
export async function saveModuleAnswers(
  moduleName: AssessmentModuleName,
  answers: Record<string, string | number | boolean>
): Promise<void> {
  const res = await fetch('/api/case/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ moduleName, answers }),
  });
  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw await fehlerAusAntwort(res, 'Speichern der Modulantworten fehlgeschlagen');
}

/**
 * Holt das serverseitig berechnete Pflegegrad-Ergebnis. Der Server ist die
 * einzige Wahrheit — es wird nichts mehr aus localStorage rekonstruiert.
 */
export async function loadCaseResult(): Promise<PflegegradErgebnis> {
  const res = await fetch('/api/case/result', { credentials: 'include' });
  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error('Ergebnis konnte nicht berechnet werden.');

  const data = (await res.json()) as { ergebnis: PflegegradErgebnis };
  return data.ergebnis;
}
