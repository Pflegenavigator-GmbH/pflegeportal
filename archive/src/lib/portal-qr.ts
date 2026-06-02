// src/lib/portal-qr.ts
// MAGIC LINKS & QR-CODES - PflegeNavigator EU Portal
// Direkter Zugriff via QR-Code oder Link ins Portal

import { toDataURL } from 'qrcode';

export interface MagicLinkData {
  caseCode: string;
  createdAt: string;
  expiresAt?: string;
}

// Portal URL
const getPortalUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://pflegenavigatoreu.com';
};

/**
 * Erstellt QR-Code + Link für direkten Zugang zum PflegeNavigator EU Portal
 * Scan = Direkt im Portal auf der richtigen Seite
 */
export async function createPortalQRCode(
  caseCode: string,
  options?: {
    size?: number;
    page?: 'start' | 'ergebnis' | 'tagebuch';
  }
): Promise<{ qrDataUrl: string; link: string }> {
  // Direkter Link ins Portal (NICHT /magic, sondern direkt /pflegegrad/start)
  const portalUrl = `${getPortalUrl()}/pflegegrad/${options?.page || 'start'}?case=${encodeURIComponent(caseCode)}`;
  
  // QR-Code generieren
  const qrDataUrl = await toDataURL(portalUrl, {
    width: options?.size || 300,
    margin: 2,
    color: {
      dark: '#0f2744',  // PflegeNavigator Blau
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  
  return { qrDataUrl, link: portalUrl };
}

/**
 * Erstellt "Always-On" QR-Code für dauerhaften Zugriff
 * Zum Ausdrucken, Laminierten, im Portemonnaie
 */
export async function createPermanentQR(caseCode: string): Promise<{
  qrDataUrl: string;
  link: string;
  instructions: string[];
}> {
  const { qrDataUrl, link } = await createPortalQRCode(caseCode, { size: 400 });
  
  return {
    qrDataUrl,
    link,
    instructions: [
      '1. QR-Code mit Handy-Kamera scannen',
      '2. Direkt ins PflegeNavigator EU Portal',
      '3. Fall automatisch geladen',
      '4. Kein Passwort nötig!'
    ]
  };
}

/**
 * Erstellt Mini-QR für Schlüsselanhänger (klein aber lesbar)
 */
export async function createMiniQR(caseCode: string): Promise<{
  qrDataUrl: string;
  link: string;
}> {
  const link = `${getPortalUrl()}/pflegegrad/start?case=${encodeURIComponent(caseCode)}`;
  
  const qrDataUrl = await toDataURL(link, {
    width: 150,  // Klein für Schlüsselanhänger
    margin: 1,
    errorCorrectionLevel: 'H'  // Trotzdem gut lesbar
  });
  
  return { qrDataUrl, link };
}

/**
 * Druck-Vorlage für QR-Code
 * A4-Format zum Ausdrucken und Aufhängen
 */
export function createPrintTemplate(caseCode: string, qrDataUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
      <h1 style="color: #0f2744;">🏥 PflegeNavigator EU</h1>
      <h2 style="color: #20b2aa;">Ihr persönlicher Zugang</h2>
      
      <div style="margin: 30px 0;">
        <img src="${qrDataUrl}" alt="QR-Code" style="width: 300px; height: 300px;" />
      </div>
      
      <p style="font-size: 14px; color: #666;">
        <strong>Fallcode: ${caseCode}</strong><br/><br/>
        Scannen Sie diesen Code mit Ihrem Handy,<br/>
        um direkt ins Portal zu gelangen.
      </p>
      
      <div style="margin-top: 30px; padding: 20px; background: #f0f9f9; border-radius: 10px;">
        <p style="font-size: 12px; color: #0f2744;">
          ℹ️ Dieser QR-Code funktioniert immer – speichern oder ausdrucken!
        </p>
      </div>
    </div>
  `;
}

/**
 * Wallet Card Format (für Apple/Google Wallet)
 */
export function createWalletCard(caseCode: string, qrDataUrl: string) {
  return {
    title: 'PflegeNavigator EU',
    header: '🏥 Ihr Fall',
    fields: [
      { label: 'Fallcode', value: caseCode },
      { label: 'Zugang', value: 'QR-Code scannen' }
    ],
    barcode: {
      format: 'QR',
      message: `${getPortalUrl()}/pflegegrad/start?case=${encodeURIComponent(caseCode)}`,
      altText: caseCode
    },
    backgroundColor: '#0f2744',
    foregroundColor: '#ffffff'
  };
}
