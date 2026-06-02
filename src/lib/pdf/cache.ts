interface CacheEntry {
    buffer: Uint8Array;
    expiresAt: number;
}

class PdfRamCache {
    // Streng typisierter In-Memory-Speicher
    private cache = new Map<string, CacheEntry>();
    // Cache-Gültigkeit: 10 Minuten reichen vollkommen für Mehrfach-Downloads
    private TTL = 10 * 60 * 1000;

    get(caseCode: string): Uint8Array | null {
        const entry = this.cache.get(caseCode.toUpperCase());
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(caseCode.toUpperCase());
            return null;
        }
        return entry.buffer;
    }

    set(caseCode: string, buffer: Uint8Array): void {
        this.cache.set(caseCode.toUpperCase(), {
            buffer,
            expiresAt: Date.now() + this.TTL
        });
    }

    clear(caseCode: string): void {
        this.cache.delete(caseCode.toUpperCase());
    }
}

// Export als globaler Singleton
export const pdfRamCache = new PdfRamCache();