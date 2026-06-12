// src/type/cache.ts

export interface CacheEntry {
    buffer: Uint8Array;
    expiresAt: number;
}