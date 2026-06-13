// src/test-utils/factories/payments.ts
import { v4 as uuidv4 } from 'uuid';

export interface Payment {
  id: string;
  case_id: string;
  stripe_session_id: string | null;
  paket: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly';
  betrag: number;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
}

export const createMockPayment = (caseId: string, overrides: Partial<Payment> = {}): Payment => ({
  id: uuidv4(),
  case_id: caseId,
  stripe_session_id: `cs_test_${uuidv4()}`,
  paket: 'standard_monthly',
  betrag: 29.99,
  status: 'pending',
  created_at: new Date().toISOString(),
  ...overrides,
});
