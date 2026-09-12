// src/lib/log-schwaerzung.test.ts
import { describe, expect, it } from 'vitest';

import { FALLCODE_ERSATZ, schwaerzeFallcodes, schwaerzeFallcodesInJson } from './log-schwaerzung';

describe('schwaerzeFallcodes', () => {
  it('schwärzt einen Fallcode im Fließtext', () => {
    expect(schwaerzeFallcodes('Fall nicht gefunden: PF-AB12-CD34')).toBe(
      `Fall nicht gefunden: ${FALLCODE_ERSATZ}`
    );
  });

  it('schwärzt unabhängig von der Schreibweise', () => {
    expect(schwaerzeFallcodes('pf-ab12-cd34')).toBe(FALLCODE_ERSATZ);
  });

  it('schwärzt mehrere Codes und Codes in Adressen', () => {
    expect(schwaerzeFallcodes('/api/cases/PF-AAAA-BBBB/answers?check_code=PF-CCCC-DDDD')).toBe(
      `/api/cases/${FALLCODE_ERSATZ}/answers?check_code=${FALLCODE_ERSATZ}`
    );
  });

  it('lässt Text ohne Fallcode unverändert', () => {
    expect(schwaerzeFallcodes('VALIDATION_ERROR bei Modul 3')).toBe('VALIDATION_ERROR bei Modul 3');
  });

  it('schwärzt eine fertige JSON-Protokollzeile, ohne sie ungültig zu machen', () => {
    const zeile = JSON.stringify({
      msg: 'x',
      caseCode: 'PF-AB12-CD34',
      err: { message: 'PF-AB12-CD34' },
    });
    const geschwaerzt = schwaerzeFallcodes(zeile);

    expect(geschwaerzt).not.toMatch(/PF-AB12-CD34/);
    expect(JSON.parse(geschwaerzt).err.message).toBe(FALLCODE_ERSATZ);
  });
});

describe('schwaerzeFallcodesInJson', () => {
  it('schwärzt verschachtelte Werte in beliebiger Tiefe', () => {
    const ergebnis = schwaerzeFallcodesInJson({
      context: { expectedCode: 'PF-AB12-CD34', liste: ['PF-EEEE-FFFF', 3] },
      code: 'NOT_FOUND',
    });

    expect(ergebnis).toEqual({
      context: { expectedCode: FALLCODE_ERSATZ, liste: [FALLCODE_ERSATZ, 3] },
      code: 'NOT_FOUND',
    });
  });

  it('reicht undefined unverändert durch', () => {
    expect(schwaerzeFallcodesInJson(undefined)).toBeUndefined();
  });
});
