// src/lib/pflegegrad/assessment-modules.ts
// Einzige Wahrheit für das Mapping Feature → module_number in der answers-Tabelle.
// Historischer Kontext: Die alte MODULE_NUMBER_MAP ('pflegegrad', 'tagebuch',
// 'widerspruch', …) hat Pflegegradmodule, Tagebuch und Kinder-Assessment in
// dieselben Zeilen geschrieben und Daten gegenseitig überschrieben.
export const ASSESSMENT_MODULES = {
  modul1: 1, // Mobilität
  modul2: 2, // Kognitive und kommunikative Fähigkeiten
  modul3: 3, // Verhaltensweisen und psychische Problemlagen
  modul4: 4, // Selbstversorgung
  modul5: 5, // Krankheits-/Therapiebewältigung
  modul6: 6, // Alltagsgestaltung und soziale Kontakte
  kinder: 7, // Eigenständiges Kinder-Assessment
  tagebuch: 10, // Pflegetagebuch — eigener Namespace, kollidiert nicht mit Modul 5
} as const;

export type AssessmentModuleName = keyof typeof ASSESSMENT_MODULES;
export type AssessmentModuleNumber = (typeof ASSESSMENT_MODULES)[AssessmentModuleName];

export function isAssessmentModuleName(value: string): value is AssessmentModuleName {
  return value in ASSESSMENT_MODULES;
}

export const TAGEBUCH_MODULE_NUMBER = ASSESSMENT_MODULES.tagebuch;
