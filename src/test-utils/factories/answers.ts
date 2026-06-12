import { v4 as uuidv4 } from 'uuid';

export interface Answers {
    id: string;
    case_id: string;
    module_number: number;
    module_name: string;
    answers: Record<string, unknown>;
    completed_at: string;
}

export const createMockAnswer = (caseId: string, moduleNumber: number, overrides: Partial<Answers> = {}): Answers => ({
    id: uuidv4(),
    case_id: caseId,
    module_number: moduleNumber,
    module_name: `Modul ${moduleNumber}`,
    answers: { q1: 'ja' },
    completed_at: new Date().toISOString(),
    ...overrides,
});