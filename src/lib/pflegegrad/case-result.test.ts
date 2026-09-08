import { beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateAndPersistCaseResult, calculateCaseResult } from './case-result';

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
  const updateEqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });
  const client = {
    from: vi.fn((table: string) => (table === 'answers' ? answersBuilder : { update: updateMock })),
  };

  return { client, inMock, updateMock, updateEqMock };
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

  it('persistiert nur das unmittelbar zuvor serverseitig berechnete Ergebnis', async () => {
    const { client, updateMock, updateEqMock } = createSupabaseMock();

    const result = await calculateAndPersistCaseResult(
      client as unknown as Parameters<typeof calculateAndPersistCaseResult>[0],
      'case-1'
    );

    expect(updateMock).toHaveBeenCalledWith({
      care_level_guess: result.careLevel,
      total_score: result.totalScore,
      traffic_light: result.trafficLight,
      updated_at: expect.any(String),
    });
    expect(updateEqMock).toHaveBeenCalledWith('id', 'case-1');
  });
});
