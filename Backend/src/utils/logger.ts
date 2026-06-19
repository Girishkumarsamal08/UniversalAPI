// Winston logger utility

import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'unified-crm-api' },
  transports: [
    new winston.transports.Console({
      format: isDevelopment
        ? combine(colorize(), simple())
        : combine(timestamp(), json()),
    }),
  ],
});

export default logger;
