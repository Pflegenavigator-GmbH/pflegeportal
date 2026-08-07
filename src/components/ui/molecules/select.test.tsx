// src/components/ui/molecules/select.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';

/**
 * Der Auslöser muss die Beschriftung zeigen, nicht den technischen Wert.
 *
 * Der Fehler war lange unsichtbar, weil `value` und Beschriftung in einfachen
 * Fällen ähnlich aussehen. Auf der Widerspruch-Seite stand deshalb
 * „pflegegrad" statt „Pflegegrad-Bescheid (§ 84 Abs. 1 SGG)" — in jeder
 * Sprache gleichermaßen, es war also kein Übersetzungsproblem.
 */
const rendere = (props: { value?: string; onValueChange?: (v: string) => void } = {}) =>
  render(
    <Select {...props}>
      <SelectTrigger>
        <SelectValue placeholder="Bitte wählen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pflegegrad">Pflegegrad-Bescheid (§ 84 Abs. 1 SGG)</SelectItem>
        <SelectItem value="klage">Klage beim Sozialgericht</SelectItem>
      </SelectContent>
    </Select>
  );

describe('SelectValue', () => {
  it('zeigt die Beschriftung des gewählten Eintrags, nicht dessen Wert', () => {
    rendere({ value: 'pflegegrad' });

    expect(screen.getByText('Pflegegrad-Bescheid (§ 84 Abs. 1 SGG)')).toBeInTheDocument();
    expect(screen.queryByText('pflegegrad')).not.toBeInTheDocument();
  });

  it('findet die Beschriftung, obwohl das Menü geschlossen und damit nicht gemountet ist', () => {
    rendere({ value: 'klage' });

    // Genau ein Vorkommen: der Auslöser. Wäre das Menü offen, gäbe es zwei.
    expect(screen.getAllByText('Klage beim Sozialgericht')).toHaveLength(1);
  });

  it('zeigt den Platzhalter, solange nichts gewählt ist', () => {
    rendere();

    expect(screen.getByText('Bitte wählen')).toBeInTheDocument();
  });

  it('wechselt die Beschriftung mit der Auswahl', () => {
    const onValueChange = vi.fn();
    rendere({ value: 'pflegegrad', onValueChange });

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Klage beim Sozialgericht'));

    expect(onValueChange).toHaveBeenCalledWith('klage');
  });
});
