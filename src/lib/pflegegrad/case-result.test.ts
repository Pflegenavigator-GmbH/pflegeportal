import { beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateCaseResult, loadAdultAssessmentState } from './case-result';

vi.mock('server-only', () => ({}));

const rows = [
  { module_number: 1, answers: { m1_1: 'selbststaendig' } },
  { module_number: 4, answers: { m4_1: 'ueberwiegend_unselbststaendig' } },
];

function createSupabaseMock() {
  const inMock = vi.fn().mockResolvedValue({ data: rows, error: null });
  const answersBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: inMock,
  };
  const client = {
    from: vi.fn(() => answersBuilder),
  };

  return { client, inMock };
}

describe('serverseitiges Fall-Ergebnis', () => {
  beforeEach(() => vi.clearAllMocks());

  it('berechnet ausschließlich aus den Erwachsenenmodulen 1–6', async () => {
    const { client, inMock } = createSupabaseMock();

    const result = await calculateCaseResult(
      client as unknown as Parameters<typeof calculateCaseResult>[0],
      'case-1'
    );

    expect(inMock).toHaveBeenCalledWith('module_number', [1, 2, 3, 4, 5, 6]);
    expect(result).toEqual(
      expect.objectContaining({
        careLevel: expect.any(Number),
        totalScore: expect.any(Number),
        trafficLight: expect.stringMatching(/^(gruen|gelb|rot)$/),
      })
    );
  });

  it('liefert Fortschritt und Ergebnis aus demselben Antwort-Snapshot', async () => {
    const { client } = createSupabaseMock();

    const state = await loadAdultAssessmentState(
      client as unknown as Parameters<typeof loadAdultAssessmentState>[0],
      'case-1'
    );

    expect(state.completedModules).toEqual([]);
    expect(state.missingModules).toEqual([1, 2, 3, 4, 5, 6]);
    expect(state.nextModule).toBe(1);
    expect(state.hasResult).toBe(false);
    expect(state.result.missingData).toBe(true);
  });
});
