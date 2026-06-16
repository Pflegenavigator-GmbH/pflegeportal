import { describe, expect, it } from 'vitest';

import { allgemeinerBriefGenerator } from '@/src/lib/briefe/domains/allgemein/allgemein.generator';
import { betreuungsrechtGenerator } from '@/src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.generator';
import { emRenteGenerator } from '@/src/lib/briefe/domains/em-rente/em-rente.generator';
import { erbrechtGenerator } from '@/src/lib/briefe/domains/erbrecht/erbrecht.generator';
import { antragPflegegradGenerator } from '@/src/lib/briefe/domains/pflegegrad/pflegegrad.generator';
import { schwerbehindertenausweisGenerator } from '@/src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.generator';
import { BriefGeneratorFactory } from '@/src/lib/briefe/generator-factory';
import { BriefPayload } from '@/src/types/briefe';

describe('BriefGeneratorFactory', () => {
  it.each([
    ['antrag-pflegegrad', antragPflegegradGenerator],
    ['widerspruch-pflegegrad', antragPflegegradGenerator],
    ['schwerbehindertenausweis', schwerbehindertenausweisGenerator],
    ['betreuungsrecht', betreuungsrechtGenerator],
    ['em-rente', emRenteGenerator],
    ['erbrecht', erbrechtGenerator],
    ['allgemein', allgemeinerBriefGenerator],
    ['versorgungsamt', allgemeinerBriefGenerator],
  ] satisfies ReadonlyArray<readonly [BriefPayload['type'], object]>)(
    'soll für "%s" den korrekten Generator zurückgeben',
    (type, expectedGenerator) => {
      expect(BriefGeneratorFactory.getGenerator(type)).toBe(expectedGenerator);
    }
  );

  it('soll für unbekannte Typen auf den allgemeinen Generator zurückfallen', () => {
    const unknownType = 'unbekannter-typ' as BriefPayload['type'];

    expect(BriefGeneratorFactory.getGenerator(unknownType)).toBe(allgemeinerBriefGenerator);
  });
});
