/**
 * Formatierungs-Hilfsfunktionen fuer das PflegeNavigator Portal
 */

/**
 * Formatiert einen Betrag als Euro-String
 */
export function formatCurrency(betrag: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(betrag);
}

/**
 * Formatiert eine Zahl mit deutschem Tausendertrennzeichen
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(num);
}

/**
 * Formatiert ein Datum im deutschen Format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

/**
 * Formatiert ein Datum mit Uhrzeit
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

/**
 * Kuerzt einen Text auf eine maximale Laenge
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Konvertiert einen String zu einem URL-freundlichen Slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Prueft, ob ein Wert eine gueltige E-Mail-Adresse ist
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Prueft, ob ein Wert eine gueltige PLZ ist
 */
export function isValidPLZ(plz: string): boolean {
  return /^\d{5}$/.test(plz);
}

/**
 * Generiert einen zufaelligen Token
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Wandelt ein Objekt in URL-Parameter um
 */
export function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const validParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  
  return validParams.length > 0 ? `?${validParams.join('&')}` : '';
}

/**
 * Entfernt HTML-Tags aus einem String
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^\u003e]*>/g, '');
}

/**
 * Wartet eine angegebene Zeit (fuer Delays)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce-Funktion fuer Eingabefelder
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle-Funktion fuer Events
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
