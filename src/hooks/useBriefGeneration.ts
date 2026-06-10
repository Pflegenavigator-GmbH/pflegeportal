// src/hooks/useBriefGeneration.ts

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { BriefPayload } from '../types/briefe';

export function useBriefGeneration() {
  const [loading, setLoading] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // 1. Text-Vorschau generieren (API)
  const generatePreview = useCallback(async (payload: BriefPayload) => {
    setLoading(true);
    const toastId = toast.loading('Text-Entwurf wird strukturiert...');
    try {
      const res = await fetch('/api/briefe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Fehler bei der Text-Generierung.');
      const data = await res.json();
      setPreviewText(data.brief);
      toast.success('Vorschau erfolgreich erstellt.', { id: toastId });
    } catch (err) {
      toast.error('Konnte Entwurf nicht laden.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Echtes DIN-5008-PDF via Puppeteer streamen
  const downloadPdf = useCallback(async (payload: BriefPayload) => {
    setLoading(true);
    const toastId = toast.loading('Hochauflösendes PDF wird gerendert...');
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

      toast.success('Download erfolgreich gestartet!', { id: toastId });
    } catch (err) {
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
