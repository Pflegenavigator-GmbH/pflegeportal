// src/lib/pflegegrad/client-api.ts
// Gemeinsamer Client-Zugriff auf die Answers-API — ersetzt die in Modul 1–6
// und im Kinder-Assessment kopierten fetch-Blöcke.
import { ASSESSMENT_MODULES, AssessmentModuleName } from '@/src/lib/pflegegrad/assessment-modules';

/** Die HTTP-only-Session (pf_case_code) fehlt oder passt nicht zum Fall. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Fall-Session abgelaufen oder ungültig.');
    this.name = 'SessionExpiredError';
  }
}

export async function loadModuleAnswers<T = Record<string, string>>(
  caseCode: string,
  moduleName: AssessmentModuleName
): Promise<T | null> {
  const res = await fetch(`/api/cases/${caseCode.toUpperCase()}/answers`);
  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error('Antworten konnten nicht geladen werden.');

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
  caseCode: string,
  moduleName: AssessmentModuleName,
  answers: Record<string, string | number | boolean>
): Promise<void> {
  const res = await fetch(`/api/cases/${caseCode.toUpperCase()}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleName, answers }),
  });
  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error('Speichern der Modulantworten fehlgeschlagen.');
}
