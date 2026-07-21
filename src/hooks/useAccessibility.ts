// src/hooks/useAccessibility.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

import { A11yPrefs, applyA11yPrefs, readA11yPrefs, saveA11yPrefs } from '@/src/lib/a11y';

/**
 * Liest/schreibt die Barrierefreiheits-Einstellungen und wendet sie auf <html>
 * an. Das No-FOUC-Init-Script hat die Attribute beim Laden bereits gesetzt;
 * dieser Hook synchronisiert den React-State und persistiert Änderungen.
 */
export function useAccessibility() {
  const [prefs, setPrefs] = useState<A11yPrefs>(readA11yPrefs);

  // Nach dem Mount einmal aus dem Storage synchronisieren (Hydration-sicher)
  useEffect(() => {
    const stored = readA11yPrefs();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(stored);
    applyA11yPrefs(stored);
  }, []);

  const update = useCallback((partial: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      applyA11yPrefs(next);
      saveA11yPrefs(next);
      return next;
    });
  }, []);

  return { prefs, update };
}
