// src/lib/logger.ts
import pino from 'pino';

import { schwaerzeFallcodes } from '@/src/lib/log-schwaerzung';

const environment = process.env.ENVIRONMENT || 'production';

const currentLogLevel = environment === 'development' ? 'debug' : 'info';

/**
 * Exportiert, damit Tests die Schwärzung am echten Ausgabeweg prüfen können —
 * mit eigenem Zielstrom statt stdout.
 */
export const loggerOptionen: pino.LoggerOptions = {
  level: currentLogLevel,

  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'accessToken',
      '*.accessToken',
      'refreshToken',
      '*.refreshToken',
      'secret',
      '*.secret',
      'apiKey',
      '*.apiKey',
      'authorization',
      'headers.authorization',
      'req.headers.authorization',
      'cookie',
      '*.cookie',
      'req.headers.cookie',
      'stripeSecretKey',
      '*.stripeSecretKey',
      'serviceRoleKey',
      '*.serviceRoleKey',
      'supabaseSecretKey',
      '*.supabaseSecretKey',
      'DB_SECRET_KEY',
      'STRIPE_SECRET_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      // Der Fallcode ist ein Zugangsmittel (Issue #145). Bewusst NICHT der
      // generische Schlüssel `code` — dort stehen Fehlercodes.
      'caseCode',
      '*.caseCode',
      'case_code',
      '*.case_code',
      'expectedCode',
      '*.expectedCode',
    ],
    censor: '[REDACTED]',
  },

  hooks: {
    // Zweite Linie gegen Fallcodes im Log: Die Redaktion oben greift nur bei
    // bekannten Feldnamen. Dieser Hook sieht die fertige JSON-Zeile — samt
    // Nachricht, Fehlermeldung und Stacktrace — unmittelbar vor dem Schreiben.
    // `formatters.log` wäre die falsche Stelle: Es läuft vor den Serializern,
    // ein `Error` ist dort noch ein `Error` mit nicht aufzählbarer `message`.
    // Wirkt nur serverseitig; im Browser kennt pino diesen Hook nicht.
    streamWrite: schwaerzeFallcodes,
  },

  ...(environment === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
  }),
};

export const logger = pino(loggerOptionen);

export function maskSecret(value?: string | null): string {
  if (!value) return 'undefined';
  if (value.length <= 9) return '***';
  return `${value.slice(0, 5)}...${value.slice(-4)}`;
}
