// src/hooks/useBriefGeneration.ts

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { logger } from '@/src/lib/logger';

import { BriefPayload } from '../types/briefe';

export function useBriefGeneration() {
  const [loading, setLoading] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // 1. Text-Vorschau generieren (API)
  const generatePreview = useCallback(async (payload: BriefPayload) => {
    setLoading(true);
    const toastId = toast.loading('Text-Entwurf wird strukturiert...');
    logger.info({ type: payload.type }, 'Starte Text-Vorschau-Generierung');

    try {
      const res = await fetch('/api/briefe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Fehler bei der Text-Generierung: ${res.status}`);

      const data = await res.json();
      setPreviewText(data.brief);
      logger.debug('Vorschau erfolgreich vom Server geladen');
      toast.success('Vorschau erfolgreich erstellt.', { id: toastId });
    } catch (err) {
      logger.error({ err }, 'Fehler bei generatePreview');
      toast.error('Konnte Entwurf nicht laden.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Echtes DIN-5008-PDF via Puppeteer streamen
  const downloadPdf = useCallback(async (payload: BriefPayload) => {
    setLoading(true);
    const toastId = toast.loading('Hochauflösendes PDF wird gerendert...');
    logger.info({ type: payload.type }, 'Starte PDF-Download-Prozess');

    try {
      const res = await fetch('/api/briefe/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('PDF-Konvertierung fehlgeschlagen.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${payload.type}_Anschreiben.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      logger.debug('PDF-Download-Link wurde erfolgreich angeklickt');
      toast.success('Download erfolgreich gestartet!', { id: toastId });
    } catch (err) {
      logger.error({ err }, 'Fehler beim PDF-Export');
      toast.error('Fehler beim PDF-Export.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    previewText,
    setPreviewText,
    generatePreview,
    downloadPdf,
  };
}
