// src/lib/briefe/index.ts
export { allgemeinerBriefGenerator } from './allgemein';
export { antragPflegegradGenerator } from './antrag-pflegegrad';
export { schwerbehindertenausweisGenerator } from './schwerbehindertenausweis';

// Re-Export des globalen Typsystems zur Vermeidung von Import-Pfad-Fehlern
export type { BriefPayload, BriefType, BriefAdresse, BriefInhalt } from '@/src/types/briefe';
