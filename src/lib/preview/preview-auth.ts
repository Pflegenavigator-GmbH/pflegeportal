// src/lib/preview/preview-auth.ts

const PREVIEW_SESSION_DURATION_SECONDS = 45 * 60;

type PreviewTokenPayload = {
    exp: number;
};

/**
 * Wandelt Bytes in URL-sicheres Base64 ohne Padding um.
 */
function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = '';

    for (const byte of bytes) {
        binary += String.fromCodePoint(byte);
    }

    return btoa(binary)
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
}

/**
 * Wandelt URL-sicheres Base64 zurück in einen ArrayBuffer.
 *
 * Wir geben bewusst einen echten ArrayBuffer zurück und nicht Uint8Array,
 * damit Web Crypto einen eindeutigen BufferSource<ArrayBuffer> erhält.
 */
function base64UrlToArrayBuffer(value: string): ArrayBuffer {
    const base64 = value
        .replaceAll('-', '+')
        .replaceAll('_', '/');

    const padded = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
    );

    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.codePointAt(index) ?? 0;
    }

    return buffer;
}

function encodePayload(payload: PreviewTokenPayload): string {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);

    return bytesToBase64Url(bytes);
}

function decodePayload(
    value: string
): PreviewTokenPayload | null {
    try {
        const buffer = base64UrlToArrayBuffer(value);
        const json = new TextDecoder().decode(buffer);
        const payload = JSON.parse(json) as unknown;

        if (
            typeof payload !== 'object' ||
            payload === null ||
            !('exp' in payload) ||
            typeof payload.exp !== 'number'
        ) {
            return null;
        }

        return {
            exp: payload.exp,
        };
    } catch {
        return null;
    }
}

async function getSigningKey(
    secret: string
): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        {
            name: 'HMAC',
            hash: 'SHA-256',
        },
        false,
        ['sign', 'verify']
    );
}

/**
 * Erstellt einen HMAC-SHA-256-signierten Preview-Token.
 *
 * Format:
 *
 *   <payload>.<signature>
 *
 * Der Payload enthält den Ablaufzeitpunkt der Session.
 */
export async function createPreviewToken(
    secret: string
): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const payload: PreviewTokenPayload = {
        exp: now + PREVIEW_SESSION_DURATION_SECONDS,
    };

    const encodedPayload = encodePayload(payload);
    const key = await getSigningKey(secret);

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(encodedPayload)
    );

    return `${encodedPayload}.${bytesToBase64Url(
        new Uint8Array(signature)
    )}`;
}

/**
 * Prüft:
 *
 * 1. Hat der Token das erwartete Format?
 * 2. Ist die HMAC-Signatur korrekt?
 * 3. Enthält er einen gültigen Ablaufzeitpunkt?
 * 4. Ist die Session noch nicht abgelaufen?
 */
export async function verifyPreviewToken(
    token: string,
    secret: string
): Promise<boolean> {
    try {
        const parts = token.split('.');

        if (parts.length !== 2) {
            return false;
        }

        const [encodedPayload, encodedSignature] = parts;

        if (!encodedPayload || !encodedSignature) {
            return false;
        }

        const payload = decodePayload(encodedPayload);

        if (!payload) {
            return false;
        }

        const key = await getSigningKey(secret);

        const signature = base64UrlToArrayBuffer(
            encodedSignature
        );

        const signatureIsValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            new TextEncoder().encode(encodedPayload)
        );

        if (!signatureIsValid) {
            return false;
        }

        const now = Math.floor(Date.now() / 1000);

        return payload.exp > now;
    } catch {
        return false;
    }
}

export const PREVIEW_COOKIE_NAME = 'preview-access';

export const PREVIEW_SESSION_MAX_AGE =
    PREVIEW_SESSION_DURATION_SECONDS;