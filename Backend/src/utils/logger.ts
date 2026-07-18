// Winston logger utility

import winston from 'winston';
import { maskPII } from './pii.masker';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isDevelopment = process.env.NODE_ENV === 'development';

// Winston format to mask PII
const piiMaskFormat = winston.format((info) => {
  if (info.message && typeof info.message === 'string') {
    info.message = maskPII(info.message);
  }
  if (info.stack && typeof info.stack === 'string') {
    info.stack = maskPII(info.stack);
  }
  return info;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    piiMaskFormat(),
    json()
  ),
  defaultMeta: { service: 'unified-crm-api' },
  transports: [
    new winston.transports.Console({
      format: isDevelopment
        ? combine(colorize(), simple())
        : combine(timestamp(), piiMaskFormat(), json()),
    }),
  ],
});

export default logger;
