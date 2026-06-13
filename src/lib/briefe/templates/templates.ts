// src/lib/briefe/templates.ts
import { generateAllgemeinBriefTemplate } from '@/src/lib/briefe/templates/allgemeinesTemplates';
import { generateSchwerbehindertenBriefTemplate } from '@/src/lib/briefe/templates/templatesSchwerbehinderten';

export const TEMPLATE_MAP = {
  schwerbehindertenausweis: generateSchwerbehindertenBriefTemplate,
  allgemein: generateAllgemeinBriefTemplate,
  // ...
};
