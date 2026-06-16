// src/lib/briefe/generator-factory.ts

// eslint-disable-next-line import-x/order
import { IBriefGenerator } from '@/src/lib/briefe/base.generator';

import { allgemeinerBriefGenerator } from '@/src/lib/briefe/domains/allgemein/allgemein.generator';
import { betreuungsrechtGenerator } from '@/src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.generator';
import { emRenteGenerator } from '@/src/lib/briefe/domains/em-rente/em-rente.generator';
import { erbrechtGenerator } from '@/src/lib/briefe/domains/erbrecht/erbrecht.generator';
import { antragPflegegradGenerator } from '@/src/lib/briefe/domains/pflegegrad/pflegegrad.generator';
import { schwerbehindertenausweisGenerator } from '@/src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.generator';
import { BriefPayload } from '@/src/types/briefe';

export class BriefGeneratorFactory {
  static getGenerator(type: BriefPayload['type']): IBriefGenerator {
    switch (type) {
      case 'antrag-pflegegrad':
      case 'widerspruch-pflegegrad':
        return antragPflegegradGenerator;
      case 'schwerbehindertenausweis':
        return schwerbehindertenausweisGenerator;
      case 'betreuungsrecht':
        return betreuungsrechtGenerator;
      case 'em-rente':
        return emRenteGenerator;
      case 'erbrecht':
        return erbrechtGenerator;
      case 'allgemein':
      case 'versorgungsamt':
      default:
        return allgemeinerBriefGenerator;
    }
  }
}
