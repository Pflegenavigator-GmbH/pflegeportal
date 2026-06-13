// src/types/briefe.ts
import { BriefPayload as GeneratedBriefPayload } from './briefe-schema';

export type BriefPayload = GeneratedBriefPayload;
export type BriefAdresse = BriefPayload['absender'];
export type BriefInhalt = BriefPayload['inhalt'];
export type BriefType = BriefPayload['type'];
