// src/hooks/usePdfDownload.tsx
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { logger } from '@/src/lib/logger';

interface DownloadOptions {
  caseCode: string | null;
  elementId: string;
  documentTitle?: string;
  footerText?: string;
  fallbackHtml?: string;
}

interface UsePdfDownloadReturn {
  downloadPdf: () => Promise<void>;
  loadingPdf: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
}

export function usePdfDownload({
  caseCode,
  elementId,
  documentTitle,
  footerText,
  fallbackHtml,
}: DownloadOptions): UsePdfDownloadReturn {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const downloadPdf = useCallback(async () => {
    if (!caseCode) {
      logger.warn('PDF-Download ohne Fallcode abgebrochen');
      toast.error('Kein gültiger Fallcode vorhanden.');
      return;
    }

    setLoadingPdf(true);
    const toastId = toast.loading('PDF-Dossier wird verschlüsselt generiert...');
    logger.info({ caseCode, elementId }, 'Starte PDF-Generierungsprozess');

    try {
      const element = document.getElementById(elementId);
      const htmlContent = element?.innerHTML || fallbackHtml || '';

      if (!element) {
        logger.warn({ elementId }, 'HTML-Element für PDF nicht im DOM gefunden');
      }

      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          caseCode: caseCode.toUpperCase(),
          html: htmlContent,
          title: documentTitle || `Dokument_${caseCode.toUpperCase()}`,
          footerText: footerText || 'PflegeNavigator EU gUG',
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          logger.info({ caseCode }, 'PDF-Generierung: Paywall-Schranke erreicht');
          toast.dismiss(toastId);
          setShowPaywall(true);
          return;
        }
        logger.error({ status: response.status }, 'Fehler bei der PDF-API-Anfrage');
        throw new Error('API-Fehler');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle || 'Dokument'}_${caseCode.toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      logger.info({ caseCode }, 'PDF erfolgreich generiert und Download eingeleitet');
      toast.success('Download erfolgreich gestartet!', { id: toastId });
    } catch (error) {
      logger.error({ error, caseCode }, 'Kritischer Fehler bei der PDF-Erstellung');
      toast.error('Fehler bei der PDF-Erstellung.', { id: toastId });
    } finally {
      setLoadingPdf(false);
    }
  }, [caseCode, elementId, documentTitle, footerText, fallbackHtml]);

  return { downloadPdf, loadingPdf, showPaywall, setShowPaywall };
}
