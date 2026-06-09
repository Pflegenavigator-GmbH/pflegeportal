// src/lib/logger.ts
import pino from 'pino';

const environment = process.env.ENVIRONMENT || 'production';

const currentLogLevel = environment === 'development' ? 'debug' : 'info';

export const logger = pino({
    level: currentLogLevel,

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