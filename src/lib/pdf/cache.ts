import { logger } from '@/src/lib/logger';
import { CacheEntry } from '@/src/types/cache'; // Falls du es auslagerst

/**
 * Der Schlüssel ist der Fallcode. Er bleibt Schlüssel im Arbeitsspeicher,
 * erscheint aber in keinem Log (Issue #145).
 */
class PdfRamCache {
  private cache = new Map<string, CacheEntry>();
  private TTL = 10 * 60 * 1000;

  get(caseCode: string): Uint8Array | null {
    const key = caseCode.toUpperCase();
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug('Cache-Miss: Kein Eintrag gefunden');
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      logger.info('Cache-Miss: Eintrag abgelaufen (TTL überschritten)');
      this.cache.delete(key);
      return null;
    }

    logger.debug('Cache-Hit: PDF aus RAM geladen');
    return entry.buffer;
  }

  set(caseCode: string, buffer: Uint8Array): void {
    const key = caseCode.toUpperCase();
    this.cache.set(key, {
      buffer,
      expiresAt: Date.now() + this.TTL,
    });
    logger.debug({ size: buffer.length }, 'Cache-Set: PDF in RAM gespeichert');
  }

  clear(caseCode: string): void {
    const key = caseCode.toUpperCase();
    this.cache.delete(key);
    logger.info('Cache-Clear: Eintrag manuell gelöscht');
  }
}

export const pdfRamCache = new PdfRamCache();
