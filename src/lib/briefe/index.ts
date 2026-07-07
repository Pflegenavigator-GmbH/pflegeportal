// src/lib/briefe/index.ts

// 1. Export der vererbbaren Basis-Architektur
export * from './base.generator';
export * from './generator-factory';

// 2. Export der einzelnen Domain-Slices (DDD)
export { allgemeinerBriefGenerator } from './domains/allgemein/allgemein.generator';
export { antragPflegegradGenerator } from './domains/pflegegrad/pflegegrad.generator';
export { schwerbehindertenausweisGenerator } from './domains/schwerbehinderung/schwerbehinderung.generator';
export { betreuungsrechtGenerator } from './domains/betreuungsrecht/betreuungsrecht.generator';
export { emRenteGenerator } from './domains/em-rente/em-rente.generator';
export { erbrechtGenerator } from './domains/erbrecht/erbrecht.generator';

// 3. Re-Export des globalen Typsystems zur Vermeidung von Import-Pfad-Fehlern
export type { BriefPayload, BriefType, BriefAdresse, BriefInhalt } from '@/src/types/briefe';
