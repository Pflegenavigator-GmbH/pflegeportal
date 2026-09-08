import { describe, expect, it } from 'vitest';

import { parseKinderModuleData, serializeKinderModuleData } from './kinder-storage';

const fallback = { name: '', age: 3, ageGroup: 'preschool' as const };

describe('Kinder-Assessment-Persistenz', () => {
  it('speichert und lädt Kind-Metadaten gemeinsam mit den Antworten', () => {
    const serialized = serializeKinderModuleData(
      { name: ' Lea ', age: 1.25 },
      { k_ver_1: 3, k_sel_1: 2 }
    );

    expect(parseKinderModuleData(serialized, fallback)).toEqual({
      childInfo: { name: 'Lea', age: 1.25, ageGroup: 'baby' },
      answers: { k_ver_1: 3, k_sel_1: 2 },
    });
  });

  it('bleibt mit alten Datensätzen ohne Metadaten kompatibel', () => {
    expect(parseKinderModuleData({ k_mob_1: 2 }, fallback)).toEqual({
      childInfo: fallback,
      answers: { k_mob_1: 2 },
    });
  });

  it('ignoriert ungültige Metadaten und nichtnumerische Antworten', () => {
    expect(
      parseKinderModuleData({ meta_child_age: 99, meta_child_name: false, k_mob_1: '3' }, fallback)
    ).toEqual({ childInfo: fallback, answers: {} });
  });

  it('normalisiert Stammdaten vor dem Speichern auf die erlaubten Grenzen', () => {
    expect(serializeKinderModuleData({ name: `  ${'L'.repeat(120)}  `, age: 99 }, {})).toEqual({
      meta_child_name: 'L'.repeat(100),
      meta_child_age: 18,
    });
  });
});
