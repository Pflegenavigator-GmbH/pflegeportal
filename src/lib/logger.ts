// src/lib/logger.ts
import pino from 'pino';

const environment = process.env.ENVIRONMENT || 'production';

const currentLogLevel = environment === 'development' ? 'debug' : 'info';

export const logger = pino({
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
    ],
    censor: '[REDACTED]',
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
});

export function maskSecret(value?: string | null): string {
  if (!value) return 'undefined';
  if (value.length <= 9) return '***';
  return `${value.slice(0, 5)}...${value.slice(-4)}`;
}