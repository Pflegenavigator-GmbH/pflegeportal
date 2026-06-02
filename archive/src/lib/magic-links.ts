// src/lib/magic-link.ts
// MAGIC LINKS & QR-CODES - Permanenter Zugriff auf Fall-Daten
// Nutzer kann Link/QR speichern und jederzeit zurückkehren

import { toDataURL } from 'qrcode';

export interface MagicLinkData {
  caseCode: string;
  createdAt: string;
  expiresAt?: string; // Optional - null = permanent
}

// Basis-URL (wird aus Umgebung gelesen)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://pflegenavigatoreu.com';
};

/**
 * Erstellt einen Magic Link für direkten Fall-Zugriff
 * Format: https://pflegenavigatoreu.com/magic?case=PF-ABC123&token=xyz
 */
export function createMagicLink(caseCode: string, options?: {
  redirectTo?: string;
  expiresInDays?: number;
}): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  
  // CaseCode immer verschlüsselt/encoded
  params.set('case', encodeURIComponent(caseCode));
  
  // Optional: Wohin weiterleiten nach Login
  if (options?.redirectTo) {
    params.set('redirect', options.redirectTo);
  }
  
  // Optional: Ablaufdatum (für sensible Daten)
  if (options?.expiresInDays) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
    params.set('expires', expiresAt.toISOString());
  }
  
  // Einfacher Token zur Verifikation (nicht sicher, aber praktisch)
  // Für Produktion: richtige Signatur verwenden!
  const simpleToken = btoa(caseCode + '_' + Date.now()).slice(0, 16);
  params.set('token', simpleToken);
  
  return `${baseUrl}/magic?${params.toString()}`;
}

/**
 * Erstellt einen QR-Code als Data-URL
 * Kann direkt angezeigt oder ausgedruckt werden
 */
export async function createQRCode(
  caseCode: string, 
  options?: {
    size?: number;
    redirectTo?: string;
    label?: string;
  }
): Promise<{ qrDataUrl: string; magicLink: string }> {
  const magicLink = createMagicLink(caseCode, { redirectTo: options?.redirectTo });
  
  try {
    const qrDataUrl = await toDataURL(magicLink, {
      width: options?.size || 300,
      margin: 2,
      color: {
        dark: '#0f2744',  // PflegeNavigator Blau
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H' // Hohe Fehlerkorrektur (auch bei Beschädigung lesbar)
    });
    
    return { qrDataUrl, magicLink };
  } catch (error) {
    console.error('QR Code Fehler:', error);
    throw new Error('QR Code konnte nicht erstellt werden');
  }
}

/**
 * Erstellt einen "Wallet Pass" für Apple/Google Wallet
 * Nutzer kann Fallcode im Handy speichern
 */
export function createWalletPassData(caseCode: string): {
  title: string;
  description: string;
  barcode: { message: string; format: 'QR' };
} {
  return {
    title: 'PflegeNavigator EU',
    description: `Fall: ${caseCode}`,
    barcode: {
      message: createMagicLink(caseCode),
      format: 'QR'
    }
  };
}

/**
 * Parsen eines Magic Links
 * Extrahiert CaseCode und validiert Token
 */
export function parseMagicLink(url: string): {
  caseCode: string | null;
  redirectTo: string | null;
  isExpired: boolean;
  isValid: boolean;
} {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    const encodedCase = params.get('case');
    const expires = params.get('expires');
    const token = params.get('token');
    const redirectTo = params.get('redirect');
    
    if (!encodedCase || !token) {
      return { caseCode: null, redirectTo: null, isExpired: false, isValid: false };
    }
    
    const caseCode = decodeURIComponent(encodedCase);
    
    // Prüfe Ablaufdatum
    let isExpired = false;
    if (expires) {
      const expireDate = new Date(expires);
      isExpired = expireDate < new Date();
    }
    
    // Token-Validierung (einfach - nur ob vorhanden)
    const isValid = token.length >= 10;
    
    return {
      caseCode,
      redirectTo,
      isExpired,
      isValid
    };
  } catch (error) {
    return { caseCode: null, redirectTo: null, isExpired: false, isValid: false };
  }
}

/**
 * Erstellt eine "Notfall-Karte" zum Ausdrucken
 * Mit QR-Code und allen wichtigen Daten
 */
export function createEmergencyCardData(caseCode: string, data?: {
  name?: string;
  pflegegrad?: string;
  allergies?: string[];
  medications?: string[];
  emergencyContact?: { name: string; phone: string };
}): {
  title: string;
  caseCode: string;
  qrCodePromise: Promise<string>;
  info: typeof data;
} {
  return {
    title: 'PflegeNavigator - Notfallkarte',
    caseCode,
    qrCodePromise: createQRCode(caseCode, { size: 200, label: 'Zugriff auf Fall' }).then(r => r.qrDataUrl),
    info: data
  };
}

/**
 * Generiert einen "Einladungs-Link"
 * Für Angehörige/Pflegekräfte mit eingeschränktem Zugriff
 */
export function createGuestLink(
  caseCode: string, 
  permissions: ('view' | 'edit_diary' | 'view_results')[] = ['view_results']
): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  
  params.set('case', encodeURIComponent(caseCode));
  params.set('guest', 'true');
  params.set('perms', permissions.join(','));
  
  // Guest-Token (einfach)
  const guestToken = btoa(`guest_${caseCode}_${Date.now()}`).slice(0, 12);
  params.set('token', guestToken);
  
  return `${baseUrl}/guest?${params.toString()}`;
}
