// src/lib/escape.test.ts
import { describe, it, expect } from 'vitest';

import { escapeHtml, escapeHtmlWithBreaks } from './escape';

describe('escapeHtml', () => {
  it('escaped alle fünf HTML-Sonderzeichen', () => {
    expect(escapeHtml(`<script>&"'`)).toBe('&lt;script&gt;&amp;&quot;&#39;');
  });

  it('neutralisiert einen Markup-Injection-Versuch', () => {
    expect(escapeHtml('<img src=x onerror=fetch("//evil")>')).not.toContain('<img');
  });

  it('behandelt null/undefined/number robust', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('escapeHtmlWithBreaks', () => {
  it('escaped zuerst, wandelt dann Zeilenumbrüche in <br>', () => {
    expect(escapeHtmlWithBreaks('a<b\nc')).toBe('a&lt;b<br>c');
  });

  it('erzeugt keine <br> aus escaptem Markup', () => {
    // Ein wörtliches "<br>" im Input darf nicht als Tag durchkommen
    expect(escapeHtmlWithBreaks('<br>')).toBe('&lt;br&gt;');
  });
});
