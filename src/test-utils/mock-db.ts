import { createMockAnswer, Answers } from '@/src/test-utils/factories/answers';
import { createMockCase, Case } from '@/src/test-utils/factories/cases';
import { createMockPayment, Payment } from '@/src/test-utils/factories/payments';

interface MockDbContext {
  case: Case;
  answers: Answers[];
  payment?: Payment;
}

/**
 * Szenario: Ein Nutzer hat den Prozess komplett durchlaufen und bezahlt.
 */
export const createPaidSessionContext = (): MockDbContext => {
  const c = createMockCase({
    billing_status: 'paid',
    product_tier: 'profi',
    status: 'completed',
  });

  const p = createMockPayment(c.id, {
    paket: 'profi_monthly',
    status: 'succeeded',
  });

  return {
    case: c,
    answers: [createMockAnswer(c.id, 1), createMockAnswer(c.id, 2)],
    payment: p,
  };
};

/**
 * Szenario: Ein Nutzer ist gerade erst gestartet.
 */
export const createDraftContext = (): MockDbContext => ({
  case: createMockCase({ status: 'draft' }),
  answers: [],
});
