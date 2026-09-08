// src/api/cases/[code]/answers/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError } from '@/src/lib/api/errors';
import { isValidQuestionKey, withKey } from '@/src/lib/api/validation';
import { logger } from '@/src/lib/logger';
import { pruefeErwachsenenAntworten } from '@/src/lib/pflegegrad/answer-contract';
import {
  ASSESSMENT_MODULES,
  isAssessmentModuleName,
} from '@/src/lib/pflegegrad/assessment-modules';
import { calculateAndPersistCaseResult } from '@/src/lib/pflegegrad/case-result';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

type AnswerValue = string | number | boolean;

const MAX_ANSWERS_PER_MODULE = 200;
const MAX_KEY_LENGTH = 100;
const MAX_STRING_VALUE_LENGTH = 2000;

function isAnswerValue(value: unknown): value is AnswerValue {
  return (
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'string' && value.length <= MAX_STRING_VALUE_LENGTH)
  );
}

/**
 * Runtime-Validierung des Antwortobjekts — TypeScript-Interfaces validieren
 * keine HTTP-Anfragen. Erlaubt sind flache Key/Value-Paare.
 */
function parseAnswersObject(input: unknown): Record<string, AnswerValue> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ValidationError('answers muss ein Objekt mit Frage/Antwort-Paaren sein.');
  }

  const entries = Object.entries(input);
  if (entries.length === 0) {
    throw new ValidationError('answers darf nicht leer sein.');
  }
  if (entries.length > MAX_ANSWERS_PER_MODULE) {
    throw new ValidationError('Zu viele Antworten in einem Modul.');
  }

  // Aufbau über eine Map — kein dynamischer Property-Write, damit weder
  // __proto__ noch constructor den Prototyp verschmutzen können
  // (CodeQL: js/remote-property-injection)
  const result = new Map<string, AnswerValue>();
  for (const [key, value] of entries) {
    if (key.length === 0 || key.length > MAX_KEY_LENGTH) {
      throw new ValidationError(`Ungültiger Frageschlüssel: ${key.slice(0, 40)}`);
    }
    if (!isValidQuestionKey(key)) {
      throw new ValidationError(`Unzulässiger Frageschlüssel: ${key.slice(0, 40)}`);
    }
    if (!isAnswerValue(value)) {
      throw new ValidationError(`Ungültiger Antwortwert für Schlüssel "${key}".`);
    }
    result.set(key, value);
  }
  return Object.fromEntries(result) as Record<string, AnswerValue>;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('case_id', session.caseId)
      .order('module_number');

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    return handleApiError(err, 'api.cases.answers.get', code);
  }
}

interface BulkAnswerPayload {
  moduleName?: unknown;
  answers?: unknown;
  // Legacy-Einzelantwort (alte Clients) — wird gemerged statt ersetzt
  questionKey?: unknown;
  answerValue?: unknown;
}

/**
 * Speichert Antworten eines Moduls.
 * Bevorzugter Vertrag: { moduleName, answers: { frage: wert, ... } } —
 * EIN atomarer Upsert ersetzt den kompletten Modulstand und eliminiert die
 * Race Condition der früheren parallelen Einzel-Requests.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const session = await requireCaseSession(code);

    let body: BulkAnswerPayload;
    try {
      body = (await request.json()) as BulkAnswerPayload;
    } catch {
      throw new ValidationError('Request-Body ist kein gültiges JSON.');
    }

    if (typeof body.moduleName !== 'string' || !isAssessmentModuleName(body.moduleName)) {
      throw new ValidationError(
        `Unbekanntes Modul "${String(body.moduleName).slice(0, 40)}". ` +
          `Erlaubt: ${Object.keys(ASSESSMENT_MODULES).join(', ')}`
      );
    }
    const moduleName = body.moduleName;
    const moduleNumber = ASSESSMENT_MODULES[moduleName];

    const supabase = createAdminSupabaseClient();

    let updatedAnswers: Record<string, AnswerValue>;

    if (body.answers !== undefined) {
      // Atomarer Bulk-Save: kompletter Modulstand in einem Request
      updatedAnswers = parseAnswersObject(body.answers);
      const vertragsfehler = pruefeErwachsenenAntworten(moduleNumber, updatedAnswers, true);
      if (vertragsfehler) throw new ValidationError(vertragsfehler);
    } else {
      // Legacy: Einzelantwort — Read-Modify-Write bleibt hier nötig,
      // neue Clients sollten den Bulk-Vertrag verwenden.
      if (typeof body.questionKey !== 'string' || !isAnswerValue(body.answerValue)) {
        throw new ValidationError('Erwartet: answers-Objekt oder questionKey/answerValue.');
      }
      // 🛡️ Gleicher Prototype-Pollution-Schutz wie im Bulk-Pfad
      if (!isValidQuestionKey(body.questionKey)) {
        throw new ValidationError('Unzulässiger Frageschlüssel.');
      }

      const vertragsfehler = pruefeErwachsenenAntworten(
        moduleNumber,
        { [body.questionKey]: body.answerValue },
        false
      );
      if (vertragsfehler) throw new ValidationError(vertragsfehler);

      const { data: existingRecord } = await supabase
        .from('answers')
        .select('answers')
        .eq('case_id', session.caseId)
        .eq('module_number', moduleNumber)
        .maybeSingle();

      updatedAnswers = withKey(
        (existingRecord?.answers as Record<string, AnswerValue>) || {},
        body.questionKey,
        body.answerValue
      );
    }

    const { data, error } = await supabase
      .from('answers')
      .upsert(
        {
          case_id: session.caseId,
          module_number: moduleNumber,
          module_name: moduleName,
          answers: updatedAnswers,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'case_id,module_number',
        }
      )
      .select();

    if (error) throw error;

    // Denormalisierte Statusfelder werden ausschließlich aus den soeben
    // serverseitig gespeicherten Erwachsenen-Antworten abgeleitet.
    if (moduleNumber >= 1 && moduleNumber <= 6) {
      await calculateAndPersistCaseResult(supabase, session.caseId);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'api.cases.answers.post', code);
  }
}

/**
 * Setzt ausschließlich das Erwachsenen-Assessment (Module 1–6) zurück und
 * verwirft die daraus berechneten Werte. Kinder und Tagebuch bleiben erhalten.
 *
 * Notwendig, weil die Antworten serverseitig liegen — ein Leeren des
 * localStorage im Browser setzt nichts zurück, die Module würden ihre alten
 * Antworten beim nächsten Aufruf wieder vom Server laden.
 *
 * Bewusst unangetastet bleiben Zahlstatus, Produkt-Tier und Freischaltung:
 * Eine neue Begutachtung darf einen bezahlten Zugang nicht entwerten. Auch
 * das Bescheiddatum bleibt erhalten — es ist eine Tatsache aus der realen
 * Welt und hängt nicht an der Selbsteinschätzung.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const session = await requireCaseSession(code);
    const supabase = createAdminSupabaseClient();

    const { error: resetFehler } = await supabase.rpc('reset_adult_assessment', {
      p_case_id: session.caseId,
    });

    if (resetFehler) throw resetFehler;

    logger.info({ caseCode: code }, 'Begutachtung zurückgesetzt: Antworten gelöscht');

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, 'api.cases.answers.delete', code);
  }
}
