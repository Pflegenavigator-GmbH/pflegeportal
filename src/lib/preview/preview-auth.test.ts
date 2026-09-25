// src/lib/preview/preview-auth.test.ts
// @vitest-environment node

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    createPreviewToken,
    PREVIEW_COOKIE_NAME,
    PREVIEW_SESSION_MAX_AGE,
    verifyPreviewToken,
} from './preview-auth';

const SECRET =
    'test-preview-secret-with-sufficient-length-123456789';

const OTHER_SECRET =
    'another-preview-secret-with-sufficient-length-987654321';

const START_TIME = new Date('2026-09-22T08:00:00.000Z');

describe('Preview-Authentifizierung', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(START_TIME);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('verwendet den erwarteten Cookie-Namen', () => {
        expect(PREVIEW_COOKIE_NAME).toBe('preview-access');
    });

    it('setzt die Session-Dauer auf 45 Minuten', () => {
        expect(PREVIEW_SESSION_MAX_AGE).toBe(45 * 60);
    });

    it('erstellt einen Token, der mit demselben Secret gültig ist', async () => {
        const token = await createPreviewToken(SECRET);

        await expect(
            verifyPreviewToken(token, SECRET)
        ).resolves.toBe(true);
    });

    it('erzeugt einen Token aus Payload und Signatur', async () => {
        const token = await createPreviewToken(SECRET);

        const parts = token.split('.');

        expect(parts).toHaveLength(2);
        expect(parts[0]).toBeTruthy();
        expect(parts[1]).toBeTruthy();
    });

    it('akzeptiert den Token unmittelbar vor Ablauf der 45 Minuten', async () => {
        const token = await createPreviewToken(SECRET);

        vi.setSystemTime(
            new Date(
                START_TIME.getTime() +
                PREVIEW_SESSION_MAX_AGE * 1000 -
                1000
            )
        );

        await expect(
            verifyPreviewToken(token, SECRET)
        ).resolves.toBe(true);
    });

    it('lehnt den Token nach exakt 45 Minuten ab', async () => {
        const token = await createPreviewToken(SECRET);

        vi.setSystemTime(
            new Date(
                START_TIME.getTime() +
                PREVIEW_SESSION_MAX_AGE * 1000
            )
        );

        await expect(
            verifyPreviewToken(token, SECRET)
        ).resolves.toBe(false);
    });

    it('lehnt den Token nach mehr als 45 Minuten ab', async () => {
        const token = await createPreviewToken(SECRET);

        vi.setSystemTime(
            new Date(
                START_TIME.getTime() +
                PREVIEW_SESSION_MAX_AGE * 1000 +
                60_000
            )
        );

        await expect(
            verifyPreviewToken(token, SECRET)
        ).resolves.toBe(false);
    });

    it('lehnt einen Token mit falschem Secret ab', async () => {
        const token = await createPreviewToken(SECRET);

        await expect(
            verifyPreviewToken(token, OTHER_SECRET)
        ).resolves.toBe(false);
    });

    it('lehnt einen manipulierten Payload ab', async () => {
        const token = await createPreviewToken(SECRET);

        const [payload, signature] = token.split('.');

        const manipulatedPayload =
            payload.slice(0, -1) +
            (payload.endsWith('A') ? 'B' : 'A');

        const manipulatedToken =
            `${manipulatedPayload}.${signature}`;

        await expect(
            verifyPreviewToken(manipulatedToken, SECRET)
        ).resolves.toBe(false);
    });

    it('lehnt eine manipulierte Signatur ab', async () => {
        const token = await createPreviewToken(SECRET);

        const [payload, signature] = token.split('.');

        const manipulatedSignature =
            signature.slice(0, -1) +
            (signature.endsWith('A') ? 'B' : 'A');

        const manipulatedToken =
            `${payload}.${manipulatedSignature}`;

        await expect(
            verifyPreviewToken(manipulatedToken, SECRET)
        ).resolves.toBe(false);
    });

    it('lehnt einen Token ohne Signatur ab', async () => {
        await expect(
            verifyPreviewToken('nur-ein-payload', SECRET)
        ).resolves.toBe(false);
    });

    it('lehnt einen Token mit zu vielen Bestandteilen ab', async () => {
        await expect(
            verifyPreviewToken(
                'payload.signature.zusaetzlicher-teil',
                SECRET
            )
        ).resolves.toBe(false);
    });

    it('lehnt einen leeren Token ab', async () => {
        await expect(
            verifyPreviewToken('', SECRET)
        ).resolves.toBe(false);
    });

    it('lehnt syntaktisch ungültiges Base64URL ab', async () => {
        await expect(
            verifyPreviewToken('%%%.$$$', SECRET)
        ).resolves.toBe(false);
    });

    it('wirft bei ungültigen Tokens keinen Fehler nach außen', async () => {
        const invalidTokens = [
            '',
            '.',
            '..',
            'foo',
            'foo.',
            '.bar',
            'foo.bar.baz',
            '%%%.$$$',
        ];

        for (const token of invalidTokens) {
            await expect(
                verifyPreviewToken(token, SECRET)
            ).resolves.toBe(false);
        }
    });
});
