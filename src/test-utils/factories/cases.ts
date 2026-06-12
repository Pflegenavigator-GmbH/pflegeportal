// src/tests/factories/cases.ts
import { v4 as uuidv4 } from 'uuid';
// Importiere hier das Interface aus deiner Datenbank-Typdefinition (z.B. aus lib/db/types.ts)
// Wenn du keine separate Typ-Datei hast, kannst du es hier definieren:
export interface Case {
    id: string;
    case_code: string;
    status: 'draft' | 'completed' | 'archived';
    billing_status: 'pending' | 'paid' | 'free' | 'failed';
    product_tier: 'beta' | 'standard' | 'profi';
    versicherungs_typ: 'gesetzlich' | 'privat';
    created_at: string;
}

export const createMockCase = (overrides: Partial<Case> = {}): Case => ({
    id: uuidv4(),
    case_code: `PF-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'draft',
    billing_status: 'pending',
    product_tier: 'beta',
    versicherungs_typ: 'gesetzlich',
    created_at: new Date().toISOString(),
    ...overrides,
});