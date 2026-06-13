// src/lib/pdf/cache.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createMockCase } from '@/src/test-utils/factories/cases';

import { pdfRamCache } from './cache';

describe('PdfRamCache', () => {
  // Generiere einen Case aus unserer neuen Factory
  const mockCase = createMockCase();
  const caseCode = mockCase.case_code;

  beforeEach(() => {
    pdfRamCache.clear(caseCode);
    vi.useFakeTimers();
  });

  it('sollte einen realen PDF-Buffer für einen Case speichern', () => {
    // Wir simulieren ein echtes PDF-Byte-Array (Header-Signatur)
    const pdfData = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    pdfRamCache.set(caseCode, pdfData);

    expect(pdfRamCache.get(caseCode)).toEqual(pdfData);
  });

  it('sollte null zurückgeben, wenn der Eintrag abgelaufen ist', () => {
    const pdfData = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    pdfRamCache.set(caseCode, pdfData);

    // Zeitreise: 10 Minuten + 1 Millisekunde
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);

    expect(pdfRamCache.get(caseCode)).toBeNull();
  });

  it('sollte case-insensitive arbeiten', () => {
    const pdfData = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    pdfRamCache.set(caseCode.toLowerCase(), pdfData);

    // Abruf mit Uppercase
    expect(pdfRamCache.get(caseCode.toUpperCase())).toEqual(pdfData);
  });

  it('sollte clear() den Eintrag für einen spezifischen Case entfernen', () => {
    pdfRamCache.set(caseCode, new Uint8Array([1]));
    pdfRamCache.clear(caseCode);

    expect(pdfRamCache.get(caseCode)).toBeNull();
  });
});
