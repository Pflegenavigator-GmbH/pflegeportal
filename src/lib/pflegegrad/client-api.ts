// src/lib/pflegegrad/client-api.ts
// Gemeinsamer Client-Zugriff auf die Answers-API — ersetzt die in Modul 1–6
// und im Kinder-Assessment kopierten fetch-Blöcke.
import { ASSESSMENT_MODULES, AssessmentModuleName } from '@/src/lib/pflegegrad/assessment-modules';
import { PflegegradErgebnis } from '@/src/types/pflegegrad';

export interface AdultAssessmentProgress {
  completedModules: number[];
  missingModules: number[];
  nextModule: number | null;
  hasResult: boolean;
}

export interface CaseStatus {
  isUnlocked: boolean;
  assessment: AdultAssessmentProgress;
}

/** Die HTTP-only-Session (pf_case_code) fehlt oder passt nicht zum Fall. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Fall-Session abgelaufen oder ungültig.');
    this.name = 'SessionExpiredError';
  }
}

export class IncompleteAssessmentError extends Error {
  constructor(public readonly nextModule: number) {
    super('Das Assessment ist noch nicht vollständig.');
    this.name = 'IncompleteAssessmentError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isModuleNumber(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 6;
}

/** Lädt den autoritativen Wiedereinstiegspunkt des Erwachsenen-Assessments. */
export async function loadCaseStatus(caseCode: string): Promise<CaseStatus> {
  const res = await fetch(`/api/cases/${caseCode.toUpperCase()}/status`);
  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error('Fallstatus konnte nicht geladen werden.');

  const payload: unknown = await res.json();
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error('Fallstatus hat ein ungültiges Format.');
  }

  const { data } = payload;
  if (!isRecord(data.assessment)) {
    throw new Error('Fallstatus hat ein ungültiges Format.');
  }
  const assessment = data.assessment;
  const completedModules = assessment.completedModules;
  const missingModules = assessment.missingModules;
  const nextModule = assessment.nextModule;

  if (
    typeof data.isUnlocked !== 'boolean' ||
    !Array.isArray(completedModules) ||
    !completedModules.every(isModuleNumber) ||
    !Array.isArray(missingModules) ||
    !missingModules.every(isModuleNumber) ||
    (nextModule !== null && !isModuleNumber(nextModule)) ||
    typeof assessment.hasResult !== 'boolean'
  ) {
    throw new Error('Fallstatus hat ein ungültiges Format.');
  }

  return {
    isUnlocked: data.isUnlocked,
    assessment: {
      completedModules,
      missingModules,
      nextModule,
      hasResult: assessment.hasResult,
    },
  };
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

/**
 * Holt das serverseitig berechnete Pflegegrad-Ergebnis. Der Server ist die
 * einzige Wahrheit — es wird nichts mehr aus localStorage rekonstruiert.
 */
export async function loadCaseResult(caseCode: string): Promise<PflegegradErgebnis> {
  const res = await fetch(`/api/cases/${caseCode.toUpperCase()}/result`);
  if (res.status === 401) throw new SessionExpiredError();
  if (res.status === 409) {
    const payload: unknown = await res.json();
    const nextModule =
      isRecord(payload) && isModuleNumber(payload.nextModule) ? payload.nextModule : 1;
    throw new IncompleteAssessmentError(nextModule);
  }
  if (!res.ok) throw new Error('Ergebnis konnte nicht berechnet werden.');

  const payload: unknown = await res.json();
  if (!isRecord(payload) || !isRecord(payload.ergebnis)) {
    throw new Error('Ergebnis hat ein ungültiges Format.');
  }
  return payload.ergebnis as unknown as PflegegradErgebnis;
}
